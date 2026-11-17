<script lang="ts">
	import { enhance } from '$app/forms';
	import { ShieldCheck } from '@lucide/svelte';
	import Brand from '#lib/components/shell/Brand.svelte';

	let { data, form } = $props();
	let busy = $state(false);
	const errors: Record<string, string> = {
		suspended: 'This administrator account is suspended.',
		institute_suspended: 'That institute is suspended.'
	};
</script>

<svelte:head><title>Platform sign in · EduSphere</title></svelte:head>

<div class="login">
	<div class="login-card rise">
		<Brand />
		<div class="mark"><ShieldCheck /></div>
		<h1 class="page-title mt-3 text-center">Platform sign in</h1>
		<p class="page-sub mt-2 text-center">Super administrator access to institutes, plans and usage.</p>

		{#if form?.message}<p class="alert alert-danger mt-5" role="alert">{form.message}</p>{:else if data.error}<p class="alert alert-danger mt-5" role="alert">{errors[data.error] ?? 'Sign in failed.'}</p>{/if}

		<form
			method="POST"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					await update({ reset: false });
					busy = false;
				};
			}}
			class="stack mt-5"
		>
			<input type="hidden" name="next" value={data.next} />
			<label class="field"><span class="label">Email</span><input class="input" name="email" type="email" required autocomplete="username" value={form?.email ?? ''} /></label>
			<label class="field"><span class="label">Password</span><input class="input" name="password" type="password" required autocomplete="current-password" /></label>
			<button class="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
		</form>

		<p class="tiny muted mt-5 text-center">
			First setup? Sign in once with Google on the <a class="underline" href="/login">main sign-in page</a>; the first account becomes the platform owner.
		</p>
	</div>
</div>

<style>
	.login { min-height: calc(100svh - 64px); display: grid; place-items: center; padding: 2rem var(--gutter) 4rem; }
	.login-card { width: 100%; max-width: 26rem; padding: clamp(1.5rem, 1rem + 2vw, 2.5rem); background: hsl(var(--surface)); border: 1px solid hsl(var(--border)); border-radius: 24px; box-shadow: var(--shadow-lg); }
	.mark { display: grid; place-items: center; width: 3.25rem; height: 3.25rem; margin: 1.25rem auto 0; border-radius: 1rem; background: hsl(var(--accent)); color: hsl(var(--accent-foreground)); }
	.mark :global(svg) { width: 1.5rem; height: 1.5rem; }
</style>
