import { redirect } from '@sveltejs/kit';
import { FLOW_COOKIE, FLOW_TTL_SEC, startFlow } from '#lib/server/auth/google';
import { safeNext } from '#lib/server/auth/session';
import { googleEnabled } from '#lib/server/env';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const next = safeNext(url.searchParams.get('next'), '');
	const institute = url.searchParams.get('institute')?.trim().toLowerCase() || null;
	if (!googleEnabled()) redirect(303, '/login?error=google');
	const { url: to, cookie } = await startFlow(url.origin, next, institute);
	cookies.set(FLOW_COOKIE, cookie, { path: '/', httpOnly: true, sameSite: 'lax', secure: !import.meta.env.DEV, maxAge: FLOW_TTL_SEC });
	// SvelteKit 3 refuses external redirects unless the target origin is allowed explicitly.
	redirect(303, to, { external: ['https://accounts.google.com'] });
};
