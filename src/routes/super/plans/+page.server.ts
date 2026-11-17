import { fail } from '@sveltejs/kit';
import { requireSuperAdmin, DomainError } from '#lib/server/http';
import { listPlans, savePlan } from '#lib/features/platform/server/service';
import type { Actions, PageServerLoad } from './$types';

const str = (d: FormData, k: string) => String(d.get(k) ?? '').trim();

export const load: PageServerLoad = async (event) => {
	requireSuperAdmin(event);
	return { plans: await listPlans() };
};

export const actions: Actions = {
	save: async (event) => {
		const admin = requireSuperAdmin(event);
		const d = await event.request.formData();
		const id = str(d, 'id') || undefined;
		try {
			await savePlan(
				{
					name: str(d, 'name'),
					slug: str(d, 'slug'),
					description: str(d, 'description'),
					priceInr: str(d, 'priceInr') || 0,
					maxStudents: str(d, 'maxStudents'),
					maxAdmins: str(d, 'maxAdmins'),
					maxTests: str(d, 'maxTests'),
					modules: d.getAll('modules').map(String),
					active: d.get('active') === 'on'
				},
				admin.id,
				id
			);
			return { ok: true, message: id ? 'Plan updated' : 'Plan saved' };
		} catch (e) {
			if (e instanceof DomainError) return fail(e.status, { message: e.message });
			throw e;
		}
	}
};
