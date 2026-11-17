import { json } from '@sveltejs/kit';
import { fcmTokenInput } from '#lib/features/push/schema';
import { registerFcm, unsubscribe } from '#lib/features/push/server/service';
import { body, requireUser } from '#lib/server/http';
import type { RequestHandler } from './$types';

/** Native Android app POSTs its FCM token here when it is granted notification permission. */
export const POST: RequestHandler = async (event) => {
	const u = requireUser(event);
	const { token } = await body(event, fcmTokenInput);
	await registerFcm(u.id, token);
	return json({ ok: true });
};

/** Android app DELETEs its token when the user turns off notifications. */
export const DELETE: RequestHandler = async (event) => {
	const u = requireUser(event);
	const { token } = await body(event, fcmTokenInput);
	await unsubscribe(u.id, `fcm:${token}`);
	return json({ ok: true });
};
