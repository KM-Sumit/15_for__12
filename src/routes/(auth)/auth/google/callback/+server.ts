import { redirect } from '@sveltejs/kit';
import { FLOW_COOKIE, finishFlow, readFlow } from '#lib/server/auth/google';
import { homeFor, readSession, safeNext, startSession } from '#lib/server/auth/session';
import { beginStudentSession, signInWithGoogle } from '#lib/features/auth/server/service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const flow = await readFlow(cookies.get(FLOW_COOKIE));
	cookies.delete(FLOW_COOKIE, { path: '/' });
	const code = url.searchParams.get('code');
	const fail = (why: string): never => {
		// Tells a cancelled login (error=access_denied) from a misconfigured callback in the logs.
		console.warn('[auth] google sign-in failed', { why, host: url.host, error: url.searchParams.get('error') });
		const n = flow?.next ? safeNext(flow.next, '') : '';
		const code = why === 'suspended' || why === 'in_use' ? why : 'google';
		redirect(303, `/login?error=${code}${n ? `&next=${encodeURIComponent(n)}` : ''}`);
	};
	if (!flow || !code || url.searchParams.get('state') !== flow.state) return fail('state');

	let res;
	try {
		res = await signInWithGoogle(await finishFlow({ code, flow, origin: url.origin }));
	} catch (e) {
		return fail(e instanceof Error ? e.message : 'unknown');
	}
	if ('error' in res) return fail('suspended');
	// A Google sign-in started from an institute page joins that institute (students only; staff are pre-created).
	if (flow.institute && res.user.role !== 'super_admin') {
		const { joinInstituteBySlug, membershipOf } = await import('#lib/features/auth/server/password');
		try {
			if (!(await membershipOf(res.user.id))) await joinInstituteBySlug(res.user.id, flow.institute);
		} catch (e) {
			console.warn('[auth] join institute failed', e);
			const n = flow.next ? safeNext(flow.next, '') : '';
			redirect(303, `/login?error=institute${n ? `&next=${encodeURIComponent(n)}` : ''}`);
		}
	}
	const current = await readSession(cookies);
	const sameBrowser = current?.userId === res.user.id && current.sv === res.user.sessionVersion;
	const held = await beginStudentSession(res.user, sameBrowser);
	if ('error' in held) return fail('in_use');
	await startSession(cookies, held.user);
	redirect(303, safeNext(flow.next, homeFor(held.user)));
};
