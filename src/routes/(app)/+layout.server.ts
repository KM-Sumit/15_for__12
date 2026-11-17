import { redirect } from '@sveltejs/kit';
import { unreadCount } from '#lib/features/engage/server/service';
import { openPasswordAttempt } from '#lib/features/tests/server/attempt';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const { user } = await event.parent();
	if (!user) {
		const next = encodeURIComponent(event.url.pathname + event.url.search);
		redirect(303, `/login?next=${next}`);
	}
	// Do not read event.url after this: that would re-run these queries on every tap (Courses, Tests, …).
	const [inbox, pt] = await Promise.all([
		unreadCount(user.id).catch(() => 0),
		openPasswordAttempt(user.id).catch(() => null)
	]);
	return { user, unread: inbox, pt, serverNow: new Date().toISOString() };
};
