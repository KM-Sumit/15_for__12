// Institute-wide reports. Tenant tables are RLS-scoped by the request connection; `users` is filtered
// explicitly by institute_id because accounts are global rows.
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '#lib/server/db';
import { attempts, studyMaterials, tests, users } from '#lib/server/db/schema';

const num = (v: unknown) => Number(v ?? 0);
const pctSql = sql<number>`coalesce(round(avg(case when ${attempts.maxScore} > 0 then ${attempts.score} * 100.0 / ${attempts.maxScore} end)::numeric, 1), 0)::float`.mapWith(Number);

export type TestReportRow = {
	id: string;
	title: string;
	status: string;
	attempts: number;
	submitted: number;
	avgPercent: number | null;
	topPercent: number | null;
};

export async function tenantReport(instituteId: string) {
	const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

	const [[students], [active], [testCount], [attemptCount], [graded], [materials], [passRate]] = await Promise.all([
		db().select({ n: sql<number>`count(*)::int`.mapWith(Number) }).from(users).where(and(eq(users.instituteId, instituteId), eq(users.role, 'student'))),
		db()
			.select({ n: sql<number>`count(*)::int`.mapWith(Number) })
			.from(users)
			.where(and(eq(users.instituteId, instituteId), eq(users.role, 'student'), gte(users.lastSeenAt, weekAgo))),
		db().select({ n: sql<number>`count(*)::int`.mapWith(Number) }).from(tests),
		db()
			.select({ n: sql<number>`count(*)::int`.mapWith(Number) })
			.from(attempts)
			.where(sql`${attempts.status} <> 'in_progress'`),
		db()
			.select({ n: sql<number>`count(*)::int`.mapWith(Number), avg: pctSql })
			.from(attempts)
			.where(sql`${attempts.status} <> 'in_progress' and ${attempts.score} is not null`),
		db()
			.select({ n: sql<number>`count(*)::int`.mapWith(Number) })
			.from(studyMaterials)
			.where(eq(studyMaterials.published, true)),
		db()
			.select({ n: sql<number>`coalesce(round(avg(case when ${attempts.maxScore} > 0 then ${attempts.score} / ${attempts.maxScore} end)::numeric, 3), 0)::float`.mapWith(Number) })
			.from(attempts)
			.where(sql`${attempts.status} <> 'in_progress' and ${attempts.score} is not null`)
	]);

	const perTest = await db()
		.select({
			id: tests.id,
			title: tests.title,
			status: tests.status,
			attempts: sql<number>`count(${attempts.id})::int`.mapWith(Number),
			submitted: sql<number>`count(*) filter (where ${attempts.status} <> 'in_progress')::int`.mapWith(Number),
			avgPercent: sql<number>`coalesce(round(avg(case when ${attempts.status} <> 'in_progress' and ${attempts.maxScore} > 0 then ${attempts.score} * 100.0 / ${attempts.maxScore} end)::numeric, 1), 0)::float`.mapWith(Number),
			topPercent: sql<number>`coalesce(round(max(case when ${attempts.status} <> 'in_progress' and ${attempts.maxScore} > 0 then ${attempts.score} * 100.0 / ${attempts.maxScore} end)::numeric, 1), 0)::float`.mapWith(Number)
		})
		.from(tests)
		.leftJoin(attempts, eq(attempts.testId, tests.id))
		.groupBy(tests.id, tests.title, tests.status, tests.createdAt)
		.orderBy(desc(tests.createdAt))
		.limit(25);

	const monthly = await db()
		.select({
			month: sql<string>`to_char(date_trunc('month', ${attempts.startedAt}), 'YYYY-MM')`,
			n: sql<number>`count(*)::int`.mapWith(Number)
		})
		.from(attempts)
		.where(gte(attempts.startedAt, new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)))
		.groupBy(sql`date_trunc('month', ${attempts.startedAt})`)
		.orderBy(sql`date_trunc('month', ${attempts.startedAt})`);

	const topStudents = await db()
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			attempts: sql<number>`count(${attempts.id})::int`.mapWith(Number),
			avgPercent: sql<number>`coalesce(round(avg(case when ${attempts.status} <> 'in_progress' and ${attempts.maxScore} > 0 then ${attempts.score} * 100.0 / ${attempts.maxScore} end)::numeric, 1), 0)::float`.mapWith(Number)
		})
		.from(attempts)
		.innerJoin(users, eq(users.id, attempts.userId))
		.where(and(eq(users.instituteId, instituteId), sql`${attempts.status} <> 'in_progress'`))
		.groupBy(users.id, users.name, users.email)
		.orderBy(sql`avg(case when ${attempts.maxScore} > 0 then ${attempts.score} * 100.0 / ${attempts.maxScore} end) desc`)
		.limit(8);

	return {
		totals: {
			students: num(students?.n),
			activeStudents: num(active?.n),
			tests: num(testCount?.n),
			attempts: num(attemptCount?.n),
			graded: num(graded?.n),
			avgPercent: graded?.avg ?? 0,
			passRate: Math.round(num(passRate?.n) * 1000) / 10,
			materials: num(materials?.n)
		},
		perTest: perTest satisfies TestReportRow[],
		monthly,
		topStudents
	};
}
