import { json } from '@sveltejs/kit';
import { attemptClock } from '#lib/features/tests/server/attempt';
import { requireUser, toHttp } from '#lib/server/http';
import type { RequestHandler } from './$types';

/** Sitting-time poll: returns the current deadline so a staff duration edit reaches the open exam. */
export const GET: RequestHandler = async (event) => {
	const user = requireUser(event);
	return json(await attemptClock(event.params.id, user.id).catch(toHttp));
};
