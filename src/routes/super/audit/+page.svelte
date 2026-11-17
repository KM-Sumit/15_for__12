<script lang="ts">
	import { ClipboardList } from '@lucide/svelte';
	import { page } from '$app/state';

	let { data } = $props();
	const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
	const filterHref = (id: string) => (id ? `?institute=${id}` : '?');
</script>

<svelte:head><title>Audit log · EduSphere</title></svelte:head>

<div class="wrap">
	<header class="rise">
		<p class="eyebrow">Governance</p>
		<h1 class="page-title">Audit log</h1>
		<p class="page-sub">Every platform and institute action, newest first.</p>
	</header>

	<nav class="filters rise" style="--i: 1" aria-label="Filter by institute">
		<a class="chip" class:is-active={!data.instituteId} href={filterHref('')}>All institutes</a>
		{#each data.institutes as i (i.id)}
			<a class="chip" class:is-active={data.instituteId === i.id} href={filterHref(i.id)}>{i.name}</a>
		{/each}
	</nav>

	<div class="card table-wrap rise" style="--i: 2">
		<table>
			<thead><tr><th>Action</th><th>Target</th><th>Institute</th><th>Actor</th><th>When</th></tr></thead>
			<tbody>
				{#each data.entries as e (e.id)}
					<tr>
						<td><span class="action">{e.action.replaceAll('_', ' ')}</span>{#if e.meta}<span class="meta">{JSON.stringify(e.meta).slice(0, 120)}</span>{/if}</td>
						<td class="target">{e.target || '—'}</td>
						<td>{e.institute}</td>
						<td>{e.actor}</td>
						<td class="muted small nowrap">{when(e.at)}</td>
					</tr>
				{:else}
					<tr><td colspan="5" class="empty"><ClipboardList />No audit entries yet.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.wrap { max-width: 72rem; margin: 0 auto; padding: 0 var(--gutter) 3rem; display: grid; gap: 1.1rem; }
	.filters { display: flex; gap: .35rem; overflow-x: auto; scrollbar-width: none; }
	.filters::-webkit-scrollbar { display: none; }
	.chip { padding: .4rem .75rem; border-radius: 999px; border: 1px solid hsl(var(--border)); background: hsl(var(--surface)); font-size: .8rem; font-weight: 600; white-space: nowrap; color: hsl(var(--muted-foreground)); }
	.chip.is-active { background: hsl(var(--foreground)); color: hsl(var(--background)); border-color: transparent; }
	.table-wrap { overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; font-size: .85rem; }
	th, td { padding: .65rem .75rem; border-bottom: 1px solid hsl(var(--border)); text-align: left; vertical-align: top; }
	th { font-size: .7rem; text-transform: uppercase; letter-spacing: .06em; color: hsl(var(--muted-foreground)); }
	tr:last-child td { border-bottom: 0; }
	.action { display: block; font-weight: 600; }
	.meta { display: block; font-size: .72rem; color: hsl(var(--muted-foreground)); margin-top: .15rem; max-width: 28rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.target { font-family: var(--font-mono); font-size: .78rem; max-width: 14rem; overflow-wrap: anywhere; }
	.nowrap { white-space: nowrap; }
	.empty { display: flex; align-items: center; justify-content: center; gap: .5rem; padding: 2.5rem 1rem; color: hsl(var(--muted-foreground)); }
</style>
