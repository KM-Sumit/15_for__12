import { requireSuperAdmin } from '#lib/server/http';
import { listAudit, listInstitutes, platformStats } from '#lib/features/platform/server/service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireSuperAdmin(event);
	const [stats, institutes, audit] = await Promise.all([platformStats(), listInstitutes(), listAudit(8)]);
	return { stats, recent: institutes.slice(0, 6), audit };
};
