import { assertModule, requireTenant } from '#lib/server/tenant/context';
import { listMaterials } from '#lib/features/materials/server/service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const tenant = requireTenant(event);
	assertModule(tenant, 'study_materials');
	const q = (event.url.searchParams.get('q') ?? '').trim().toLowerCase();
	const kind = event.url.searchParams.get('kind');
	const all = await listMaterials({ publishedOnly: true });
	const materials = all.filter(
		(m) => (!q || m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)) && (!kind || m.kind === kind)
	);
	return { materials, total: all.length, q, kind: kind ?? '' };
};
