import { error, redirect } from '@sveltejs/kit';
import { and, asc, eq, isNotNull, isNull } from 'drizzle-orm';
import { beginStudentSession } from '#lib/features/auth/server/service';
import { startSession } from '#lib/server/auth/session';
import { db } from '#lib/server/db';
import { users } from '#lib/server/db/schema';
import type { RequestHandler } from './$types';

/** Signs in one local student so the desktop app can be opened without Google. Dev server only. */
export const GET: RequestHandler = async ({ cookies }) => {
	if (!import.meta.env.DEV) error(404, 'Not found');
	const [user] = await db()
		.select()
		.from(users)
		.where(and(eq(users.role, 'student'), isNull(users.suspendedAt), isNotNull(users.onboardedAt)))
		.orderBy(asc(users.createdAt))
		.limit(1);
	if (!user) error(404, 'No local student account');
	const held = await beginStudentSession(user, true);
	if ('error' in held) error(403, 'This student is already signed in on another browser.');
	await startSession(cookies, held.user);
	redirect(303, '/app');
};
