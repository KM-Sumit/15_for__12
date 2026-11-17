// Render's egress cannot reach the Supabase pooler over IPv6 (ECONNREFUSED on its AAAA record,
// 2026-11-17 deploy), while IPv4 works everywhere. Bun resolves dual-stack hosts IPv6-first, so
// pin every outgoing Postgres connection to IPv4 before the first connection is created.
// ALLOW_IPV6_DB=1 turns this off (e.g. self-hosting where only IPv6 reaches the database).
import dns from 'node:dns';

if (process.env.ALLOW_IPV6_DB !== '1') {
	try {
		// node:dns order — honoured by node:net, which postgres.js connects through.
		dns.setDefaultResultOrder('ipv4first');
	} catch {
		/* very old runtime: keep the system order */
	}
	try {
		// Bun's own resolver has a separate global switch.
		const b = globalThis as { Bun?: { dns?: { preforderPrimary?: string } } };
		if (b.Bun?.dns) b.Bun.dns.preforderPrimary = 'ipv4';
	} catch {
		/* Bun without the experimental API: ipv4first above still applies */
	}
	console.log('[boot] DNS: IPv4-first (Postgres over the pooler\'s IPv4 address)');
}
