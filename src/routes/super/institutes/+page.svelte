<script lang="ts">
	import { enhance } from '$app/forms';
	import { Building2, Plus, Search } from '@lucide/svelte';
	import { MODULES } from '#lib/features/platform/modules';
	import { toast } from '#lib/components/ui/toast.svelte';
	import { page } from '$app/state';
	import { untrack } from 'svelte';

	let { data, form } = $props();
	let creating = $state(false);
	let q = $state('');
	let busy = $state(false);

	$effect(() => {
		const message = form?.message;
		const ok = form?.ok;
		untrack(() => {
			if (message) toast(message);
			if (ok) creating = false;
		});
	});

	const shown = $derived(data.institutes.filter((i) => !q || `${i.name} ${i.slug} ${i.contactEmail ?? ''}`.toLowerCase().includes(q.toLowerCase())));
	const slugify = (s: string) =>
		s
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 48);
	let name = $state('');
	let slug = $state('');
	let touched = $state(false);
</script>

<svelte:head><title>Institutes · EduSphere</title></svelte:head>

<div class="wrap">
	<header class="rise">
		<div>
			<p class="eyebrow">Platform</p>
			<h1 class="page-title">Institutes</h1>
			<p class="page-sub">{data.institutes.length} coaching institutes on EduSphere.</p>
		</div>
		<button class="btn btn-primary" onclick={() => (creating = !creating)}><Plus />{creating ? 'Close' : 'New institute'}</button>
	</header>

	{#if creating}
		<form
			method="POST"
			action="?/create"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					await update({ reset: false });
					busy = false;
				};
			}}
			class="card card-pad form rise"
		>
			<div class="card-head"><h2>Create an institute</h2></div>
			<div class="grid-2">
				<label class="field"><span class="label">Institute name</span><input class="input" name="name" required maxlength="120" bind:value={name} oninput={() => { if (!touched) slug = slugify(name); }} /></label>
				<label class="field"><span class="label">URL slug</span><input class="input" name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" bind:value={slug} oninput={() => (touched = true)} placeholder="my-institute" /><span class="help">Students sign in at /i/{slug || 'your-slug'}/login</span></label>
				<label class="field"><span class="label">Tagline</span><input class="input" name="tagline" maxlength="160" /></label>
				<label class="field"><span class="label">Plan</span><select class="select" name="planId"><option value="">No plan (all modules)</option>{#each data.plans as p (p.id)}<option value={p.id}>{p.name}</option>{/each}</select></label>
				<label class="field"><span class="label">Contact email</span><input class="input" name="contactEmail" type="email" /></label>
				<label class="field"><span class="label">Phone</span><input class="input" name="phone" type="tel" /></label>
				<label class="field span-2"><span class="label">Address</span><input class="input" name="address" maxlength="500" /></label>
			</div>

			<div class="split">
				<div class="sub">
					<h3>Coaching admin</h3>
					<div class="grid-2">
						<label class="field"><span class="label">Admin name</span><input class="input" name="adminName" maxlength="120" /></label>
						<label class="field"><span class="label">Admin email</span><input class="input" name="adminEmail" type="email" required /></label>
						<label class="field span-2"><span class="label">Temporary password</span><input class="input" name="adminPassword" type="password" minlength="8" required autocomplete="new-password" /><span class="help">At least 8 characters. The admin can change it later.</span></label>
					</div>
				</div>
				<div class="sub">
					<h3>Modules</h3>
					<p class="help mb-2">Leave all unchecked to use the plan defaults.</p>
					<div class="checks">
						{#each MODULES as m (m.key)}
							<label class="check"><input type="checkbox" name="modules" value={m.key} />{m.label}</label>
						{/each}
					</div>
				</div>
			</div>

			{#if form?.message}<p class="alert alert-danger" role="alert">{form.message}</p>{/if}
			<div><button class="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create institute'}</button></div>
		</form>
	{/if}

	<form class="search rise" style="--i: 1" onsubmit={(e) => e.preventDefault()} role="search">
		<Search aria-hidden="true" />
		<input bind:value={q} placeholder="Search by name, slug or email" aria-label="Search institutes" />
	</form>

	<div class="list rise" style="--i: 2">
		{#each shown as i (i.id)}
			<a class="list-row" href="/super/institutes/{i.id}">
				<span class="leading-icon">{#if i.logoUrl}<img src={i.logoUrl} alt="" />{:else}<Building2 />{/if}</span>
				<span class="grow">
					<span class="title block">{i.name} <span class="slug">/{i.slug}</span></span>
					<span class="meta block">{i.planName ?? 'No plan'} · {i.students} students · {i.tests} tests · {i.attempts} attempts</span>
				</span>
				<span class="badge" class:badge-live={i.status === 'active'} class:badge-danger={i.status !== 'active'}>{i.status}</span>
			</a>
		{:else}
			<div class="empty"><Building2 /><p>No institutes match.</p></div>
		{/each}
	</div>
</div>

<style>
	.wrap { max-width: 68rem; margin: 0 auto; padding: 0 var(--gutter) 3rem; display: grid; gap: 1.15rem; }
	header { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 1rem; }
	.card-head { margin-bottom: .75rem; }
	.grid-2 { display: grid; gap: .9rem; grid-template-columns: 1fr; }
	@media (min-width: 720px) { .grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
	.span-2 { grid-column: 1 / -1; }
	.split { display: grid; gap: 1.25rem; margin-top: 1.1rem; }
	@media (min-width: 860px) { .split { grid-template-columns: 1fr 1fr; } }
	.sub h3 { font-size: .9rem; font-weight: 700; margin-bottom: .5rem; }
	.checks { display: grid; gap: .3rem; grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr)); }
	.check { display: flex; align-items: center; gap: .45rem; font-size: .85rem; }
	.help { display: block; font-size: .75rem; color: hsl(var(--muted-foreground)); margin-top: .2rem; }
	.search { display: flex; align-items: center; gap: .55rem; padding: .35rem .35rem .35rem .85rem; background: hsl(var(--surface)); border: 1px solid hsl(var(--border)); border-radius: 999px; }
	.search :global(svg) { width: 1rem; height: 1rem; color: hsl(var(--muted-foreground)); }
	.search input { flex: 1; min-width: 0; border: 0; background: transparent; font: inherit; font-size: .9375rem; outline: none; }
	.leading-icon { display: grid; place-items: center; width: 2.4rem; height: 2.4rem; border-radius: .75rem; background: hsl(var(--accent)); color: hsl(var(--accent-foreground)); flex-shrink: 0; overflow: hidden; }
	.leading-icon :global(svg) { width: 1.1rem; height: 1.1rem; }
	.leading-icon img { width: 100%; height: 100%; object-fit: cover; }
	.slug { font-weight: 400; color: hsl(var(--muted-foreground)); font-size: .8em; }
	.empty { display: grid; place-items: center; gap: .5rem; padding: 3rem 1rem; text-align: center; color: hsl(var(--muted-foreground)); }
</style>
