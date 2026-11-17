import { fail, redirect } from '@sveltejs/kit';
import { publicInstitutes } from '#lib/features/platform/server/service';
import { joinInstituteAsStudent, joinInstituteBySlug, listStudentInstitutes } from '#lib/features/auth/server/password';
import { homeFor, safeNext, setActiveInstitute } from '#lib/server/auth/session';
import { DomainError } from '#lib/server/http';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user;
	if (!user) redirect(303, `/login?next=${encodeURIComponent('/join')}`);
	if (event.locals.isSuperAdmin || (event.locals.tenant && event.locals.tenant.role !== 'student')) redirect(303, homeFor(user));
	// Students can always come back here to add another coaching institute.
	return {
		institutes: await publicInstitutes(),
		mine: event.locals.tenant ? await listStudentInstitutes(user.id) : [],
		next: safeNext(event.url.searchParams.get('next'), ''),
		name: user.name,
		email: user.email
	};
};

/** Students type the institute code (its URL slug), or paste the /i/<code> link. */
function cleanCode(raw: string) {
	let code = raw.trim().toLowerCase();
	const fromLink = code.match(/\/i\/([a-z0-9][a-z0-9-]*)/);
	if (fromLink) code = fromLink[1];
	return code.replace(/^@/, '').replace(/^\/+|\/+$/g, '').replace(/\s+/g, '-');
}

export const actions: Actions = {
	/** Join with a code the institute shared. */
	code: async (event) => {
		const user = event.locals.user;
		if (!user) return fail(401, { message: 'Sign in first.' });
		const d = await event.request.formData();
		const code = cleanCode(String(d.get('code') ?? ''));
		if (!code) return fail(400, { message: 'Enter your institute code.' });
		try {
			const instituteId = await joinInstituteBySlug(user.id, code);
			// Land the student in the coaching they just joined.
			setActiveInstitute(event.cookies, instituteId);
		} catch (e) {
			if (e instanceof DomainError) {
				const message =
					e.status === 404 ? `No institute found for code “${code}”. Check the code with your coaching institute.` : e.message;
				return fail(e.status, { message, code });
			}
			throw e;
		}
		const next = safeNext(String(d.get('next') ?? ''), '');
		redirect(303, next || homeFor(user));
	},

	/** Join by picking an institute from the public list. */
	pick: async (event) => {
		const user = event.locals.user;
		if (!user) return fail(401, { message: 'Sign in first.' });
		const d = await event.request.formData();
		const instituteId = String(d.get('instituteId') ?? '');
		if (!instituteId) return fail(400, { message: 'Choose your institute.' });
		try {
			const joined = await joinInstituteAsStudent(user.id, instituteId);
			setActiveInstitute(event.cookies, joined);
		} catch (e) {
			if (e instanceof DomainError) return fail(e.status, { message: e.message });
			throw e;
		}
		const next = safeNext(String(d.get('next') ?? ''), '');
		redirect(303, next || homeFor(user));
	}
};
