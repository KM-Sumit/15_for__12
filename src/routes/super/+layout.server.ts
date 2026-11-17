import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const { user } = await event.parent();
	const bare = event.url.pathname === '/super/login';
	if (!bare && !event.locals.isSuperAdmin) redirect(303, '/super/login');
	return { bare, user };
};
