import { fail, redirect } from '@sveltejs/kit';
import { requireSuperAdmin, DomainError } from '#lib/server/http';
import {
	createAdmin,
	deleteInstitute,
	getInstituteBundle,
	listPlans,
	resetPassword,
	setInstituteStatus,
	setMemberSuspended,
	toggleModule,
	updateInstitute,
	updateInstitutePlan
} from '#lib/features/platform/server/service';
import type { Actions, PageServerLoad } from './$types';

const str = (d: FormData, k: string) => String(d.get(k) ?? '').trim();

async function run(fn: () => Promise<unknown>, success: string) {
	try {
		await fn();
		return { ok: true, message: success };
	} catch (e) {
		if (e instanceof DomainError) return fail(e.status, { message: e.message });
		throw e;
	}
}

export const load: PageServerLoad = async (event) => {
	requireSuperAdmin(event);
	const [bundle, plans] = await Promise.all([getInstituteBundle(event.params.id), listPlans()]);
	return { ...bundle, plans: plans.filter((p) => p.active) };
};

export const actions: Actions = {
	profile: async (event) => {
		const admin = requireSuperAdmin(event);
		const d = await event.request.formData();
		return run(
			() =>
				updateInstitute(
					event.params.id,
					{
						name: str(d, 'name'),
						tagline: str(d, 'tagline'),
						description: str(d, 'description'),
						contactEmail: str(d, 'contactEmail'),
						phone: str(d, 'phone'),
						address: str(d, 'address'),
						website: str(d, 'website'),
						logoUrl: str(d, 'logoUrl'),
						paymentLink: str(d, 'paymentLink'),
						primaryColor: str(d, 'primaryColor') || '#e2580b',
						planId: str(d, 'planId'),
						notes: str(d, 'notes')
					},
					admin.id
				),
			'Institute profile saved'
		);
	},
	status: async (event) => {
		const admin = requireSuperAdmin(event);
		const d = await event.request.formData();
		const status = str(d, 'status') === 'suspended' ? 'suspended' : 'active';
		return run(() => setInstituteStatus(event.params.id, status, admin.id), status === 'suspended' ? 'Institute suspended' : 'Institute activated');
	},
	plan: async (event) => {
		const admin = requireSuperAdmin(event);
		const d = await event.request.formData();
		const planId = str(d, 'planId') || null;
		return run(() => updateInstitutePlan(event.params.id, planId, admin.id), 'Plan updated');
	},
	module: async (event) => {
		const admin = requireSuperAdmin(event);
		const d = await event.request.formData();
		return run(() => toggleModule(event.params.id, str(d, 'key'), str(d, 'enabled') === 'true', admin.id), 'Module updated');
	},
	admin: async (event) => {
		const admin = requireSuperAdmin(event);
		const d = await event.request.formData();
		return run(
			() =>
				createAdmin(
					event.params.id,
					{ email: str(d, 'email'), name: str(d, 'name'), role: str(d, 'role') || 'admin', password: str(d, 'password') },
					admin.id
				),
			'Account created'
		);
	},
	reset: async (event) => {
		const admin = requireSuperAdmin(event);
		const d = await event.request.formData();
		return run(() => resetPassword(event.params.id, { userId: str(d, 'userId'), password: str(d, 'password') }, admin.id), 'Password reset');
	},
	suspend: async (event) => {
		const admin = requireSuperAdmin(event);
		const d = await event.request.formData();
		const suspended = str(d, 'suspended') === 'true';
		return run(() => setMemberSuspended(event.params.id, str(d, 'userId'), suspended, admin.id), suspended ? 'Account suspended' : 'Account reactivated');
	},
	delete: async (event) => {
		const admin = requireSuperAdmin(event);
		const d = await event.request.formData();
		const res = await run(() => deleteInstitute(event.params.id, str(d, 'confirmName'), admin.id), 'Institute deleted');
		if ('ok' in res) redirect(303, '/super/institutes');
		return res;
	}
};
