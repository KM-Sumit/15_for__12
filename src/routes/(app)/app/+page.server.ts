import { fail, redirect } from '@sveltejs/kit';
import { DomainError, requireUser } from '#lib/server/http';
import { joinInstituteBySlug, listStudentInstitutes, switchActiveInstitute } from '#lib/features/auth/server/password';
import { setActiveInstitute } from '#lib/server/auth/session';
import { catalog, history } from '#lib/features/tests/server/attempt';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const u = requireUser(event);
	const tenant = event.locals.tenant;
	// Login flow: a student with no institute yet lands right here — the dashboard itself asks for the
	// institute code, joining is automatic, and each added institute gets its own dashboard.
	if (!tenant) return { needsInstitute: true as const, firstName: u.name.split(/\s+/)[0] || 'there' };
	const [tests, results, mine] = await Promise.all([
		tenant.modules.includes('online_tests') ? catalog(u.id).catch(() => []) : Promise.resolve([]),
		tenant.modules.includes('results') ? history(u.id, { limit: 5 }).catch(() => ({ items: [] })) : Promise.resolve({ items: [] }),
		listStudentInstitutes(u.id).catch(() => [])
	]);
	const now = Date.now();
	const inProgress = tests.find((t) => t.inProgressAttemptId) ?? null;
	const next = tests
		.filter((t) => t.canStart && t.window === 'live' && t.id !== inProgress?.id)
		.sort((a, b) => (a.endsAt ?? '').localeCompare(b.endsAt ?? ''))[0] ?? null;
	const upcoming = tests
		.filter((t) => t.window === 'upcoming' && t.startsAt)
		.sort((a, b) => a.startsAt!.localeCompare(b.startsAt!))
		.slice(0, 3);
	const scored = results.items.filter((r) => r.percentage != null);
	return {
		needsInstitute: false as const,
		firstName: u.name.split(/\s+/)[0] || 'there',
		institute: { name: tenant.instituteName, logoUrl: tenant.institute.logoUrl, slug: tenant.slug },
		institutes: mine,
		activeInstitute: tenant.instituteId,
		modules: tenant.modules,
		inProgress,
		next,
		upcoming,
		results: results.items.slice(0, 4),
		stats: {
			testsTaken: scored.length,
			avgPercent: scored.length ? Math.round((scored.reduce((s, r) => s + (r.percentage ?? 0), 0) / scored.length) * 10) / 10 : null,
			bestPercent: scored.length ? Math.max(...scored.map((r) => r.percentage ?? 0)) : null
		},
		serverNow: new Date(now).toISOString()
	};
};

export const actions: Actions = {
	/** Dashboard code entry: joins the institute automatically, then shows it as a button. */
	join: async (event) => {
		const u = requireUser(event);
		const code = String((await event.request.formData()).get('code') ?? '').trim();
		if (!code) return fail(400, { message: 'Enter your institute code.' });
		try {
			const instituteId = await joinInstituteBySlug(u.id, code);
			setActiveInstitute(event.cookies, instituteId);
		} catch (e) {
			if (e instanceof DomainError) {
				const message = e.status === 404 ? `No institute found for code “${code}”. Check it with your coaching.` : e.message;
				return fail(e.status, { message });
			}
			throw e;
		}
		redirect(303, '/app');
	},
	/** Student switches which coaching's dashboard/tests they are using. Membership is re-verified server-side. */
	switch: async (event) => {
		const u = requireUser(event);
		const instituteId = String((await event.request.formData()).get('instituteId') ?? '');
		try {
			await switchActiveInstitute(u.id, instituteId);
		} catch {
			return fail(403, { message: 'You are not a member of that institute.' });
		}
		setActiveInstitute(event.cookies, instituteId);
		redirect(303, '/app');
	}
};
