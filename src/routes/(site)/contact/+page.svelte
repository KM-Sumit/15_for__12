<script lang="ts">
	import { enhance } from '$app/forms';
	import { CheckCircle2, Mail, MessageCircle, Phone } from '@lucide/svelte';

	let { data, form } = $props();
	let busy = $state(false);
	const v = $derived(form && 'values' in form ? form.values : null);
	const done = $derived(form && 'ok' in form && form.ok ? form : null);
</script>

<svelte:head><title>Contact · {data.brand.name}</title></svelte:head>

<div class="site-wrap contact">
	<header class="hero rise">
		<p class="eyebrow">Contact</p>
		<h1>Bring your institute onto {data.brand.name}</h1>
		<p class="lead">Tell us about your coaching institute. We will reply with setup details, plans and a walkthrough.</p>
	</header>

	<div class="layout">
		<div class="card card-pad rise" style="--i: 1">
			{#if done}
				<div class="done" role="status">
					<CheckCircle2 />
					<h2>Thank you, {done.name}</h2>
					<p>We have your enquiry and will get back to you soon.</p>
					{#if data.support.email}<a class="btn btn-secondary" href="mailto:{data.support.email}"><Mail />Email us</a>{/if}
				</div>
			{:else}
				<h2 class="form-title">Request a walkthrough</h2>
				<form
					method="POST"
					use:enhance={() => {
						busy = true;
						return async ({ update }) => {
							await update({ reset: false });
							busy = false;
						};
					}}
				>
					<div class="field">
						<label class="label" for="name">Your name</label>
						<input id="name" name="name" autocomplete="name" required minlength="2" maxlength="80" value={v?.name ?? ''} />
					</div>
					<div class="field">
						<label class="label" for="phone">Mobile number</label>
						<div class="phone"><span class="font-mono">+91</span><input id="phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" required maxlength="14" placeholder="98XXXXXXXX" value={v?.phone ?? ''} /></div>
					</div>
					<div class="field">
						<label class="label" for="institute">Institute name <span class="opt">optional</span></label>
						<input id="institute" name="examInterest" maxlength="80" value={v?.examInterest ?? ''} />
					</div>
					<div class="field">
						<label class="label" for="message">What do you need? <span class="opt">optional</span></label>
						<textarea id="message" name="message" rows="4" maxlength="1000">{v?.message ?? ''}</textarea>
					</div>
					<input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true" />
					{#if form && 'error' in form}<p class="err" role="alert">{form.error}</p>{/if}
					<button class="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Sending…' : 'Send enquiry'}</button>
					<p class="tiny muted mt-2">We use your number only to reply. See the <a href="/legal/privacy" class="underline">privacy policy</a>.</p>
				</form>
			{/if}
		</div>

		<aside class="info rise" style="--i: 2">
			<h2>Platform support</h2>
			{#if data.support.email}<p><Mail /><a href="mailto:{data.support.email}">{data.support.email}</a></p>{/if}
			{#if data.support.phone}<p><Phone /><a href="tel:{data.support.phone}">{data.support.phone}</a></p>{/if}
			{#if !data.support.email && !data.support.phone}<p class="muted small">Support details are being configured. Send the form and we will reply.</p>{/if}
			<p class="muted small">Already a student or institute admin? Use your institute's sign-in page or the <a class="underline" href="/login">main sign-in</a>.</p>
		</aside>
	</div>
</div>

<style>
	.contact { padding-top: clamp(2rem, 5vw, 4rem); display: grid; gap: 1.75rem; }
	.hero { max-width: 42rem; }
	.hero h1 { font-family: var(--font-display); font-size: clamp(2rem, 1.5rem + 2.4vw, 3.2rem); font-weight: 800; line-height: 1.06; letter-spacing: -.035em; margin-top: .5rem; }
	.lead { color: hsl(var(--muted-foreground)); margin-top: .85rem; line-height: 1.7; }
	.layout { display: grid; gap: 1rem; }
	@media (min-width: 900px) { .layout { grid-template-columns: 1.2fr .8fr; align-items: start; } }
	.form-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; margin-bottom: .9rem; }
	.field { margin-bottom: .9rem; }
	.phone { display: flex; align-items: center; gap: .4rem; }
	.phone span { padding: .6rem .65rem; border: 1px solid hsl(var(--border)); border-radius: .6rem; background: hsl(var(--muted)); font-size: .85rem; }
	.phone input { flex: 1; }
	input, textarea { width: 100%; padding: .65rem .75rem; border: 1px solid hsl(var(--border)); border-radius: .65rem; background: hsl(var(--background)); font: inherit; }
	.hp { display: none; }
	.err { color: hsl(var(--danger)); font-size: .85rem; margin-bottom: .6rem; }
	.info { display: grid; gap: .55rem; padding: 1rem 0; }
	.info h2 { font-family: var(--font-display); font-size: 1.1rem; font-weight: 800; margin-bottom: .25rem; }
	.info p { display: flex; align-items: center; gap: .45rem; font-size: .9rem; }
	.info p.muted { display: block; }
	.info :global(svg) { width: 1rem; height: 1rem; color: hsl(var(--muted-foreground)); flex-shrink: 0; }
	.done { display: grid; gap: .6rem; justify-items: start; }
	.done :global(svg) { width: 2rem; height: 2rem; color: hsl(var(--success)); }
	.done h2 { font-family: var(--font-display); font-size: 1.35rem; font-weight: 800; }
	.done p { color: hsl(var(--muted-foreground)); }
</style>
