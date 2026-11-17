import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import { db } from '#lib/server/db/index';
import { batchMembers, pushSubscriptions } from '#lib/server/db/schema';
import type { PushPayload, PushTarget, SubscriptionInput } from '../schema';
import { encrypt, vapidAuth } from './webpush';

// Read live (like adminEmails() in env.ts) so tests can set keys; env.ts validates the same names at boot.
export function vapid() {
	const { VAPID_PUBLIC_KEY: publicKey, VAPID_PRIVATE_KEY: privateKey, VAPID_SUBJECT: subject } = process.env;
	return publicKey && privateKey && subject ? { publicKey, privateKey, subject } : null;
}
export const pushEnabled = () => vapid() !== null;

// ---------- FCM helpers ----------
/** Returns the Firebase project-id from the service-account JSON, or null if not configured. */
function fcmServiceAccount(): { projectId: string; clientEmail: string; privateKey: string } | null {
	const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
	if (!raw) return null;
	try {
		const sa = JSON.parse(raw);
		if (sa.project_id && sa.client_email && sa.private_key)
			return { projectId: sa.project_id, clientEmail: sa.client_email, privateKey: sa.private_key };
	} catch { /* ignored */ }
	return null;
}

/** Creates a Google OAuth2 access-token for the FCM v1 API using the service-account JWT flow. */
async function fcmAccessToken(sa: { clientEmail: string; privateKey: string }): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
	const claim = btoa(JSON.stringify({
		iss: sa.clientEmail,
		scope: 'https://www.googleapis.com/auth/firebase.messaging',
		aud: 'https://oauth2.googleapis.com/token',
		iat: now,
		exp: now + 3600
	})).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
	const unsigned = `${header}.${claim}`;
	// Import the PEM private key
	const pemBody = sa.privateKey.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '');
	const keyDer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
	const cryptoKey = await crypto.subtle.importKey('pkcs8', keyDer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
	const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(unsigned));
	const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
	const jwt = `${unsigned}.${sigB64}`;
	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
	});
	const data = await res.json() as { access_token?: string };
	if (!data.access_token) throw new Error('FCM: could not get access token');
	return data.access_token;
}

/** Send one FCM message. Returns HTTP status from FCM. */
async function sendFcm(token: string, payload: PushPayload, accessToken: string, projectId: string): Promise<number> {
	const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
		method: 'POST',
		headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
		body: JSON.stringify({
			message: {
				token,
				notification: { title: payload.title, body: payload.body },
				android: {
					priority: 'high',
					notification: {
						channel_id: 'uci_alerts',
						click_action: 'OPEN_URL',
						default_sound: true,
						default_vibrate_timings: true,
						visibility: 'PUBLIC'
					}
				},
				data: { url: payload.url }
			}
		})
	});
	return res.status;
}

// ---------- web push / subscription management ----------
export async function subscribe(userId: string, s: SubscriptionInput) {
	const row = { userId, endpoint: s.endpoint, p256dh: s.keys.p256dh, auth: s.keys.auth };
	await db().insert(pushSubscriptions).values(row).onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: row });
}

/** Register (or refresh) a native FCM token for this user. */
export async function registerFcm(userId: string, token: string) {
	const endpoint = `fcm:${token}`;
	const row = { userId, endpoint, p256dh: '', auth: '', fcmToken: token };
	await db().insert(pushSubscriptions).values(row).onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: row });
}

/** Only the owner can remove an endpoint. */
export async function unsubscribe(userId: string, endpoint: string) {
	await db().delete(pushSubscriptions).where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, userId)));
}

type Sub = { endpoint: string; p256dh: string; auth: string; fcmToken: string | null };

async function targets(t: PushTarget): Promise<Sub[]> {
	const cols = { endpoint: pushSubscriptions.endpoint, p256dh: pushSubscriptions.p256dh, auth: pushSubscriptions.auth, fcmToken: pushSubscriptions.fcmToken };
	if (t.all) return db().select(cols).from(pushSubscriptions);
	const out: Sub[] = [];
	if (t.userIds?.length) out.push(...(await db().select(cols).from(pushSubscriptions).where(inArray(pushSubscriptions.userId, t.userIds))));
	if (t.batchId)
		out.push(
			...(await db()
				.select(cols)
				.from(pushSubscriptions)
				.innerJoin(batchMembers, eq(batchMembers.userId, pushSubscriptions.userId))
				.where(eq(batchMembers.batchId, t.batchId)))
		);
	return [...new Map(out.map((s) => [s.endpoint, s])).values()];
}

/** Sends one encrypted push to one web-push subscription. Returns the push service's HTTP status. */
export async function sendOne(sub: Sub, payload: PushPayload, fetcher: typeof fetch = fetch): Promise<number> {
	const v = vapid();
	if (!v) return 503;
	const body = await encrypt(new TextEncoder().encode(JSON.stringify(payload)), sub);
	const res = await fetcher(sub.endpoint, {
		method: 'POST',
		headers: {
			authorization: await vapidAuth(sub.endpoint, v),
			'content-encoding': 'aes128gcm',
			'content-type': 'application/octet-stream',
			ttl: String(24 * 3600),
			urgency: 'high'
		},
		body
	});
	return res.status;
}

/**
 * Fire-and-report: pushes `payload` to every device of the target.
 * - Web push devices: encrypted VAPID push → service worker → notification tray (works in background).
 * - Android FCM devices: FCM v1 API → native notification (works even when app is fully killed).
 * Gone endpoints (404/410) are pruned. Never throws.
 */
export async function pushTo(target: PushTarget, payload: PushPayload, fetcher: typeof fetch = fetch) {
	const subs = await targets(target);
	if (!subs.length) return { sent: 0, failed: 0, pruned: 0 };

	const sa = fcmServiceAccount();
	let fcmToken: string | null = null;
	if (sa && subs.some((s) => s.fcmToken)) {
		try { fcmToken = await fcmAccessToken(sa); } catch (e) { console.error('[fcm] token error', e); }
	}

	const gone: string[] = [];
	let sent = 0, failed = 0;

	// Ponytail: 20 at a time; move to a queue if one announcement ever targets 10k+ devices.
	for (let i = 0; i < subs.length; i += 20)
		await Promise.all(
			subs.slice(i, i + 20).map(async (s) => {
				let status: number;
				if (s.fcmToken && sa && fcmToken) {
					// Native FCM path — instant delivery even when app is killed
					status = await sendFcm(s.fcmToken, payload, fcmToken, sa.projectId).catch(() => 0);
				} else {
					// Web push path — works in browser background via service worker
					if (!pushEnabled()) { failed++; return; }
					status = await sendOne(s, payload, fetcher).catch(() => 0);
				}
				if (status === 404 || status === 410) gone.push(s.endpoint);
				else if (status >= 200 && status < 300) sent++;
				else failed++;
			})
		);

	if (gone.length) await db().delete(pushSubscriptions).where(inArray(pushSubscriptions.endpoint, gone));
	return { sent, failed, pruned: gone.length };
}

