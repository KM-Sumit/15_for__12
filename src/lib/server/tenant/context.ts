import { and, eq } from 'drizzle-orm';
import { db, requestScope } from '#lib/server/db';
import { auditLog, instituteMemberships, instituteModules, institutes, plans, users } from '#lib/server/db/schema';
import { DomainError } from '#lib/server/http';
import { DEFAULT_MODULES, MODULE_KEYS, type ModuleKey } from '#lib/features/platform/modules';

export type TenantRole = 'admin' | 'teacher' | 'student';

export type TenantInfo = {
	instituteId: string;
	instituteName: string;
	slug: string;
	role: TenantRole;
	modules: ModuleKey[];
	institute: typeof institutes.$inferSelect;
};

/**
 * The only source of tenant context. Called once per request in hooks.server.ts after the user row is loaded.
 * The browser never supplies an institute id; membership is verified against the database every request.
 * Students may belong to several institutes: `preferredInstituteId` (a cookie) picks which one this
 * request uses, falling back to the first active membership. Staff only ever have one.
 */
export async function resolveTenant(
	userId: string,
	preferredInstituteId?: string | null
): Promise<{ tenant: TenantInfo } | { error: 'none' | 'suspended' | 'disabled' }> {
	const rows = await db()
		.select({ membership: instituteMemberships, institute: institutes, planModules: plans.modules })
		.from(instituteMemberships)
		.innerJoin(institutes, eq(institutes.id, instituteMemberships.instituteId))
		.leftJoin(plans, eq(plans.id, institutes.planId))
		.where(and(eq(instituteMemberships.userId, userId), eq(instituteMemberships.status, 'active')));
	if (!rows.length) return { error: 'none' };
	const pick =
		rows.find((r) => r.institute.id === preferredInstituteId) ??
		rows.find((r) => !r.institute.suspendedAt && r.institute.status !== 'suspended') ??
		rows[0];
	if (pick.institute.suspendedAt || pick.institute.status === 'suspended') return { error: 'suspended' };
	const enabled = await enabledModules(pick.institute.id, pick.planModules ?? DEFAULT_MODULES);
	return {
		tenant: {
			instituteId: pick.institute.id,
			instituteName: pick.institute.name,
			slug: pick.institute.slug,
			role: pick.membership.role,
			modules: enabled,
			institute: pick.institute
		}
	};
}

/** Plan defaults, then explicit per-institute overrides. Unknown keys are ignored. */
export async function enabledModules(instituteId: string, planDefaults: string[] = DEFAULT_MODULES): Promise<ModuleKey[]> {
	const overrides = await db()
		.select({ key: instituteModules.moduleKey, enabled: instituteModules.enabled })
		.from(instituteModules)
		.where(eq(instituteModules.instituteId, instituteId));
	const map = new Map<ModuleKey, boolean>();
	for (const k of planDefaults) if ((MODULE_KEYS as string[]).includes(k)) map.set(k as ModuleKey, true);
	for (const k of DEFAULT_MODULES) if (!map.has(k)) map.set(k, true);
	for (const o of overrides) if ((MODULE_KEYS as string[]).includes(o.key)) map.set(o.key as ModuleKey, o.enabled);
	return [...map.entries()].filter(([, on]) => on).map(([k]) => k);
}

/** Full module matrix for the super-admin/institute settings screens. */
export async function moduleMatrix(instituteId: string) {
	const [inst] = await db()
		.select({ planModules: plans.modules, planName: plans.name })
		.from(institutes)
		.leftJoin(plans, eq(plans.id, institutes.planId))
		.where(eq(institutes.id, instituteId))
		.limit(1);
	const overrides = new Map(
		(await db().select().from(instituteModules).where(eq(instituteModules.instituteId, instituteId))).map((r) => [r.moduleKey, r.enabled])
	);
	return MODULE_KEYS.map((key) => ({
		key,
		enabled: overrides.get(key) ?? ((inst?.planModules ?? DEFAULT_MODULES) as string[]).includes(key),
		overridden: overrides.has(key)
	}));
}

export async function setModule(instituteId: string, key: string, enabled: boolean) {
	if (!(MODULE_KEYS as string[]).includes(key)) throw new DomainError(400, 'Unknown module.');
	await db()
		.insert(instituteModules)
		.values({ instituteId, moduleKey: key, enabled })
		.onConflictDoUpdate({ target: [instituteModules.instituteId, instituteModules.moduleKey], set: { enabled, updatedAt: new Date() } });
}

export const hasModule = (t: Pick<TenantInfo, 'modules'> | null | undefined, key: ModuleKey) => !!t?.modules.includes(key);

export function assertModule(tenant: Pick<TenantInfo, 'modules'> | null | undefined, key: ModuleKey) {
	if (!hasModule(tenant, key)) throw new DomainError(403, 'This module is not enabled for your institute.');
}

/** Audit trail for important platform + tenant actions. Never throws into the caller. */
export async function audit(entry: {
	actorId: string | null;
	instituteId?: string | null;
	action: string;
	target?: string;
	meta?: Record<string, unknown>;
}) {
	try {
		await db()
			.insert(auditLog)
			.values({
				actorId: entry.actorId,
				instituteId: entry.instituteId ?? null,
				action: entry.action,
				target: entry.target ?? '',
				meta: entry.meta ?? null
			});
	} catch (e) {
		console.error('[audit] write failed', entry.action, e);
	}
}

/** Tenant id bound to this request (set by hooks). null for super admins, anonymous visitors and scripts. */
export function currentInstituteId(): string | null {
	return requestScope()?.instituteId ?? null;
}

export function requireInstituteId(): string {
	const id = currentInstituteId();
	if (!id) throw new DomainError(403, 'No coaching institute is assigned to this request.');
	return id;
}

/** Tenant id + role for the current request, from locals (set by hooks). */
export function requireTenant(event: { locals: App.Locals }): TenantInfo {
	const t = event.locals.tenant;
	if (!t) throw new DomainError(403, 'No coaching institute is assigned to this account.');
	return t;
}

export function requireTenantAdmin(event: { locals: App.Locals }): TenantInfo & { user: NonNullable<App.Locals['user']> } {
	const t = requireTenant(event);
	if (t.role !== 'admin') throw new DomainError(403, 'Only the coaching admin can do this.');
	const user = event.locals.user;
	if (!user) throw new DomainError(401, 'Sign in to continue.');
	return { ...t, user };
}

/** Teacher OR admin (content management). */
export function requireTenantStaff(event: { locals: App.Locals }) {
	const t = requireTenant(event);
	if (t.role !== 'admin' && t.role !== 'teacher') throw new DomainError(403, 'Only staff can do this.');
	return t;
}

export const isTenantStaff = (t: Pick<TenantInfo, 'role'> | null | undefined) => t?.role === 'admin' || t?.role === 'teacher';

export async function userByEmail(email: string) {
	const [u] = await db().select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
	return u ?? null;
}
