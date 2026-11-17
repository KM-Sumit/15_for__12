import { fail } from '@sveltejs/kit';
import { createLead } from '#lib/features/site/server/service';
import { leadInput } from '#lib/features/site/schema';
import { DomainError, form } from '#lib/server/http';
import { platformBrand } from '#lib/features/platform/server/service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const brand = await platformBrand();
	return { support: { email: brand.supportEmail, phone: brand.supportPhone } };
};

export const actions: Actions = {
	default: async (event) => {
		const fd = await event.request.formData();
		const values = {
			name: String(fd.get('name') ?? ''),
			phone: String(fd.get('phone') ?? ''),
			examInterest: String(fd.get('examInterest') ?? ''),
			message: String(fd.get('message') ?? '')
		};
		// Honeypot: bots fill every field; pretend success.
		if (fd.get('website')) return { ok: true, name: values.name };
		const parsed = form(fd, leadInput);
		if (!parsed.ok) return fail(400, { error: parsed.message, values });
		try {
			await createLead(parsed.data, event.getClientAddress());
		} catch (e) {
			if (e instanceof DomainError) return fail(e.status, { error: e.message, values });
			throw e;
		}
		return { ok: true, name: parsed.data.name };
	}
};
