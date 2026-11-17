import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '#lib/server/db';
import { instituteMemberships, institutes, users, type User } from '#lib/server/db/schema';
import { DomainError } from '#lib/server/http';

export const hashPassword = (password: string) => Bun.password.hash(password);

export async function verifyPassword(hash: string | null | undefined, password: string) {
	if (!hash || !password) return false;
	return Bun.password.verify(password, hash).catch(() => false);
}

// Deliberately generic: never reveal whether the email exists.
export async function signInWithPassword(email: string, password: string): Promise<User> {
	const [u] = await db().select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
	if (!u || !(await verifyPassword(u.passwordHash, password))) throw new DomainError(401, 'Wrong email or password.');
	if (u.suspendedAt) throw new DomainError(403, 'This account is suspended.');
	return u;
}

/** Best-effort dummy verification to flatten timing differences for unknown accounts. */
export async function burnPasswordCheck(password: string) {
	const dummy = '$argon2id$v=19$m=65536,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$YQ0e8Yh0Fh0Fh0Fh0Fh0Fh0Fh0Fh0Fh0Fh0Fh0';
	await verifyPassword(dummy, password);
}

/**
 * One membership per (user, institute). Students may hold several (they can study at two coachings and
 * take both institutes' tests — data stays separate via RLS). Staff belong to exactly one institute;
 * creating/attaching a membership also mirrors the primary institute and role onto the user row so
 * tenant-scoped queries (users list, grants search) stay simple.
 */
export async function attachMembership(userId: string, instituteId: string, role: 'admin' | 'teacher' | 'student') {
	const [inst] = await db().select().from(institutes).where(eq(institutes.id, instituteId)).limit(1);
	if (!inst) throw new DomainError(404, 'Institute not found.');
	if (inst.status !== 'active' || inst.suspendedAt) throw new DomainError(403, 'This institute is suspended.');

	const rows = await db().select().from(instituteMemberships).where(eq(instituteMemberships.userId, userId));
	const mine = rows.find((r) => r.instituteId === instituteId);
	// Staff accounts are single-institute: attaching them elsewhere is refused, and a staff account
	// cannot pick up a student membership at a second institute either.
	if (rows.some((r) => r.instituteId !== instituteId && r.role !== 'student') || (!mine && rows.length > 0 && role !== 'student'))
		throw new DomainError(409, 'This account already belongs to another institute.');
	if (!mine && rows.length > 0 && rows.some((r) => r.role !== 'student'))
		throw new DomainError(409, 'This account is staff at another institute.');

	if (mine) {
		await db()
			.update(instituteMemberships)
			.set({ role, status: 'active', updatedAt: new Date() })
			.where(eq(instituteMemberships.id, mine.id));
	} else {
		await db().insert(instituteMemberships).values({ instituteId, userId, role });
	}
	// The user row keeps the FIRST institute (students joining more keep their original as primary);
	// people lists filter by membership, so the mirror is only a display/default convenience.
	await db()
		.update(users)
		.set({ instituteId: sql`coalesce(${users.instituteId}, ${instituteId})`, role })
		.where(eq(users.id, userId));
}

/** Super-admin action: create a coaching admin (or teacher) account with a password. */
export async function createTenantAccount(opts: {
	instituteId: string;
	email: string;
	name?: string;
	role: 'admin' | 'teacher' | 'student';
	password: string;
}) {
	const email = opts.email.trim().toLowerCase();
	if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new DomainError(400, 'Enter a valid email address.');
	if (opts.password.length < 8) throw new DomainError(400, 'Password must be at least 8 characters.');
	const [inst] = await db().select().from(institutes).where(eq(institutes.id, opts.instituteId)).limit(1);
	if (!inst) throw new DomainError(404, 'Institute not found.');

	const [existing] = await db().select().from(users).where(eq(users.email, email)).limit(1);
	let user = existing;
	if (user) {
		const [member] = await db().select().from(instituteMemberships).where(eq(instituteMemberships.userId, user.id)).limit(1);
		if (member && member.instituteId !== opts.instituteId)
			throw new DomainError(409, 'That email already belongs to another institute.');
		const [updated] = await db()
			.update(users)
			.set({
				name: user.name || opts.name?.trim() || email.split('@')[0],
				passwordHash: await hashPassword(opts.password),
				instituteId: opts.instituteId,
				role: opts.role,
				suspendedAt: null,
				sessionVersion: user.sessionVersion + 1
			})
			.where(eq(users.id, user.id))
			.returning();
		user = updated;
	} else {
		const [created] = await db()
			.insert(users)
			.values({
				email,
				name: opts.name?.trim() || email.split('@')[0],
				passwordHash: await hashPassword(opts.password),
				instituteId: opts.instituteId,
				role: opts.role
			})
			.returning();
		user = created;
	}
	await attachMembership(user!.id, opts.instituteId, opts.role);
	return user!;
}

export async function resetUserPassword(userId: string, password: string) {
	if (password.length < 8) throw new DomainError(400, 'Password must be at least 8 characters.');
	const [u] = await db()
		.update(users)
		.set({ passwordHash: await hashPassword(password), sessionVersion: (await currentVersion(userId)) + 1 })
		.where(eq(users.id, userId))
		.returning({ id: users.id });
	if (!u) throw new DomainError(404, 'Account not found.');
}

/** Signed-in password change. The current password is required if the account already has one. */
export async function changeOwnPassword(userId: string, current: string, next: string) {
	if (next.length < 8) throw new DomainError(400, 'New password must be at least 8 characters.');
	const [u] = await db().select({ hash: users.passwordHash }).from(users).where(eq(users.id, userId)).limit(1);
	if (!u) throw new DomainError(404, 'Account not found.');
	if (u.hash && !(await verifyPassword(u.hash, current))) throw new DomainError(401, 'Current password is incorrect.');
	const [row] = await db()
		.update(users)
		.set({ passwordHash: await hashPassword(next), sessionVersion: (await currentVersion(userId)) + 1 })
		.where(eq(users.id, userId))
		.returning({ id: users.id });
	if (!row) throw new DomainError(404, 'Account not found.');
}

async function currentVersion(userId: string) {
	const [u] = await db().select({ v: users.sessionVersion }).from(users).where(eq(users.id, userId)).limit(1);
	return u?.v ?? 0;
}

/** Google sign-up from an institute page: attach the new/existing Google account to that institute as a student. */
export async function joinInstituteAsStudent(userId: string, instituteId: string) {
	const rows = await db()
		.select({ instituteId: instituteMemberships.instituteId, role: instituteMemberships.role })
		.from(instituteMemberships)
		.where(eq(instituteMemberships.userId, userId));
	// Staff stay single-institute; students may join as many institutes as they study at.
	if (rows.some((r) => r.role !== 'student')) throw new DomainError(403, 'Staff accounts belong to one institute only.');
	if (rows.some((r) => r.instituteId === instituteId)) return instituteId; // already joined — nothing to do
	await attachMembership(userId, instituteId, 'student');
	return instituteId;
}

export async function joinInstituteBySlug(userId: string, slug: string) {
	const inst = await peekInstituteBySlug(slug);
	await joinInstituteAsStudent(userId, inst.id);
	return inst.id;
}

/** Every institute this user is an active member of (students may have several). */
export async function listStudentInstitutes(userId: string) {
	return db()
		.select({ id: institutes.id, name: institutes.name, slug: institutes.slug, logoUrl: institutes.logoUrl })
		.from(instituteMemberships)
		.innerJoin(institutes, eq(institutes.id, instituteMemberships.instituteId))
		.where(and(eq(instituteMemberships.userId, userId), eq(instituteMemberships.status, 'active')))
		.orderBy(asc(instituteMemberships.createdAt));
}

/** Student switches which institute's dashboard/tests they are using right now. */
export async function switchActiveInstitute(userId: string, instituteId: string) {
	if (!/^[0-9a-f-]{36}$/i.test(instituteId)) throw new DomainError(400, 'Unknown institute.');
	const [m] = await db()
		.select({ id: instituteMemberships.id })
		.from(instituteMemberships)
		.where(
			and(
				eq(instituteMemberships.userId, userId),
				eq(instituteMemberships.instituteId, instituteId),
				eq(instituteMemberships.status, 'active')
			)
		)
		.limit(1);
	if (!m) throw new DomainError(403, 'You are not a member of that institute.');
}

/** Resolve an institute join code without touching memberships — used to validate /signup codes early. */
export async function peekInstituteBySlug(slug: string) {
	const [inst] = await db().select().from(institutes).where(eq(institutes.slug, slug.toLowerCase())).limit(1);
	if (!inst) throw new DomainError(404, 'No institute matches that code. Check it and try again.');
	if (inst.status !== 'active' || inst.suspendedAt) throw new DomainError(403, 'That institute is not accepting students right now.');
	return inst;
}

/** Public sign-up: a student creates their own email + password account (no institute attached yet). */
export async function signUpStudent(raw: { name: string; email: string; password: string }) {
	const name = raw.name.trim();
	const email = raw.email.trim().toLowerCase();
	if (name.length < 2) throw new DomainError(400, 'Enter your full name.');
	if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new DomainError(400, 'Enter a valid email address.');
	if (raw.password.length < 8) throw new DomainError(400, 'Password must be at least 8 characters.');
	const [existing] = await db().select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
	if (existing) throw new DomainError(409, 'An account with this email already exists. Sign in on the login page with the password your institute gave you.');
	const [created] = await db()
		.insert(users)
		.values({ email, name, passwordHash: await hashPassword(raw.password), role: 'student' })
		.returning();
	return created!;
}

export async function membershipOf(userId: string) {
	const [row] = await db()
		.select({ membership: instituteMemberships, institute: institutes })
		.from(instituteMemberships)
		.innerJoin(institutes, eq(institutes.id, instituteMemberships.instituteId))
		.where(and(eq(instituteMemberships.userId, userId), eq(instituteMemberships.status, 'active')))
		.limit(1);
	return row ?? null;
}
