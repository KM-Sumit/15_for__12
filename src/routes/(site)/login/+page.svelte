<script lang="ts">
	import { enhance } from '$app/forms';
	import { CircleAlert } from '@lucide/svelte';
	import Brand from '#lib/components/shell/Brand.svelte';

	let { data, form } = $props();
	let busy = $state(false);
	const errors: Record<string, string> = {
		google: 'Google sign-in did not finish. Try again.',
		suspended: 'This account is paused. Contact your institute office.',
		in_use: 'This account is already signed in on another phone or laptop. Sign out there, then try again.',
		email_unverified: 'Your Google email is not verified. Verify it with Google, then try again.',
		institute_suspended: 'Your institute is suspended. Contact the institute office.',
		membership_disabled: 'Your membership is disabled. Contact the institute office.'
	};
	const href = $derived(`/auth/google${data.next ? `?next=${encodeURIComponent(data.next)}` : ''}`);
</script>

<svelte:head><title>Sign in · EduSphere</title></svelte:head>

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

<div class="login">
	<div class="login-card rise">
		<Brand href="/" />
		<h1 class="page-title mt-5 text-center">Welcome back</h1>
		<p class="page-sub mt-2 text-center">Sign in to your coaching institute workspace.</p>

		{#if form?.message}<p class="alert alert-danger mt-5" role="alert"><CircleAlert class="size-4 shrink-0" />{form.message}</p>{:else if data.error}<p class="alert alert-danger mt-5" role="alert"><CircleAlert class="size-4 shrink-0" />{errors[data.error] ?? errors.google}</p>{/if}

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

		{#if data.google}
			<div class="or"><span>or</span></div>
			<a {href} class="btn btn-secondary btn-lg btn-block google" data-sveltekit-reload>{@render googleMark()}Continue with Google</a>
			<p class="tiny muted mt-2 text-center">New student? Google sign-in creates your account, then you choose your institute.</p>
		{:else}
			<p class="alert alert-warning mt-4">Google sign-in is not configured on this server.</p>
		{/if}

		<p class="tiny muted mt-5 text-center">Students and admins sign in here with the email and password your institute gave you.</p>
		<p class="tiny muted mt-2 text-center">New student? <a class="link" href="/signup">Create an account</a></p>
	</div>
</div>

<style>
	.login { min-height: calc(100svh - 64px); display: grid; place-items: center; padding: 2rem var(--gutter) 4rem; }
	.login-card { width: 100%; max-width: 26rem; padding: clamp(1.5rem, 1rem + 2vw, 2.5rem); background: hsl(var(--surface)); border: 1px solid hsl(var(--border)); border-radius: 24px; box-shadow: var(--shadow-lg); }
	.google { gap: .75rem; font-weight: 600; }
	.or { display: flex; align-items: center; gap: .6rem; margin: 1rem 0; color: hsl(var(--muted-foreground)); font-size: .75rem; text-transform: uppercase; letter-spacing: .08em; }
	.or::before, .or::after { content: ""; flex: 1; height: 1px; background: hsl(var(--border)); }
	.alert { display: flex; gap: .5rem; align-items: flex-start; }
</style>
