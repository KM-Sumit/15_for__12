// Super-admin platform service: institutes (tenants), plans, module configuration, admin accounts, audit.
// Every query here runs inside a super-admin request, whose reserved connection has app.bypass_rls = 'on'.
import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import type { z } from 'zod';
import { db } from '#lib/server/db';
import {
	attempts,
	auditLog,
	instituteMemberships,
	instituteModules,
	institutes,
	payments,
	plans,
	platformSettings,
	questions,
	studyMaterials,
	tests,
	users
} from '#lib/server/db/schema';
import { DomainError } from '#lib/server/http';
import { adminEmails } from '#lib/server/env';
import { MODULE_KEYS, type ModuleKey } from '#lib/features/platform/modules';
import { audit, moduleMatrix, setModule } from '#lib/server/tenant/context';
import { createTenantAccount, resetUserPassword } from '#lib/features/auth/server/password';
import { adminAccountInput, createInstituteInput, planInput, resetPasswordInput, updateInstituteInput } from '../schema';

const parse = <S extends z.ZodType>(s: S, v: unknown): z.infer<S> => {
	const r = s.safeParse(v);
	if (!r.success) throw new DomainError(400, r.error.issues[0]?.message ?? 'Check the form.');
	return r.data;
};

const n = (v: unknown) => Number(v ?? 0);

export async function listInstitutes() {
	const rows = await db()
		.select({
			i: institutes,
			planName: plans.name,
			students: sql<number>`(select count(*)::int from ${users} u where u.institute_id = ${institutes.id} and u.role = 'student')`.mapWith(Number),
			admins: sql<number>`(select count(*)::int from ${users} u where u.institute_id = ${institutes.id} and u.role in ('admin','teacher'))`.mapWith(Number),
			tests: sql<number>`(select count(*)::int from ${tests} t where t.institute_id = ${institutes.id})`.mapWith(Number),
			attempts: sql<number>`(select count(*)::int from ${attempts} a where a.institute_id = ${institutes.id})`.mapWith(Number),
			materials: sql<number>`(select count(*)::int from ${studyMaterials} m where m.institute_id = ${institutes.id})`.mapWith(Number)
		})
		.from(institutes)
		.leftJoin(plans, eq(plans.id, institutes.planId))
		.orderBy(desc(institutes.createdAt));
	return rows.map((r) => ({
		id: r.i.id,
		name: r.i.name,
		slug: r.i.slug,
		status: r.i.status,
		tagline: r.i.tagline,
		contactEmail: r.i.contactEmail,
		logoUrl: r.i.logoUrl,
		planName: r.planName ?? null,
		createdAt: r.i.createdAt.toISOString(),
		students: r.students,
		admins: r.admins,
		tests: r.tests,
		attempts: r.attempts,
		materials: r.materials
	}));
}

export async function platformStats() {
	const [[inst], [stu], [staff], [t], [att], [mat], [rev]] = await Promise.all([
		db()
			.select({
				total: count(),
				active: sql<number>`count(*) filter (where ${institutes.status} = 'active')::int`.mapWith(Number),
				suspended: sql<number>`count(*) filter (where ${institutes.status} = 'suspended')::int`.mapWith(Number)
			})
			.from(institutes),
		db().select({ n: count() }).from(users).where(eq(users.role, 'student')),
		db().select({ n: count() }).from(users).where(inArray(users.role, ['admin', 'teacher'])),
		db().select({ n: count() }).from(tests),
		db().select({ n: count() }).from(attempts),
		db().select({ n: count() }).from(studyMaterials),
		db().select({ n: sql<number>`coalesce(sum(case when ${payments.status} = 'paid' then ${payments.amountPaise} else 0 end), 0)::int`.mapWith(Number) }).from(payments)
	]);
	return {
		institutes: n(inst?.total),
		activeInstitutes: inst?.active ?? 0,
		suspendedInstitutes: inst?.suspended ?? 0,
		students: n(stu?.n),
		staff: n(staff?.n),
		tests: n(t?.n),
		attempts: n(att?.n),
		materials: n(mat?.n),
		revenuePaise: n(rev?.n)
	};
}

export async function getInstituteBundle(id: string) {
	const [inst] = await db().select().from(institutes).where(eq(institutes.id, id)).limit(1);
	if (!inst) throw new DomainError(404, 'Institute not found.');
	const [plan] = inst.planId ? await db().select().from(plans).where(eq(plans.id, inst.planId)).limit(1) : [];
	const modules = await moduleMatrix(id);
	const members = await db()
		.select({ user: users, membership: instituteMemberships })
		.from(instituteMemberships)
		.innerJoin(users, eq(users.id, instituteMemberships.userId))
		.where(eq(instituteMemberships.instituteId, id))
		.orderBy(desc(instituteMemberships.createdAt));
	const [stats] = await db()
		.select({
			students: sql<number>`(select count(*)::int from ${users} u where u.institute_id = ${id} and u.role = 'student')`.mapWith(Number),
			tests: sql<number>`(select count(*)::int from ${tests} t where t.institute_id = ${id})`.mapWith(Number),
			questions: sql<number>`(select count(*)::int from ${questions} q where q.institute_id = ${id})`.mapWith(Number),
			attempts: sql<number>`(select count(*)::int from ${attempts} a where a.institute_id = ${id})`.mapWith(Number),
			materials: sql<number>`(select count(*)::int from ${studyMaterials} m where m.institute_id = ${id})`.mapWith(Number)
		})
		.from(institutes)
		.where(eq(institutes.id, id))
		.limit(1);
	const recentAudit = await db()
		.select({ a: auditLog, actor: users.name, actorEmail: users.email })
		.from(auditLog)
		.leftJoin(users, eq(users.id, auditLog.actorId))
		.where(eq(auditLog.instituteId, id))
		.orderBy(desc(auditLog.createdAt))
		.limit(20);
	return {
		institute: {
			...inst,
			createdAt: inst.createdAt.toISOString(),
			updatedAt: inst.updatedAt.toISOString(),
			suspendedAt: inst.suspendedAt?.toISOString() ?? null
		},
		plan: plan ?? null,
		modules,
		members: members.map(({ user, membership }) => ({
			id: user.id,
			name: user.name,
			email: user.email,
			role: membership.role,
			status: membership.status,
			suspended: Boolean(user.suspendedAt),
			hasPassword: Boolean(user.passwordHash),
			lastSeenAt: user.lastSeenAt?.toISOString() ?? null,
			createdAt: membership.createdAt.toISOString()
		})),
		stats,
		audit: recentAudit.map((r) => ({
			id: r.a.id,
			action: r.a.action,
			target: r.a.target,
			meta: r.a.meta,
			actor: r.actor ?? r.actorEmail ?? 'System',
			at: r.a.createdAt.toISOString()
		}))
	};
}

export async function createInstitute(raw: unknown, actorId: string | null) {
	const input = parse(createInstituteInput, raw);
	const [dupe] = await db().select({ id: institutes.id }).from(institutes).where(eq(institutes.slug, input.slug)).limit(1);
	if (dupe) throw new DomainError(409, 'That institute URL is already taken.');

	const plan = input.planId ? (await db().select().from(plans).where(eq(plans.id, input.planId)).limit(1))[0] : null;
	const defaultModules = (plan?.modules?.length ? plan.modules : MODULE_KEYS) as string[];
	const enabled = input.modules.length ? input.modules : defaultModules;

	const [inst] = await db()
		.insert(institutes)
		.values({
			name: input.name,
			slug: input.slug,
			tagline: input.tagline,
			contactEmail: input.contactEmail || null,
			phone: input.phone || null,
			address: input.address,
			planId: input.planId || null
		})
		.returning();
	if (!inst) throw new DomainError(503, 'Could not create the institute.');

	for (const key of MODULE_KEYS) await setModule(inst.id, key, enabled.includes(key));

	let admin;
	try {
		admin = await createTenantAccount({
			instituteId: inst.id,
			email: input.adminEmail,
			name: input.adminName,
			role: 'admin',
			password: input.adminPassword
		});
	} catch (e) {
		// Roll back the half-created tenant so the slug is not left unusable.
		await db().delete(institutes).where(eq(institutes.id, inst.id));
		throw e;
	}
	await audit({
		actorId,
		instituteId: inst.id,
		action: 'institute.create',
		target: inst.slug,
		meta: { name: inst.name, admin: admin.email }
	});
	return { institute: inst, adminEmail: admin.email };
}

export async function updateInstitute(id: string, raw: unknown, actorId: string | null) {
	const input = parse(updateInstituteInput, raw);
	const [inst] = await db()
		.update(institutes)
		.set({
			name: input.name,
			tagline: input.tagline,
			description: input.description,
			contactEmail: input.contactEmail || null,
			phone: input.phone || null,
			address: input.address,
			website: input.website || null,
			logoUrl: input.logoUrl || null,
			paymentLink: input.paymentLink || null,
			primaryColor: input.primaryColor,
			planId: input.planId || null,
			notes: input.notes
		})
		.where(eq(institutes.id, id))
		.returning();
	if (!inst) throw new DomainError(404, 'Institute not found.');
	await audit({ actorId, instituteId: id, action: 'institute.update', target: inst.slug });
	return inst;
}

export async function setInstituteStatus(id: string, status: 'active' | 'suspended', actorId: string | null) {
	const [inst] = await db()
		.update(institutes)
		.set({ status, suspendedAt: status === 'suspended' ? new Date() : null })
		.where(eq(institutes.id, id))
		.returning();
	if (!inst) throw new DomainError(404, 'Institute not found.');
	if (status === 'suspended') {
		// Revoke every member session immediately.
		await db()
			.update(users)
			.set({ sessionVersion: sql`${users.sessionVersion} + 1`, sessionUntil: null })
			.where(eq(users.instituteId, id));
	}
	await audit({ actorId, instituteId: id, action: `institute.${status}`, target: inst.slug });
	return inst;
}

export async function deleteInstitute(id: string, confirmName: string, actorId: string | null) {
	const [inst] = await db().select().from(institutes).where(eq(institutes.id, id)).limit(1);
	if (!inst) throw new DomainError(404, 'Institute not found.');
	if (confirmName.trim() !== inst.name) throw new DomainError(400, 'Type the institute name exactly to confirm deletion.');
	await audit({ actorId, instituteId: null, action: 'institute.delete', target: inst.slug, meta: { name: inst.name, id } });
	await db().update(users).set({ instituteId: null, sessionVersion: sql`${users.sessionVersion} + 1` }).where(eq(users.instituteId, id));
	await db().delete(institutes).where(eq(institutes.id, id));
}

export async function toggleModule(instituteId: string, key: string, enabled: boolean, actorId: string | null) {
	await setModule(instituteId, key, enabled);
	await audit({ actorId, instituteId, action: enabled ? 'module.enable' : 'module.disable', target: key });
}

export async function updateInstitutePlan(instituteId: string, planId: string | null, actorId: string | null) {
	await db().update(institutes).set({ planId }).where(eq(institutes.id, instituteId));
	await audit({ actorId, instituteId, action: 'institute.plan', target: planId ?? 'none' });
}

export async function createAdmin(instituteId: string, raw: unknown, actorId: string | null) {
	const input = parse(adminAccountInput, raw);
	// A listed ADMIN_EMAILS address would be promoted to platform super admin on its very next request
	// (restoreListedAdmin), which strips the institute attachment — refuse it here instead of silently
	// creating an account that can never reach this institute's console.
	if (adminEmails().has(input.email.toLowerCase()))
		throw new DomainError(409, 'This email is a platform super admin (ADMIN_EMAILS). It signs in to the platform console, not an institute. Use a different email for institute staff.');
	const user = await createTenantAccount({ instituteId, ...input });
	await audit({ actorId, instituteId, action: 'admin.create', target: user.email, meta: { role: input.role } });
	return user;
}

export async function resetPassword(instituteId: string, raw: unknown, actorId: string | null) {
	const input = parse(resetPasswordInput, raw);
	const [member] = await db()
		.select({ id: instituteMemberships.id })
		.from(instituteMemberships)
		.where(and(eq(instituteMemberships.userId, input.userId), eq(instituteMemberships.instituteId, instituteId)))
		.limit(1);
	if (!member) throw new DomainError(404, 'That account does not belong to this institute.');
	await resetUserPassword(input.userId, input.password);
	await audit({ actorId, instituteId, action: 'admin.password_reset', target: input.userId });
}

export async function setMemberSuspended(instituteId: string, userId: string, suspended: boolean, actorId: string | null) {
	const [member] = await db()
		.select({ id: instituteMemberships.id })
		.from(instituteMemberships)
		.where(and(eq(instituteMemberships.userId, userId), eq(instituteMemberships.instituteId, instituteId)))
		.limit(1);
	if (!member) throw new DomainError(404, 'That account does not belong to this institute.');
	await db()
		.update(users)
		.set({
			suspendedAt: suspended ? new Date() : null,
			sessionVersion: sql`${users.sessionVersion} + 1`,
			sessionUntil: null
		})
		.where(eq(users.id, userId));
	await audit({ actorId, instituteId, action: suspended ? 'account.suspend' : 'account.activate', target: userId });
}

export async function listPlans() {
	return (await db().select().from(plans).orderBy(plans.sortOrder, plans.name)).map((p) => ({
		...p,
		createdAt: p.createdAt.toISOString(),
		updatedAt: p.updatedAt.toISOString()
	}));
}

export async function savePlan(raw: unknown, actorId: string | null, id?: string) {
	const input = parse(planInput, raw);
	const values = {
		name: input.name,
		slug: input.slug,
		description: input.description,
		priceInr: input.priceInr,
		maxStudents: input.maxStudents === '' ? null : Number(input.maxStudents),
		maxAdmins: input.maxAdmins === '' ? null : Number(input.maxAdmins),
		maxTests: input.maxTests === '' ? null : Number(input.maxTests),
		modules: input.modules,
		active: input.active
	};
	if (id) {
		const [p] = await db().update(plans).set(values).where(eq(plans.id, id)).returning();
		if (!p) throw new DomainError(404, 'Plan not found.');
		await audit({ actorId, action: 'plan.update', target: p.slug });
		return p;
	}
	const [p] = await db()
		.insert(plans)
		.values(values)
		.onConflictDoUpdate({ target: plans.slug, set: values })
		.returning();
	await audit({ actorId, action: 'plan.create', target: p.slug });
	return p;
}

export async function getPlatformSettings() {
	const rows = await db().select().from(platformSettings);
	return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, unknown>;
}

/** Public-safe platform branding. Missing keys fall back to the product defaults. */
export async function platformBrand() {
	const s = await getPlatformSettings();
	const text = (key: string, fallback: string) => (typeof s[key] === 'string' && s[key] ? String(s[key]) : fallback);
	return {
		name: text('brand_name', 'EduSphere'),
		tagline: text('brand_tagline', 'The operating system for modern coaching institutes.'),
		supportEmail: text('support_email', ''),
		supportPhone: text('support_phone', ''),
		footerNote: text('footer_note', 'Tests, study material, results and student management in one multi-tenant workspace.')
	};
}

export async function savePlatformSettings(key: string, value: unknown, actorId: string | null) {
	if (!/^[a-z0-9_.-]{2,80}$/i.test(key)) throw new DomainError(400, 'Invalid setting key.');
	await db()
		.insert(platformSettings)
		.values({ key, value })
		.onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedAt: new Date() } });
	await audit({ actorId, action: 'platform.setting', target: key });
}

export async function listAudit(limit = 100, instituteId?: string | null) {
	const rows = await db()
		.select({ a: auditLog, actor: users.name, actorEmail: users.email, institute: institutes.name })
		.from(auditLog)
		.leftJoin(users, eq(users.id, auditLog.actorId))
		.leftJoin(institutes, eq(institutes.id, auditLog.instituteId))
		.where(instituteId ? eq(auditLog.instituteId, instituteId) : undefined)
		.orderBy(desc(auditLog.createdAt))
		.limit(Math.min(Math.max(limit, 1), 500));
	return rows.map((r) => ({
		id: r.a.id,
		action: r.a.action,
		target: r.a.target,
		meta: r.a.meta,
		institute: r.institute ?? 'Platform',
		actor: r.actor || r.actorEmail || 'System',
		at: r.a.createdAt.toISOString()
	}));
}

export async function publicInstitutes() {
	const rows = await db()
		.select({
			id: institutes.id,
			name: institutes.name,
			slug: institutes.slug,
			tagline: institutes.tagline,
			description: institutes.description,
			logoUrl: institutes.logoUrl,
			primaryColor: institutes.primaryColor,
			address: institutes.address
		})
		.from(institutes)
		.where(eq(institutes.status, 'active'))
		.orderBy(institutes.name)
		.limit(60);
	return rows;
}

export async function getPublicInstitute(slug: string) {
	const [row] = await db()
		.select()
		.from(institutes)
		.where(and(eq(institutes.slug, slug.toLowerCase()), eq(institutes.status, 'active')))
		.limit(1);
	return row ?? null;
}

export type ModuleToggle = { key: ModuleKey; enabled: boolean; overridden: boolean };
