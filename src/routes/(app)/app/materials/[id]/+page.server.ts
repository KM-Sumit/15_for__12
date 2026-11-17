import { error } from '@sveltejs/kit';
import { assertModule, requireTenant } from '#lib/server/tenant/context';
import { getMaterial } from '#lib/features/materials/server/service';
import { renderDoc } from '#lib/features/notes/server/markdown';
import { DomainError } from '#lib/server/http';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const tenant = requireTenant(event);
	assertModule(tenant, 'study_materials');
	let material;
	try {
		material = await getMaterial(event.params.id, true);
	} catch (e) {
		if (e instanceof DomainError && e.status === 404) error(404, 'Material not found.');
		throw e;
	}
	const doc = material.kind === 'text' ? renderDoc(material.body) : null;
	return {
		material: { ...material, body: '' },
		html: doc?.html ?? '',
		readingMinutes: doc?.readingMinutes ?? 0,
		toc: doc?.toc ?? []
	};
};
