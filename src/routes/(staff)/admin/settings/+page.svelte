<script lang="ts">
	import { enhance } from '$app/forms';
	import { Check, Copy, Eye, LockKeyhole, Palette, Save } from '@lucide/svelte';
	import { moduleLabel } from '#lib/features/platform/modules';
	import { toast } from '#lib/components/ui/toast.svelte';
	import { untrack } from 'svelte';

	let { data, form } = $props();
	let saving = $state(false);
	let copied = $state(false);
	$effect(() => {
		const message = form?.message;
		untrack(() => {
			if (message) toast(message);
		});
	});
	const enabled = $derived(data.modules.filter((m) => m.enabled));
	const copyCode = async () => {
		try {
			await navigator.clipboard.writeText(data.profile.slug);
			copied = true;
			setTimeout(() => (copied = false), 1600);
		} catch {
			toast('Could not copy. Select the code and copy it manually.', 'error');
		}
	};
</script>

<svelte:head><title>Institute settings · {data.profile.name}</title></svelte:head>

<div class="wrap">
	<header>
		<p class="eyebrow">Setup</p>
		<h1 class="page-title">Institute settings</h1>
		<p class="page-sub">Manage how your institute appears to students and staff. Module access is controlled by the platform.</p>
	</header>

	{#if form?.message}<p class="alert alert-success" role="status">{form.message}</p>{/if}

	<section class="card card-pad">
		<div class="card-head"><h2>Branding and contact</h2><Palette /></div>
		<form method="POST" action="?/profile" use:enhance={() => { saving = true; return async ({ update }) => { await update({ reset: false }); saving = false; }; }} class="grid-2">
			<label class="field"><span class="label">Institute name</span><input class="input" name="name" required maxlength="120" value={data.profile.name} /></label>
			<div class="field">
				<span class="label">Institute code</span>
				<div class="code-row">
					<input class="input font-mono" value={data.profile.slug} disabled readonly />
					<button type="button" class="btn btn-secondary btn-sm" onclick={copyCode} aria-label="Copy institute code">
						{#if copied}<Check />Copied{:else}<Copy />Copy{/if}
					</button>
				</div>
				<span class="help">Share this code with students. After signing in they enter it on the join screen.</span>
			</div>
			<label class="field"><span class="label">Tagline</span><input class="input" name="tagline" maxlength="160" value={data.profile.tagline} /></label>
			<label class="field"><span class="label">Primary colour</span><input class="input" name="primaryColor" type="color" value={data.profile.primaryColor} /></label>
			<label class="field"><span class="label">Contact email</span><input class="input" name="contactEmail" type="email" value={data.profile.contactEmail ?? ''} /></label>
			<label class="field"><span class="label">Phone</span><input class="input" name="phone" type="tel" value={data.profile.phone ?? ''} /></label>
			<label class="field"><span class="label">Website</span><input class="input" name="website" type="url" placeholder="https://" value={data.profile.website ?? ''} /></label>
			<label class="field"><span class="label">Logo URL</span><input class="input" name="logoUrl" type="url" placeholder="https://" value={data.profile.logoUrl ?? ''} /></label>
			<label class="field span-2"><span class="label">Address</span><input class="input" name="address" maxlength="500" value={data.profile.address} /></label>
			<label class="field span-2"><span class="label">About the institute <span class="opt">optional</span></span><textarea class="textarea" name="description" rows="4" maxlength="4000">{data.profile.description}</textarea></label>
			<div class="span-2"><button class="btn btn-primary" disabled={saving}><Save />{saving ? 'Saving…' : 'Save profile'}</button></div>
		</form>
	</section>

	<section class="card card-pad">
		<div class="card-head"><h2>Modules</h2><span class="badge badge-primary">{enabled.length} enabled</span></div>
		<p class="muted small mb-3">Your plan controls these features. Contact the platform administrator to change them.</p>
		<ul class="modules">
			{#each data.modules as m (m.key)}
				<li class:off={!m.enabled}>
					<span class="tick" class:on={m.enabled}>{#if m.enabled}<Check />{:else}<LockKeyhole />{/if}</span>
					<span class="grow"><span class="name">{moduleLabel(m.key)}</span><span class="state">{m.enabled ? 'Enabled' : 'Disabled'}</span></span>
				</li>
			{/each}
		</ul>
	</section>

	<section class="card card-pad">
		<div class="card-head"><h2>Password</h2><LockKeyhole /></div>
		{#if !data.hasPassword}<p class="alert alert-warning mb-3">This account signs in with Google. Set a password to also sign in with email.</p>{/if}
		<form method="POST" action="?/password" use:enhance class="grid-2">
			<label class="field span-2"><span class="label">Current password</span><input class="input" name="currentPassword" type="password" autocomplete="current-password" /></label>
			<label class="field"><span class="label">New password</span><input class="input" name="newPassword" type="password" minlength="8" required autocomplete="new-password" /></label>
			<label class="field"><span class="label">Confirm new password</span><input class="input" name="confirmPassword" type="password" minlength="8" required autocomplete="new-password" /></label>
			<div class="span-2"><button class="btn btn-secondary"><Eye />Update password</button></div>
		</form>
	</section>
</div>

<style>
	.wrap { max-width: 62rem; margin: 0 auto; padding: 0 var(--gutter) 3rem; display: grid; gap: 1.25rem; }
	.grid-2 { display: grid; gap: .9rem; grid-template-columns: 1fr; }
	@media (min-width: 720px) { .grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
	.span-2 { grid-column: 1 / -1; }
	.card-head { display: flex; align-items: center; justify-content: space-between; gap: .5rem; margin-bottom: .9rem; }
	.card-head :global(svg) { width: 1.1rem; height: 1.1rem; color: hsl(var(--muted-foreground)); }
	.modules { display: grid; gap: .4rem; }
	.modules li { display: flex; align-items: center; gap: .7rem; padding: .55rem .65rem; border: 1px solid hsl(var(--border)); border-radius: .7rem; }
	.modules li.off { opacity: .55; }
	.tick { display: grid; place-items: center; width: 1.6rem; height: 1.6rem; border-radius: 999px; background: hsl(var(--muted)); color: hsl(var(--muted-foreground)); flex-shrink: 0; }
	.tick.on { background: hsl(var(--success) / .12); color: hsl(var(--success)); }
	.tick :global(svg) { width: .95rem; height: .95rem; }
	.name { display: block; font-weight: 600; font-size: .9rem; }
	.state { display: block; font-size: .75rem; color: hsl(var(--muted-foreground)); }
	.help { display: block; font-size: .75rem; color: hsl(var(--muted-foreground)); margin-top: .25rem; }
	.code-row { display: flex; gap: .4rem; align-items: center; }
	.code-row .input { flex: 1; min-width: 0; }
</style>
