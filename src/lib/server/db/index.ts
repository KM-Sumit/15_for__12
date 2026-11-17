import { AsyncLocalStorage } from 'node:async_hooks';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../env';
import * as schema from './schema';

type DrizzleDb = ReturnType<typeof buildDb>;

const buildDb = (client: postgres.Sql) =>
	// prepare:false keeps it compatible with PgBouncer transaction pooling in production.
	// max 20: a full class starting together + advisory locks on start must not queue behind 10 slots.
	drizzle(client, { schema, casing: 'snake_case' });

const connectClient = () => postgres(env().DATABASE_URL, { prepare: false, max: 20, idle_timeout: 30 });

// Kept on globalThis so Vite dev reloads reuse one pool instead of leaking a new one per reload
// (several dev servers otherwise exhaust Postgres max_connections).
const g = globalThis as typeof globalThis & {
	__cqClient?: postgres.Sql;
	__cqDb?: DrizzleDb;
};

const baseClient = () => (g.__cqClient ??= connectClient());
const baseDb = () => (g.__cqDb ??= buildDb(baseClient()));

/**
 * Request-scoped database. hooks.server.ts reserves one Postgres connection per authenticated request and
 * sets `app.institute_id` / `app.bypass_rls` on it. PostgreSQL RLS then filters every tenant table, even
 * queries written before multi-tenancy existed. Outside a request (scripts, tests) the base pool is used.
 */
const requestDb = new AsyncLocalStorage<DrizzleDb>();
const requestScopeStore = new AsyncLocalStorage<RequestScope>();

/** Created on first use so `vite build` (which imports server modules) never needs a database. */
export const db = () => requestDb.getStore() ?? baseDb();
export type DB = DrizzleDb;
export { schema };

export type RequestScope = { instituteId: string | null; bypassRls: boolean };

/** The tenant bound to the current request, if any. Synchronous and safe for service layers. */
export const requestScope = () => requestScopeStore.getStore() ?? null;

/**
 * postgres.js `reserve()` returns a query function without the helpers Drizzle reads (`options`) or
 * the transaction helpers (`begin` / `savepoint`). Attach the minimum shape Drizzle's postgres-js
 * driver needs, backed by the same reserved connection.
 */
function scopedClient(reserved: Awaited<ReturnType<postgres.Sql['reserve']>>) {
	type ScopedSql = postgres.Sql & { savepoint: (fn: (tx: postgres.Sql) => Promise<unknown>) => Promise<unknown> };
	const client = reserved as unknown as ScopedSql;
	client.options = baseClient().options;
	let savepoints = 0;

	const run = async (start: string, finish: string, undo: string, fn: (tx: postgres.Sql) => Promise<unknown>) => {
		await reserved.unsafe(start);
		try {
			const result = await fn(client);
			await reserved.unsafe(finish);
			return result;
		} catch (e) {
			try {
				await reserved.unsafe(undo);
			} catch {
				// The original error is more useful than a failed rollback on a broken connection.
			}
			throw e;
		}
	};

	client.begin = ((optionsOrFn: unknown, maybeFn?: unknown) => {
		const fn = (typeof optionsOrFn === 'function' ? optionsOrFn : maybeFn) as (tx: postgres.Sql) => Promise<unknown>;
		return run('begin', 'commit', 'rollback', fn);
	}) as postgres.Sql['begin'];
	client.savepoint = (fn: (tx: postgres.Sql) => Promise<unknown>) => {
		const name = `app_sp_${++savepoints}`;
		return run(`savepoint ${name}`, `release savepoint ${name}`, `rollback to savepoint ${name}`, fn);
	};

	return client as postgres.Sql;
}

/**
 * Runs `fn` with a dedicated connection whose RLS variables are set. The connection is reset and returned
 * to the pool afterwards, so no tenant context can leak to the next request.
 */
export async function withRequestDb<T>(scope: RequestScope, fn: () => Promise<T>): Promise<T> {
	const reserved = await baseClient().reserve();
	try {
		await reserved.unsafe(
			`select set_config('app.institute_id', $1, false), set_config('app.bypass_rls', $2, false)`,
			[scope.instituteId ?? '', scope.bypassRls ? 'on' : 'off']
		);
		const scoped = buildDb(scopedClient(reserved));
		return await requestScopeStore.run(scope, () => requestDb.run(scoped, fn));
	} finally {
		try {
			await reserved.unsafe(`select set_config('app.institute_id', '', false), set_config('app.bypass_rls', 'off', false)`);
		} catch {
			// Connection already broken; release below discards it.
		}
		reserved.release();
	}
}

/** Escape hatch for one-off jobs that genuinely need cross-tenant access. Never call from a user request. */
export async function withPlatformDb<T>(fn: () => Promise<T>): Promise<T> {
	return withRequestDb({ instituteId: null, bypassRls: true }, fn);
}

export async function dbReady() {
	try {
		await db().execute(sql`select 1`);
		return true;
	} catch {
		return false;
	}
}
