import { and, count, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '#lib/server/db';
import { attempts, instituteMemberships, studyMaterials, tests, users } from '#lib/server/db/schema';
import { requireTenantStaff } from '#lib/server/tenant/context';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const tenant = requireTenantStaff(event);
	const weekAgo = new Date(Date.now() - 7 * 86_400_000);
	const [[studentRow], [activeRow], [testRow], [attemptRow], [materialRow], recent, upcoming] = await Promise.all([
		// Membership-based: students may belong to several institutes; users.instituteId is only a display mirror.
		db()
			.select({ n: count() })
			.from(instituteMemberships)
			.where(and(eq(instituteMemberships.instituteId, tenant.instituteId), eq(instituteMemberships.role, 'student'), eq(instituteMemberships.status, 'active'))),
		db()
			.select({ n: count() })
			.from(instituteMemberships)
			.innerJoin(users, eq(users.id, instituteMemberships.userId))
			.where(
				and(
					eq(instituteMemberships.instituteId, tenant.instituteId),
					eq(instituteMemberships.role, 'student'),
					eq(instituteMemberships.status, 'active'),
					gte(users.lastSeenAt, weekAgo)
				)
			),
		db().select({ n: count() }).from(tests),
		db().select({ n: count() }).from(attempts),
		db()
			.select({ n: sql<number>`count(*) filter (where ${studyMaterials.published})::int`.mapWith(Number) })
			.from(studyMaterials),
		db()
			.select({
				attemptId: attempts.id,
				name: users.name,
				email: users.email,
				test: tests.title,
				testId: tests.id,
				score: attempts.score,
				maxScore: attempts.maxScore,
				status: attempts.status,
				startedAt: attempts.startedAt
			})
			.from(attempts)
			.innerJoin(users, eq(users.id, attempts.userId))
			.innerJoin(tests, eq(tests.id, attempts.testId))
			.where(eq(attempts.status, 'submitted'))
			.orderBy(desc(attempts.submittedAt))
			.limit(10),
		db()
			.select({ id: tests.id, title: tests.title, startsAt: tests.startsAt })
			.from(tests)
			.where(and(eq(tests.status, 'published'), sql`${tests.startsAt} > now()`))
			.orderBy(tests.startsAt)
			.limit(5)
	]);
	return {
		institute: { name: tenant.instituteName, slug: tenant.slug, role: tenant.role },
		modules: tenant.modules,
		stats: {
			students: studentRow?.n ?? 0,
			activeStudents: activeRow?.n ?? 0,
			tests: testRow?.n ?? 0,
			attempts: attemptRow?.n ?? 0,
			materials: materialRow?.n ?? 0
		},
		recent: recent.map((r) => ({
			...r,
			startedAt: r.startedAt.toISOString(),
			percentage: r.score != null && r.maxScore ? Math.round((r.score / r.maxScore) * 1000) / 10 : null
		})),
		upcoming: upcoming.map((t) => ({ id: t.id, title: t.title, startsAt: t.startsAt?.toISOString() ?? null }))
	};
};
