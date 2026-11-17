import { platformBrand } from '#lib/features/platform/server/service';
import { toSessionUser } from '#lib/features/auth/schema';
import { env } from '#lib/server/env';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url, locals }) => {
	const brand = await platformBrand();
	const origin = (env().ORIGIN ?? url.origin).replace(/\/$/, '');
	return { brand, origin, user: locals.user ? toSessionUser(locals.user) : null };
};
