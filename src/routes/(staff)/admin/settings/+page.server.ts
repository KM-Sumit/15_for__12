import { error, fail, redirect } from '@sveltejs/kit';
import { requireTenant, moduleMatrix, audit } from '#lib/server/tenant/context';
import { getInstituteProfile, updateInstituteProfile } from '#lib/features/platform/server/tenant';
import { changeOwnPassword } from '#lib/features/auth/server/password';
import { DomainError } from '#lib/server/http';
import type { Actions, PageServerLoad } from './$types';

const str = (d: FormData, k: string) => String(d.get(k) ?? '').trim();

function admin(event: { locals: App.Locals }) {
	const tenant = requireTenant(event);
	if (tenant.role !== 'admin') error(403, 'Only the coaching admin can open institute settings.');
	return tenant;
}

export const load: PageServerLoad = async (event) => {
	const tenant = admin(event);
	const [profile, modules] = await Promise.all([getInstituteProfile(tenant.instituteId), moduleMatrix(tenant.instituteId)]);
	return { profile, modules, hasPassword: Boolean(event.locals.user?.passwordHash) };
};

async function run(fn: () => Promise<unknown>, success: string) {
	try {
		await fn();
		return { message: success };
	} catch (e) {
		if (e instanceof DomainError) return fail(e.status, { message: e.message });
		throw e;
	}
}

export const actions: Actions = {
	profile: async (event) => {
		const tenant = admin(event);
		const d = await event.request.formData();
		const res = await run(
			() =>
				updateInstituteProfile(
					tenant.instituteId,
					{
						name: str(d, 'name'),
						tagline: str(d, 'tagline'),
						description: str(d, 'description'),
						contactEmail: str(d, 'contactEmail'),
						phone: str(d, 'phone'),
						address: str(d, 'address'),
						website: str(d, 'website'),
						logoUrl: str(d, 'logoUrl'),
						primaryColor: str(d, 'primaryColor') || '#e2580b'
					},
					event.locals.user!.id
				),
			'Institute profile saved'
		);
		return res;
	},
	password: async (event) => {
		admin(event);
		const d = await event.request.formData();
		const current = str(d, 'currentPassword');
		const next = str(d, 'newPassword');
		const confirm = str(d, 'confirmPassword');
		if (next !== confirm) return fail(400, { message: 'The new passwords do not match.' });
		const res = await run(async () => {
			await changeOwnPassword(event.locals.user!.id, current, next);
			await audit({ actorId: event.locals.user!.id, instituteId: event.locals.user!.instituteId, action: 'account.password_change' });
		}, 'Password updated. Sign in again on other devices.');
		return res;
	},
	modules: async (event) => {
		// Module switches belong to the platform owner; this action only documents the read-only list.
		admin(event);
		redirect(303, '/admin/settings');
	}
};
