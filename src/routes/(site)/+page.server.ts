import { publicInstitutes } from '#lib/features/platform/server/service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const institutes = await publicInstitutes();
	return { institutes, instituteCount: institutes.length };
};
