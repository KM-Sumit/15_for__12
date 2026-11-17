import { json } from '@sveltejs/kit';
import { unreadPeek } from '#lib/features/engage/server/service';
import { requireUser } from '#lib/server/http';
import type { RequestHandler } from './$types';

/** Unread alerts for the Android app to show as system notifications when the app is closed. */
export const GET: RequestHandler = async (event) => {
	const u = requireUser(event);
	return json({ items: await unreadPeek(u.id) });
};
