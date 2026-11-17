import { fail } from '@sveltejs/kit';
import { requireSuperAdmin, DomainError } from '#lib/server/http';
import { getPlatformSettings, savePlatformSettings, platformBrand } from '#lib/features/platform/server/service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireSuperAdmin(event);
	const [settings, brand] = await Promise.all([getPlatformSettings(), platformBrand()]);
	return { settings, brand };
};

export const actions: Actions = {
	save: async (event) => {
		const admin = requireSuperAdmin(event);
		const d = await event.request.formData();
		const keys = ['brand_name', 'brand_tagline', 'support_email', 'support_phone', 'footer_note'];
		try {
			for (const key of keys) await savePlatformSettings(key, String(d.get(key) ?? '').trim(), admin.id);
			return { ok: true, message: 'Platform settings saved' };
		} catch (e) {
			if (e instanceof DomainError) return fail(e.status, { message: e.message });
			throw e;
		}
	}
};
