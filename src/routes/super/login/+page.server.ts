import { fail, redirect } from '@sveltejs/kit';
import { signInWithPassword } from '#lib/features/auth/server/password';
import { restoreListedAdmin } from '#lib/features/auth/server/service';
import { safeNext, startSession } from '#lib/server/auth/session';
import { DomainError } from '#lib/server/http';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => ({
	next: safeNext(url.searchParams.get('next'), '/super'),
	error: url.searchParams.get('error')
});

export const actions: Actions = {
	default: async (event) => {
		const d = await event.request.formData();
		const email = String(d.get('email') ?? '').trim();
		const password = String(d.get('password') ?? '');
		const next = safeNext(String(d.get('next') ?? ''), '/super');
		if (!email || !password) return fail(400, { email, message: 'Enter your email and password.' });
		try {
			const user = await signInWithPassword(email, password);
			const restored = await restoreListedAdmin(user);
			if (restored.role !== 'super_admin') return fail(403, { email, message: 'This account is not a platform administrator.' });
			await startSession(event.cookies, restored);
			redirect(303, next);
		} catch (e) {
			if (e instanceof DomainError && e.status === 401) return fail(401, { email, message: 'Wrong email or password.' });
			if (e instanceof DomainError) return fail(e.status, { email, message: e.message });
			throw e;
		}
	}
};
