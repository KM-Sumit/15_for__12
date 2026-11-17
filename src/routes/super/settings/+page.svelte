<script lang="ts">
	import { enhance } from '$app/forms';
	import { Building2, Mail, Phone, Save, Settings } from '@lucide/svelte';
	import { toast } from '#lib/components/ui/toast.svelte';
	import { untrack } from 'svelte';

	let { data, form } = $props();
	let busy = $state(false);
	$effect(() => {
		const message = form?.message;
		untrack(() => {
			if (message) toast(message);
		});
	});
	const s = $derived(data.brand);
</script>

<svelte:head><title>Platform settings · EduSphere</title></svelte:head>

<div class="wrap">
	<header class="rise">
		<p class="eyebrow">Platform</p>
		<h1 class="page-title">Platform settings</h1>
		<p class="page-sub">Branding and support details shown on the public website and sign-in screens.</p>
	</header>

	<form method="POST" use:enhance={() => { busy = true; return async ({ update }) => { await update({ reset: false }); busy = false; }; }} class="card card-pad rise" style="--i: 1">
		<div class="card-head"><h2>Brand</h2><Building2 /></div>
		<div class="grid-2">
			<label class="field"><span class="label">Platform name</span><input class="input" name="brand_name" maxlength="80" value={s.name} /></label>
			<label class="field"><span class="label">Tagline</span><input class="input" name="brand_tagline" maxlength="160" value={s.tagline} /></label>
			<label class="field"><span class="label">Support email</span><input class="input" name="support_email" type="email" value={s.supportEmail} /></label>
			<label class="field"><span class="label">Support phone</span><input class="input" name="support_phone" type="tel" value={s.supportPhone} /></label>
			<label class="field span-2"><span class="label">Footer note</span><textarea class="textarea" name="footer_note" rows="3" maxlength="300">{s.footerNote}</textarea></label>
		</div>
		<div class="mt-3"><button class="btn btn-primary" disabled={busy}><Save />{busy ? 'Saving…' : 'Save settings'}</button></div>
	</form>

	<section class="card card-pad rise" style="--i: 2">
		<div class="card-head"><h2>Support</h2><Settings /></div>
		<p class="muted small">These details appear in the public footer and on the platform sign-in page.</p>
		<ul class="support">
			<li><Mail /><span>{s.supportEmail || 'No support email set'}</span></li>
			<li><Phone /><span>{s.supportPhone || 'No support phone set'}</span></li>
		</ul>
	</section>

	<section class="card card-pad rise" style="--i: 3">
		<div class="card-head"><h2>Environment</h2></div>
		<dl class="env">
			<div><dt>Tenant isolation</dt><dd>PostgreSQL row-level security</dd></div>
			<div><dt>Super admin area</dt><dd>/super</dd></div>
			<div><dt>Institute sign-in</dt><dd>/i/[slug]/login</dd></div>
			<div><dt>Student app</dt><dd>/app</dd></div>
		</dl>
	</section>
</div>

<style>
	.wrap { max-width: 60rem; margin: 0 auto; padding: 0 var(--gutter) 3rem; display: grid; gap: 1.25rem; }
	.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: .9rem; }
	.card-head :global(svg) { width: 1.1rem; height: 1.1rem; color: hsl(var(--muted-foreground)); }
	.grid-2 { display: grid; gap: .9rem; grid-template-columns: 1fr; }
	@media (min-width: 720px) { .grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
	.span-2 { grid-column: 1 / -1; }
	.support { display: grid; gap: .5rem; margin-top: .65rem; }
	.support li { display: flex; align-items: center; gap: .5rem; font-size: .9rem; }
	.support :global(svg) { width: 1rem; height: 1rem; color: hsl(var(--muted-foreground)); }
	.env { display: grid; gap: .35rem; }
	.env div { display: flex; justify-content: space-between; gap: 1rem; font-size: .85rem; padding: .4rem 0; border-bottom: 1px solid hsl(var(--border)); }
	.env div:last-child { border-bottom: 0; }
	.env dt { color: hsl(var(--muted-foreground)); }
	.env dd { font-family: var(--font-mono); font-size: .8rem; }
</style>
