import { fail } from '@sveltejs/kit';
import { requireSuperAdmin } from '#lib/server/http';
import { createInstitute, listInstitutes, listPlans } from '#lib/features/platform/server/service';
import { DomainError } from '#lib/server/http';
import type { Actions, PageServerLoad } from './$types';

const str = (d: FormData, k: string) => String(d.get(k) ?? '').trim();

export const load: PageServerLoad = async (event) => {
	requireSuperAdmin(event);
	const [institutes, plans] = await Promise.all([listInstitutes(), listPlans()]);
	return { institutes, plans: plans.filter((p) => p.active) };
};

export const actions: Actions = {
	create: async (event) => {
		const admin = requireSuperAdmin(event);
		const d = await event.request.formData();
		try {
			const res = await createInstitute(
				{
					name: str(d, 'name'),
					slug: str(d, 'slug'),
					tagline: str(d, 'tagline'),
					contactEmail: str(d, 'contactEmail'),
					phone: str(d, 'phone'),
					address: str(d, 'address'),
					planId: str(d, 'planId'),
					adminName: str(d, 'adminName'),
					adminEmail: str(d, 'adminEmail'),
					adminPassword: str(d, 'adminPassword'),
					modules: d.getAll('modules').map(String)
				},
				admin.id
			);
			return { ok: true, message: `${res.institute.name} created. Admin: ${res.adminEmail}` };
		} catch (e) {
			if (e instanceof DomainError) return fail(e.status, { message: e.message });
			throw e;
		}
	}
};
