import { fail, redirect } from '@sveltejs/kit';
import { homeFor, setActiveInstitute, startSession } from '#lib/server/auth/session';
import { joinInstituteBySlug, peekInstituteBySlug, signUpStudent } from '#lib/features/auth/server/password';
import { restoreListedAdmin } from '#lib/features/auth/server/service';
import { DomainError } from '#lib/server/http';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) redirect(303, homeFor(locals.user));
	return { code: (url.searchParams.get('code') ?? '').trim() };
};

export const actions: Actions = {
	default: async (event) => {
		const d = await event.request.formData();
		const name = String(d.get('name') ?? '').trim();
		const email = String(d.get('email') ?? '').trim();
		const password = String(d.get('password') ?? '');
		const code = String(d.get('code') ?? '').trim();
		const back = { name, email, code };
		if (!name || !email || !password) return fail(400, { ...back, message: 'Fill in your name, email and password.' });
		try {
			// Validate the join code before creating anything, so a bad code costs the student nothing.
			if (code) await peekInstituteBySlug(code);
			const user = await signUpStudent({ name, email, password });
			// A listed ADMIN_EMAILS address signing up owns the platform: promote before the first redirect
			// so it lands on its real home (e.g. /super), not the student dashboard.
			const restored = await restoreListedAdmin(user);
			if (code) {
				const instituteId = await joinInstituteBySlug(restored.id, code);
				setActiveInstitute(event.cookies, instituteId);
			}
			await startSession(event.cookies, restored);
			redirect(303, homeFor(restored));
		} catch (e) {
			if (e instanceof DomainError) return fail(e.status, { ...back, message: e.message });
			throw e;
		}
	}
};
