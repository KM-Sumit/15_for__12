import { fail } from '@sveltejs/kit';
import { assertModule, requireTenantStaff } from '#lib/server/tenant/context';
import { createMaterial, deleteMaterial, listMaterials, setMaterialPublished, updateMaterial } from '#lib/features/materials/server/service';
import { DomainError } from '#lib/server/http';
import type { Actions, PageServerLoad } from './$types';

const str = (d: FormData, k: string) => String(d.get(k) ?? '').trim();

export const load: PageServerLoad = async (event) => {
	const tenant = requireTenantStaff(event);
	assertModule(tenant, 'study_materials');
	return { materials: await listMaterials(), canEdit: tenant.role === 'admin' || tenant.role === 'teacher' };
};

async function run(fn: () => Promise<unknown>, message: string) {
	try {
		await fn();
		return { message };
	} catch (e) {
		if (e instanceof DomainError) return fail(e.status, { message: e.message });
		throw e;
	}
}

const values = (d: FormData) => ({
	title: str(d, 'title'),
	description: str(d, 'description'),
	kind: str(d, 'kind') || 'text',
	url: str(d, 'url'),
	body: str(d, 'body'),
	subjectId: str(d, 'subjectId'),
	published: d.get('published') === 'on'
});

export const actions: Actions = {
	create: async (event) => {
		const me = requireTenantStaff(event);
		assertModule(me, 'study_materials');
		const d = await event.request.formData();
		return run(() => createMaterial(values(d), event.locals.user!.id), 'Material created');
	},
	update: async (event) => {
		const me = requireTenantStaff(event);
		assertModule(me, 'study_materials');
		const d = await event.request.formData();
		return run(() => updateMaterial(str(d, 'id'), values(d)), 'Material updated');
	},
	toggle: async (event) => {
		const me = requireTenantStaff(event);
		assertModule(me, 'study_materials');
		const d = await event.request.formData();
		return run(() => setMaterialPublished(str(d, 'id'), d.get('published') === 'on'), 'Saved');
	},
	delete: async (event) => {
		const me = requireTenantStaff(event);
		assertModule(me, 'study_materials');
		const d = await event.request.formData();
		return run(() => deleteMaterial(str(d, 'id')), 'Material deleted');
	}
};
