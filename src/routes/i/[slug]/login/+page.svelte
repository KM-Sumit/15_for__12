<script lang="ts">
	import { enhance } from '$app/forms';
	import { CircleAlert, GraduationCap } from '@lucide/svelte';
	import Brand from '#lib/components/shell/Brand.svelte';

	let { data, form } = $props();
	let busy = $state(false);
	const errors: Record<string, string> = {
		google: 'Google sign-in did not finish. Try again.',
		suspended: 'This account is paused. Contact the institute office.',
		in_use: 'This account is already signed in on another device. Sign out there, then try again.',
		institute: 'This Google account belongs to another institute.'
	};
	const href = $derived(`/auth/google?institute=${encodeURIComponent(data.institute.slug)}&next=${encodeURIComponent(data.next)}`);
</script>

<svelte:head><title>Sign in · {data.institute.name}</title></svelte:head>

{#snippet googleMark()}
	<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"
		><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8z" /><path
			fill="#34A853"
			d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9h-4v3.1A12 12 0 0 0 12 24z"
		/><path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" /><path
			fill="#EA4335"
			d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"
		/></svg
	>
{/snippet}

<div class="login" style="--inst: {data.institute.primaryColor}">
	<div class="login-card rise">
		<Brand href="/" />
		<div class="identity">
			<span class="logo">{#if data.institute.logoUrl}<img src={data.institute.logoUrl} alt="" />{:else}<GraduationCap />{/if}</span>
			<div>
				<h1 class="page-title">{data.institute.name}</h1>
				{#if data.institute.tagline}<p class="tiny muted">{data.institute.tagline}</p>{/if}
			</div>
		</div>

		{#if form?.message}<p class="alert alert-danger mt-4" role="alert">{form.message}</p>{:else if data.error}<p class="alert alert-danger mt-4" role="alert">{errors[data.error] ?? errors.google}</p>{/if}

		<form
			method="POST"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					await update({ reset: false });
					busy = false;
				};
			}}
			class="stack mt-4"
		>
			<input type="hidden" name="next" value={data.next} />
			<label class="field"><span class="label">Email</span><input class="input" name="email" type="email" required autocomplete="username" value={form?.email ?? ''} /></label>
			<label class="field"><span class="label">Password</span><input class="input" name="password" type="password" required autocomplete="current-password" /></label>
			<button class="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
		</form>

		{#if data.google}
			<div class="or"><span>or</span></div>
			<a {href} class="btn btn-secondary btn-lg btn-block google" data-sveltekit-reload>{@render googleMark()}Continue with Google</a>
			<p class="tiny muted mt-2 text-center">First time here? Google sign-in creates your student account for {data.institute.name}.</p>
		{:else}
			<p class="alert alert-warning mt-4">Google sign-in is not configured. Use the email and password from your institute.</p>
		{/if}

		<p class="tiny muted mt-5 text-center"><CircleAlert class="inline size-3" /> Need help? Contact {data.institute.name}, not the platform.</p>
		<p class="tiny muted mt-2 text-center"><a class="underline" href="/login">Platform / super admin sign in</a></p>
	</div>
</div>

<style>
	.login { min-height: 100svh; display: grid; place-items: center; padding: 2rem var(--gutter) 4rem; }
	.login-card { width: 100%; max-width: 27rem; padding: clamp(1.4rem, 1rem + 2vw, 2.25rem); background: hsl(var(--surface)); border: 1px solid hsl(var(--border)); border-radius: 24px; box-shadow: var(--shadow-lg); }
	.identity { display: flex; align-items: center; gap: .75rem; margin-top: 1.25rem; }
	.logo { display: grid; place-items: center; width: 3rem; height: 3rem; border-radius: .9rem; background: color-mix(in srgb, var(--inst) 14%, transparent); color: var(--inst); overflow: hidden; flex-shrink: 0; }
	.logo :global(svg) { width: 1.4rem; height: 1.4rem; }
	.logo img { width: 100%; height: 100%; object-fit: cover; }
	.identity .page-title { font-size: 1.5rem; }
	.or { display: flex; align-items: center; gap: .6rem; margin: 1rem 0; color: hsl(var(--muted-foreground)); font-size: .75rem; text-transform: uppercase; letter-spacing: .08em; }
	.or::before, .or::after { content: ""; flex: 1; height: 1px; background: hsl(var(--border)); }
	.google { gap: .7rem; font-weight: 600; }
</style>
