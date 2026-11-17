<script lang="ts">
	import { enhance } from '$app/forms';
	import { CreditCard, Plus, Save } from '@lucide/svelte';
	import { MODULES } from '#lib/features/platform/modules';
	import { toast } from '#lib/components/ui/toast.svelte';
	import { untrack } from 'svelte';

	let { data, form } = $props();
	let creating = $state(false);
	$effect(() => {
		const message = form?.message;
		untrack(() => {
			if (message) toast(message);
		});
	});
	const plans = $derived(data.plans);
	const price = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
	const limit = (n: number | null) => (n == null ? 'Unlimited' : String(n));
</script>

<svelte:head><title>Plans · EduSphere</title></svelte:head>

<div class="wrap">
	<header class="rise">
		<div>
			<p class="eyebrow">Commercial</p>
			<h1 class="page-title">Plans</h1>
			<p class="page-sub">Packages that decide an institute's default modules and limits.</p>
		</div>
		<button class="btn btn-primary" onclick={() => (creating = !creating)}><Plus />{creating ? 'Close' : 'New plan'}</button>
	</header>

	{#if creating}
		<form method="POST" action="?/save" use:enhance class="card card-pad rise">
			<div class="card-head"><h2>New plan</h2><CreditCard /></div>
			<div class="grid-2">
				<label class="field"><span class="label">Name</span><input class="input" name="name" required maxlength="80" /></label>
				<label class="field"><span class="label">Slug</span><input class="input" name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="growth" /></label>
				<label class="field span-2"><span class="label">Description</span><input class="input" name="description" maxlength="1000" /></label>
				<label class="field"><span class="label">Price (INR per month)</span><input class="input" name="priceInr" type="number" min="0" value="0" /></label>
				<label class="field"><span class="label">Student limit</span><input class="input" name="maxStudents" type="number" min="1" placeholder="Unlimited" /></label>
				<label class="field"><span class="label">Admin limit</span><input class="input" name="maxAdmins" type="number" min="1" placeholder="Unlimited" /></label>
				<label class="field"><span class="label">Test limit</span><input class="input" name="maxTests" type="number" min="1" placeholder="Unlimited" /></label>
			</div>
			<div class="sub">
				<h3>Default modules</h3>
				<div class="checks">{#each MODULES as m (m.key)}<label class="check"><input type="checkbox" name="modules" value={m.key} checked />{m.label}</label>{/each}</div>
			</div>
			<label class="check mt-3"><input type="checkbox" name="active" checked /> Active (available to assign)</label>
			<div class="mt-3"><button class="btn btn-primary"><Save />Save plan</button></div>
		</form>
	{/if}

	<div class="grid">
		{#each plans as p (p.id)}
			<article class="card card-pad plan rise">
				<div class="plan-head">
					<div>
						<h2>{p.name}</h2>
						<p class="muted small">{p.description || 'No description'}</p>
					</div>
					<span class="badge" class:badge-live={p.active} class:badge-closed={!p.active}>{p.active ? 'active' : 'hidden'}</span>
				</div>
				<p class="price">{price(p.priceInr)}<span>/month</span></p>
				<ul class="limits">
					<li><span>Students</span><strong>{limit(p.maxStudents)}</strong></li>
					<li><span>Admins</span><strong>{limit(p.maxAdmins)}</strong></li>
					<li><span>Tests</span><strong>{limit(p.maxTests)}</strong></li>
					<li><span>Modules</span><strong>{p.modules.length || MODULES.length}</strong></li>
				</ul>
				<div class="chips">{#each (p.modules.length ? p.modules : MODULES.map((m) => m.key)) as k (k)}<span class="chip">{k.replaceAll('_', ' ')}</span>{/each}</div>

				<details>
					<summary class="btn btn-secondary btn-sm">Edit plan</summary>
					<form method="POST" action="?/save" use:enhance class="edit">
						<input type="hidden" name="id" value={p.id} />
						<div class="grid-2">
							<label class="field"><span class="label">Name</span><input class="input" name="name" required value={p.name} /></label>
							<label class="field"><span class="label">Slug</span><input class="input" name="slug" required value={p.slug} /></label>
							<label class="field span-2"><span class="label">Description</span><input class="input" name="description" value={p.description} /></label>
							<label class="field"><span class="label">Price (INR)</span><input class="input" name="priceInr" type="number" min="0" value={p.priceInr} /></label>
							<label class="field"><span class="label">Student limit</span><input class="input" name="maxStudents" type="number" min="1" value={p.maxStudents ?? ''} placeholder="Unlimited" /></label>
							<label class="field"><span class="label">Admin limit</span><input class="input" name="maxAdmins" type="number" min="1" value={p.maxAdmins ?? ''} placeholder="Unlimited" /></label>
							<label class="field"><span class="label">Test limit</span><input class="input" name="maxTests" type="number" min="1" value={p.maxTests ?? ''} placeholder="Unlimited" /></label>
						</div>
						<div class="sub"><h3>Modules</h3><div class="checks">{#each MODULES as m (m.key)}<label class="check"><input type="checkbox" name="modules" value={m.key} checked={p.modules.includes(m.key)} />{m.label}</label>{/each}</div></div>
						<label class="check mt-3"><input type="checkbox" name="active" checked={p.active} /> Active</label>
						<button class="btn btn-primary mt-3"><Save />Save changes</button>
					</form>
				</details>
			</article>
		{:else}
			<div class="empty"><CreditCard /><p>No plans yet. Create one to package modules and limits.</p></div>
		{/each}
	</div>
</div>

<style>
	.wrap { max-width: 68rem; margin: 0 auto; padding: 0 var(--gutter) 3rem; display: grid; gap: 1.25rem; }
	header { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 1rem; }
	.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: .8rem; }
	.card-head :global(svg) { width: 1.1rem; height: 1.1rem; color: hsl(var(--muted-foreground)); }
	.grid { display: grid; gap: 1rem; }
	@media (min-width: 780px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
	.grid-2 { display: grid; gap: .8rem; grid-template-columns: 1fr; }
	@media (min-width: 640px) { .grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
	.span-2 { grid-column: 1 / -1; }
	.sub { margin-top: .9rem; }
	.sub h3 { font-size: .875rem; font-weight: 700; margin-bottom: .4rem; }
	.checks { display: grid; gap: .3rem; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); }
	.check { display: flex; align-items: center; gap: .45rem; font-size: .85rem; }
	.plan-head { display: flex; align-items: start; justify-content: space-between; gap: .5rem; }
	.plan-head h2 { font-family: var(--font-display); font-size: 1.1rem; font-weight: 800; }
	.price { font-family: var(--font-display); font-size: 1.75rem; font-weight: 800; margin-top: .5rem; }
	.price span { font-size: .8rem; font-weight: 500; color: hsl(var(--muted-foreground)); }
	.limits { display: grid; gap: .25rem; margin: .7rem 0; }
	.limits li { display: flex; justify-content: space-between; font-size: .85rem; padding: .2rem 0; border-bottom: 1px solid hsl(var(--border)); }
	.limits li:last-child { border-bottom: 0; }
	.limits span { color: hsl(var(--muted-foreground)); }
	.chips { display: flex; flex-wrap: wrap; gap: .3rem; margin-bottom: .8rem; }
	.chip { font-size: .72rem; padding: .2rem .5rem; border-radius: 999px; background: hsl(var(--muted)); color: hsl(var(--muted-foreground)); }
	summary { cursor: pointer; list-style: none; }
	summary::-webkit-details-marker { display: none; }
	.edit { margin-top: .8rem; }
	.empty { display: grid; place-items: center; gap: .5rem; padding: 3rem 1rem; text-align: center; color: hsl(var(--muted-foreground)); border: 1px dashed hsl(var(--border)); border-radius: 1rem; grid-column: 1 / -1; }
</style>
