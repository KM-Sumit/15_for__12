import { fail } from '@sveltejs/kit';
import { DomainError, requireStaff } from '#lib/server/http';
import { createTestSet, listTestSets } from '#lib/features/tests/server/service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireStaff(event);
	return { sets: await listTestSets() };
};

export const actions: Actions = {
	create: async (event) => {
		requireStaff(event);
		const name = String((await event.request.formData()).get('name') ?? '');
		try {
			const set = await createTestSet(name, null);
			return { ok: true, message: 'Test series created.', id: set.id };
		} catch (e) {
			if (e instanceof DomainError) return fail(e.status, { message: e.message });
			throw e;
		}
	}
};
