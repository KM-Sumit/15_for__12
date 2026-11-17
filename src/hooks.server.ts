import { error, isHttpError, redirect } from '@sveltejs/kit';
import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { endSession, homeFor, activeInstitute, readSession } from '#lib/server/auth/session';
import { allowRequest } from '#lib/server/rate-limit';
import { getUser, restoreListedAdmin, touchLastSeen } from '#lib/features/auth/server/service';
import { resolveTenant } from '#lib/server/tenant/context';
import { moduleForPath } from '#lib/features/platform/modules';
import { withRequestDb } from '#lib/server/db';

const area = (path: string, prefix: string) => path === prefix || path.startsWith(prefix + '/');
const back = (url: URL) => encodeURIComponent(url.pathname + url.search);

/** Log unexpected failures. Keep the message for expected 4xx errors; hide 5xx internals. */
export const handleError: HandleServerError = ({ error: err, event }) => {
	console.error('[app]', event.url.pathname, err);
	if (isHttpError(err) && err.status < 500) {
		const body = err.body as { message?: string } | string | undefined;
		return { message: typeof body === 'string' ? body : (body?.message ?? 'Request failed.') };
	}
	return { message: 'Something went wrong. Please try again.' };
};

export const handle: Handle = async ({ event, resolve }) => {
	const url = event.url;
	// www.host -> host (one host, so the Google callback and cookies always match).
	if (url.hostname.startsWith('www.')) {
		const to = new URL(url);
		to.hostname = url.hostname.slice(4);
		return new Response(null, { status: 301, headers: { location: to.href } });
	}

	event.locals.user = null;
	event.locals.tenant = null;
	event.locals.isSuperAdmin = false;
	event.locals.enabledModules = [];

	const session = await readSession(event.cookies);
	if (session) {
		let user;
		try {
			user = await getUser(session.userId);
		} catch (e) {
			console.error('[auth] getUser failed', e);
			error(503, 'Service briefly unavailable. Wait a moment and try again.');
		}
		// sessionVersion is bumped on logout: older tokens are dead even though their signature is valid.
		if (user && !user.suspendedAt && user.sessionVersion === session.sv) {
			try {
				user = await restoreListedAdmin(user);
			} catch (e) {
				console.error('[auth] restoreListedAdmin failed', e);
			}
			if (user.role === 'super_admin') {
				event.locals.user = user;
				event.locals.isSuperAdmin = true;
			} else {
				const resolved = await resolveTenant(user.id, activeInstitute(event.cookies)).catch((e) => {
					console.error('[tenant] resolve failed', e);
					return { error: 'none' as const };
				});
				if ('tenant' in resolved) {
					event.locals.tenant = resolved.tenant;
					// Membership is authoritative for the request: a user row edit can never widen access.
					event.locals.user = { ...user, role: resolved.tenant.role, instituteId: resolved.tenant.instituteId };
					event.locals.enabledModules = resolved.tenant.modules;
				} else if (resolved.error === 'suspended') {
					endSession(event.cookies);
					if (url.pathname !== '/login') redirect(303, '/login?error=institute_suspended');
				} else if (resolved.error === 'disabled') {
					endSession(event.cookies);
					if (url.pathname !== '/login') redirect(303, '/login?error=membership_disabled');
				} else {
					// Signed in but not attached to an institute yet (fresh Google account).
					event.locals.user = user;
				}
			}
			if (event.locals.user) void touchLastSeen(event.locals.user).catch((e) => console.error('[auth] lastSeen failed', e));
		} else {
			endSession(event.cookies);
			if (user?.suspendedAt && url.pathname !== '/login') redirect(303, '/login?error=suspended');
		}
	}

	if (!(await allowRequest(event)))
		return new Response('Too many requests. Wait a few minutes and try again.', {
			status: 429,
			headers: { 'retry-after': '60', 'content-type': 'text/plain' }
		});

	const path = url.pathname;
	const user = event.locals.user;
	const tenant = event.locals.tenant;
	const inSuperLogin = path === '/super/login';
	const inSuper = area(path, '/super') && !inSuperLogin;
	const inApp = area(path, '/app') || area(path, '/onboarding');
	const inAdmin = area(path, '/admin');

	// ---- platform (super admin) area ----
	if (inSuper) {
		if (!user) redirect(303, `/super/login?next=${back(url)}`);
		if (!event.locals.isSuperAdmin) redirect(303, homeFor(user));
	}
	if (inSuperLogin && event.locals.isSuperAdmin) redirect(303, '/super');

	// ---- tenant areas ----
	if ((inApp || inAdmin) && !user) redirect(303, `/login?next=${back(url)}`);
	if (inAdmin && user) {
		if (event.locals.isSuperAdmin) redirect(303, '/super');
		if (!tenant) redirect(303, '/join');
		if (tenant.role === 'student') redirect(303, '/app');
		// Quick self-service lockout: an admin who lost the students module still sees the dashboard.
	}
	if (inApp && user) {
		if (event.locals.isSuperAdmin) redirect(303, '/super');
		if (!tenant) {
			// Student flow: the dashboard itself asks for the institute code (login → /app → add institute).
			// Deeper app pages still need an institute; staff without one go to /join as before.
			if (user.role === 'student') {
				if (path !== '/app') redirect(303, '/app');
			} else {
				redirect(303, '/join');
			}
		} else if (area(path, '/app') && tenant.role === 'student' && !user.onboardedAt) {
			redirect(303, `/onboarding?next=${back(url)}`);
		}
	}

	// ---- module gate (pages and APIs, so direct URLs cannot bypass a disabled module) ----
	if (tenant) {
		const needed = moduleForPath(path);
		if (needed && !tenant.modules.includes(needed)) {
			if (path.startsWith('/api/'))
				return Response.json({ message: 'This module is disabled for your institute.' }, { status: 403 });
			error(403, 'This module is disabled for your institute.');
		}
	}

	const finish = async () => {
		let response = await resolve(event);
		try {
			response.headers.set('X-Content-Type-Options', 'nosniff');
		} catch {
			response = new Response(response.body, response); // e.g. Response.redirect() has immutable headers
		}
		const h = response.headers;
		// Signed-in pages are never cached, so Back can't show someone else's page on a shared device.
		if (user && !h.has('cache-control')) h.set('cache-control', 'private, no-store');
		h.set('X-Frame-Options', 'DENY'); // we embed YouTube (CSP frame-src in vite.config.ts); nobody embeds us
		h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
		h.set(
			'Permissions-Policy',
			'camera=(), microphone=(), geolocation=(), display-capture=(), payment=(self "https://checkout.razorpay.com" "https://api.razorpay.com")'
		);
		h.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
		if (!import.meta.env.DEV) h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
		return response;
	};

	// Every signed-in request gets a dedicated connection with its tenant (or bypass) bound for RLS.
	if (user) {
		if (event.locals.isSuperAdmin) return withRequestDb({ instituteId: null, bypassRls: true }, finish);
		if (tenant) return withRequestDb({ instituteId: tenant.instituteId, bypassRls: false }, finish);
	}
	return finish();
};
