<script lang="ts">
	import { enhance } from '$app/forms';
	import { CircleAlert } from '@lucide/svelte';
	import Brand from '#lib/components/shell/Brand.svelte';

	let { data, form } = $props();
	let busy = $state(false);
</script>

<svelte:head><title>Create account · EduSphere</title></svelte:head>

<div class="login">
	<div class="login-card rise">
		<Brand href="/" />
		<h1 class="page-title mt-5 text-center">Create your account</h1>
		<p class="page-sub mt-2 text-center">Email and password sign-in for students.</p>

		{#if form?.message}<p class="alert alert-danger mt-5" role="alert"><CircleAlert class="size-4 shrink-0" />{form.message}</p>{/if}

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
			<label class="field"><span class="label">Full name</span><input class="input" name="name" required autocomplete="name" value={form?.name ?? ''} /></label>
			<label class="field"><span class="label">Email</span><input class="input" name="email" type="email" required autocomplete="username" value={form?.email ?? ''} /></label>
			<label class="field"
				><span class="label">Password</span><input class="input" name="password" type="password" required minlength={8} autocomplete="new-password" />
				<span class="help">At least 8 characters.</span></label
			>
			<label class="field"
				><span class="label">Institute code <span class="muted">(optional)</span></span
				><input class="input" name="code" value={form?.code ?? data.code} placeholder="e.g. vision-institute" autocomplete="off" />
				<span class="help">Your institute shares this code — it connects your account to them.</span></label
			>
			<button class="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
		</form>

		<p class="tiny muted mt-5 text-center">Already have an account? <a class="underline" href="/login">Sign in</a></p>
	</div>
</div>

<style>
	.login { min-height: calc(100svh - 64px); display: grid; place-items: center; padding: 2rem var(--gutter) 4rem; }
	.login-card { width: 100%; max-width: 26rem; padding: clamp(1.5rem, 1rem + 2vw, 2.5rem); background: hsl(var(--surface)); border: 1px solid hsl(var(--border)); border-radius: 24px; box-shadow: var(--shadow-lg); }
	.alert { display: flex; gap: .5rem; align-items: flex-start; }
</style>
