// Accounts are Google-only: a verified Google identity signs in, links to an existing row with the same
// email, or creates a student. ADMIN_EMAILS are promoted to admin on every sign-in and every request.
import { and, eq, isNull, sql } from 'drizzle-orm';
import type { GoogleIdentity } from '#lib/server/auth/google';
import { db } from '#lib/server/db';
import { users, type User } from '#lib/server/db/schema';
import { adminEmails } from '#lib/server/env';
import { SESSION_HOLD_MS, studentHoldDecision } from './device';

const SEEN_EVERY_MS = 5 * 60_000;

export async function getUser(id: string): Promise<User | null> {
	const [u] = await db().select().from(users).where(eq(users.id, id)).limit(1);
	return u ?? null;
}

/** Listed emails become platform super admins. They keep that role on every request. */
export async function restoreListedAdmin(u: User): Promise<User> {
	if (u.role === 'super_admin' || !adminEmails().has(u.email.toLowerCase())) return u;
	const [next] = await db().update(users).set({ role: 'super_admin', instituteId: null }).where(eq(users.id, u.id)).returning();
	return next ?? u;
}

async function hasSuperAdmin() {
	const [row] = await db()
		.select({ n: sql<number>`count(*)::int` })
		.from(users)
		.where(and(eq(users.role, 'super_admin'), isNull(users.suspendedAt)));
	return Number(row?.n ?? 0) > 0;
}

export async function signInWithGoogle(g: GoogleIdentity): Promise<{ user: User } | { error: 'suspended' }> {
	const email = g.email.toLowerCase();
	const name = `${g.firstName} ${g.lastName}`.trim();
	// First ever account, or a listed email, owns the platform. Everyone else is a tenant member.
	const superAdmin = adminEmails().has(email) || !(await hasSuperAdmin());
	const [bySub] = await db().select().from(users).where(eq(users.googleSub, g.sub)).limit(1);
	const existing = bySub ?? (await db().select().from(users).where(eq(users.email, email)).limit(1))[0];

	if (existing) {
		if (existing.suspendedAt) return { error: 'suspended' };
		const [user] = await db()
			.update(users)
			.set({
				googleSub: g.sub, // Google verified this email, so the address owner is this Google account
				name: existing.name || name, // a name edited in the profile wins
				avatarUrl: g.picture ?? existing.avatarUrl,
				// Never demote staff here. A listed email becomes the platform super admin only if it has no tenant.
				role: superAdmin && !existing.instituteId ? 'super_admin' : existing.role,
				instituteId: superAdmin && !existing.instituteId ? null : existing.instituteId,
				lastSeenAt: new Date()
			})
			.where(eq(users.id, existing.id))
			.returning();
		return { user: user! };
	}

	const [user] = await db()
		.insert(users)
		.values({ email, googleSub: g.sub, name, avatarUrl: g.picture, role: superAdmin ? 'super_admin' : 'student', lastSeenAt: new Date() })
		.returning();
	return { user: user! };
}

/**
 * Students may be signed in on one browser only. The browser that already holds the cookie can
 * sign in again; any other phone or laptop is refused until sign-out or the hold expires.
 */
export async function beginStudentSession(user: User, sameBrowser: boolean): Promise<{ user: User } | { error: 'in_use' }> {
	const decision = studentHoldDecision(user, sameBrowser);
	if (decision === 'busy') return { error: 'in_use' };
	if (user.role !== 'student') return { user };
	const until = new Date(Date.now() + SESSION_HOLD_MS);
	const [next] = await db()
		.update(users)
		.set({
			sessionUntil: until,
			lastSeenAt: new Date(),
			...(decision === 'replace' ? { sessionVersion: sql`${users.sessionVersion} + 1` } : {})
		})
		.where(eq(users.id, user.id))
		.returning();
	return { user: next ?? user };
}

/** Logout: every token issued before this stops matching, and the account can sign in on a new device. */
export async function bumpSessionVersion(userId: string) {
	await db()
		.update(users)
		.set({ sessionVersion: sql`${users.sessionVersion} + 1`, sessionUntil: null })
		.where(eq(users.id, userId));
}

/** Throttled presence: at most one write per user per 5 minutes. Keeps a student hold alive while they use the app. */
export async function touchLastSeen(u: Pick<User, 'id' | 'lastSeenAt'>, now = new Date()) {
	if (u.lastSeenAt && now.getTime() - u.lastSeenAt.getTime() < SEEN_EVERY_MS) return false;
	const until = new Date(now.getTime() + SESSION_HOLD_MS);
	await db()
		.update(users)
		.set({
			lastSeenAt: now,
			sessionUntil: sql`case when ${users.sessionUntil} is null then null else ${until.toISOString()}::timestamptz end`
		})
		.where(eq(users.id, u.id));
	return true;
}
