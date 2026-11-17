import { assertModule, requireTenantStaff } from '#lib/server/tenant/context';
import { tenantReport } from '#lib/features/platform/server/reports';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const tenant = requireTenantStaff(event);
	assertModule(tenant, 'reports');
	const report = await tenantReport(tenant.instituteId);
	return { ...report, institute: tenant.instituteName };
};
