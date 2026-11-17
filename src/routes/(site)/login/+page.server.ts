import { fail, redirect } from '@sveltejs/kit';
import { homeFor, safeNext, startSession } from '#lib/server/auth/session';
import { googleEnabled } from '#lib/server/env';
import { signInWithPassword } from '#lib/features/auth/server/password';
import { restoreListedAdmin } from '#lib/features/auth/server/service';
import { DomainError } from '#lib/server/http';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	const next = safeNext(url.searchParams.get('next'), '');
	if (locals.user) redirect(303, next || homeFor(locals.user));
	return { next, error: url.searchParams.get('error'), google: googleEnabled() };
};

export const actions: Actions = {
	default: async (event) => {
		const d = await event.request.formData();
		const email = String(d.get('email') ?? '').trim();
		const password = String(d.get('password') ?? '');
		const next = safeNext(String(d.get('next') ?? ''), '');
		if (!email || !password) return fail(400, { email, message: 'Enter your email and password.' });
		try {
			const user = await signInWithPassword(email, password);
			const restored = await restoreListedAdmin(user);
			await startSession(event.cookies, restored);
			redirect(303, next || homeFor(restored));
		} catch (e) {
			if (e instanceof DomainError && e.status === 401) return fail(401, { email, message: 'Wrong email or password.' });
			if (e instanceof DomainError) return fail(e.status, { email, message: e.message });
			throw e;
		}
	}
};
