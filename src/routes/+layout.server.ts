import { toSessionUser } from '#lib/features/auth/schema';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	const base = locals.user ? toSessionUser(locals.user) : null;
	const user = base
		? {
				...base,
				instituteId: locals.tenant?.instituteId ?? null,
				instituteName: locals.tenant?.instituteName ?? null,
				instituteSlug: locals.tenant?.slug ?? null
			}
		: null;
	return {
		user,
		tenant: locals.tenant
			? {
					instituteId: locals.tenant.instituteId,
					instituteName: locals.tenant.instituteName,
					slug: locals.tenant.slug,
					role: locals.tenant.role,
					modules: locals.tenant.modules,
					logoUrl: locals.tenant.institute.logoUrl,
					primaryColor: locals.tenant.institute.primaryColor,
					tagline: locals.tenant.institute.tagline
				}
			: null,
		isSuperAdmin: locals.isSuperAdmin,
		modules: locals.enabledModules
	};
};
