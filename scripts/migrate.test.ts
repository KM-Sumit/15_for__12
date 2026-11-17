// Run against a disposable local Postgres: MIGRATION_TEST_DATABASE_URL=postgres://... bun test scripts/migrate.test.ts
import { expect, test } from 'bun:test';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const baseUrl = process.env.MIGRATION_TEST_DATABASE_URL;
const migrationsFolder = join(import.meta.dir, '../drizzle');

async function withDatabase(run: (client: ReturnType<typeof postgres>) => Promise<void>) {
	const name = `uci_migration_${crypto.randomUUID().replaceAll('-', '')}`;
	const admin = postgres(baseUrl!, { max: 1, onnotice: () => {} });
	let client: ReturnType<typeof postgres> | undefined;
	let created = false;
	try {
		await admin.unsafe(`CREATE DATABASE "${name}"`);
		created = true;
		const url = new URL(baseUrl!);
		url.pathname = `/${name}`;
		client = postgres(url.toString(), { max: 1, onnotice: () => {} });
		await run(client);
	} finally {
		await client?.end();
		if (created) await admin.unsafe(`DROP DATABASE "${name}"`);
		await admin.end();
	}
}

test.skipIf(!baseUrl)('all migrations apply to an empty database and can run again', async () => {
	await withDatabase(async (client) => {
		await migrate(drizzle(client), { migrationsFolder });
		await migrate(drizzle(client), { migrationsFolder });
		const [row] = await client`select count(*)::int as count from drizzle.__drizzle_migrations`;
		expect(row!.count).toBe(9);
	});
}, 30_000);

test.skipIf(!baseUrl)('FCM migration upgrades existing test sets without recreating schema or losing data', async () => {
	const folder = await mkdtemp(join(tmpdir(), 'uci-migrations-'));
	try {
		await cp(migrationsFolder, folder, { recursive: true });
		const journalPath = join(folder, 'meta/_journal.json');
		const journal = JSON.parse(await readFile(journalPath, 'utf8'));
		journal.entries = journal.entries.filter((entry: { idx: number }) => entry.idx < 8);
		await writeFile(journalPath, JSON.stringify(journal));
		await withDatabase(async (client) => {
			await migrate(drizzle(client), { migrationsFolder: folder });
			const [set] = await client`insert into test_sets (name, access, price_inr) values ('Existing paid set', 'paid', 299) returning id`;
			await client`insert into tests (title, set_id) values ('Existing test', ${set!.id})`;
			const [user] = await client`insert into users (email) values ('migration@test.local') returning id`;
			await client`insert into push_subscriptions (endpoint, user_id, p256dh, auth) values ('https://push.test/old', ${user!.id}, 'old-key', 'old-auth')`;

			await migrate(drizzle(client), { migrationsFolder });
			const [preserved] = await client`select name, access, price_inr from test_sets where id = ${set!.id}`;
			expect(preserved).toEqual({ name: 'Existing paid set', access: 'paid', price_inr: 299 });
			const [linked] = await client`select set_id from tests where title = 'Existing test'`;
			expect(linked!.set_id).toBe(set!.id);
			const [oldPush] = await client`select p256dh, auth, fcm_token from push_subscriptions where endpoint = 'https://push.test/old'`;
			expect(oldPush).toEqual({ p256dh: 'old-key', auth: 'old-auth', fcm_token: null });
			const [newPush] = await client`insert into push_subscriptions (endpoint, user_id, fcm_token) values ('fcm:test', ${user!.id}, 'device-token') returning p256dh, auth, fcm_token`;
			expect(newPush).toEqual({ p256dh: '', auth: '', fcm_token: 'device-token' });
		});
	} finally {
		await rm(folder, { recursive: true, force: true });
	}
}, 30_000);
