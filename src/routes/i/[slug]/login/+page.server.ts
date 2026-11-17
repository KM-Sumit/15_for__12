import { error, fail, redirect } from '@sveltejs/kit';
import { signInWithPassword } from '#lib/features/auth/server/password';
import { restoreListedAdmin } from '#lib/features/auth/server/service';
import { membershipOf } from '#lib/features/auth/server/password';
import { getPublicInstitute } from '#lib/features/platform/server/service';
import { homeFor, safeNext, startSession } from '#lib/server/auth/session';
import { googleEnabled } from '#lib/server/env';
import { DomainError } from '#lib/server/http';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const institute = await getPublicInstitute(params.slug);
	if (!institute) error(404, 'Institute not found.');
	if (locals.user && locals.tenant?.slug === institute.slug) redirect(303, homeFor(locals.user));
	return {
		institute: { name: institute.name, slug: institute.slug, logoUrl: institute.logoUrl, primaryColor: institute.primaryColor, tagline: institute.tagline },
		next: safeNext(url.searchParams.get('next'), '/app'),
		error: url.searchParams.get('error'),
		google: googleEnabled()
	};
};

export const actions: Actions = {
	default: async (event) => {
		const d = await event.request.formData();
		const email = String(d.get('email') ?? '').trim();
		const password = String(d.get('password') ?? '');
		const next = safeNext(String(d.get('next') ?? ''), '/app');
		const institute = await getPublicInstitute(event.params.slug);
		if (!institute) return fail(404, { email, message: 'Institute not found.' });
		if (!email || !password) return fail(400, { email, message: 'Enter your email and password.' });
		try {
			const user = await signInWithPassword(email, password);
			const restored = await restoreListedAdmin(user);
			if (restored.role === 'super_admin') {
				await startSession(event.cookies, restored);
				redirect(303, '/super');
			}
			const member = await membershipOf(restored.id);
			if (!member || member.institute.id !== institute.id)
				return fail(403, { email, message: `This account does not belong to ${institute.name}. Ask your institute for the correct link.` });
			await startSession(event.cookies, restored);
			redirect(303, next === '/app' ? homeFor(restored) : next);
		} catch (e) {
			if (e instanceof DomainError && e.status === 401) return fail(401, { email, message: 'Wrong email or password.' });
			if (e instanceof DomainError) return fail(e.status, { email, message: e.message });
			throw e;
		}
	}
};
