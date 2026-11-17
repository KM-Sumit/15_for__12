<script lang="ts">
	import { enhance } from '$app/forms';
	import { ArrowRight, Building2, GraduationCap, KeyRound } from '@lucide/svelte';
	import Brand from '#lib/components/shell/Brand.svelte';

	let { data, form } = $props();
	let busyId = $state('');
	let joining = $state(false);
	let code = $state('');
</script>

<svelte:head><title>Join your institute · EduSphere</title></svelte:head>

<div class="join">
	<header class="top"><Brand href="/" /><span class="who">{data.email}</span></header>

	<main class="inner">
		<div class="head rise">
			{#if data.mine.length}
				<p class="eyebrow">Add another coaching</p>
				<h1 class="page-title">Join another institute</h1>
				<p class="page-sub">You already study at {data.mine.map((m) => m.name).join(', ')}. Enter another institute's code to add it — both stay separate, and you switch between them from your dashboard.</p>
			{:else}
				<p class="eyebrow">One last step</p>
				<h1 class="page-title">Join your coaching institute</h1>
				<p class="page-sub">Enter the institute code your coaching shared, or pick it from the list below. Your tests, materials and results appear after joining.</p>
			{/if}
		</div>

		{#if form?.message}<p class="alert alert-danger rise" role="alert">{form.message}</p>{/if}

		<section class="card card-pad code-card rise" style="--i: 1">
			<div class="code-head">
				<span class="code-icon"><KeyRound /></span>
				<div>
					<h2 class="section-title">Enter institute code</h2>
					<p class="muted small">For example <code>vision-institute</code>. You can also paste your institute link.</p>
				</div>
			</div>
			<form
				method="POST"
				action="?/code"
				class="code-form"
				use:enhance={() => {
					joining = true;
					return async ({ update }) => {
						await update({ reset: false });
						joining = false;
					};
				}}
			>
				<input type="hidden" name="next" value={data.next} />
				<label class="sr-only" for="institute-code">Institute code</label>
				<input
					id="institute-code"
					class="input code-input"
					name="code"
					bind:value={code}
					placeholder="institute-code"
					autocomplete="off"
					autocapitalize="none"
					spellcheck="false"
					required
				/>
				<button class="btn btn-primary btn-lg" disabled={joining}>{joining ? 'Joining…' : 'Join institute'}</button>
			</form>
			<p class="tiny muted">Ask your institute admin for the code. It is shown in their <b>Institute settings</b> page.</p>
		</section>

		<div class="or rise" style="--i: 2"><span>or choose from the list</span></div>

		<div class="grid rise" style="--i: 3">
			{#each data.institutes as i (i.id)}
				<form
					method="POST"
					action="?/pick"
					use:enhance={() => {
						busyId = i.id;
						return async ({ update }) => {
							await update({ reset: false });
							busyId = '';
						};
					}}
				>
					<input type="hidden" name="instituteId" value={i.id} />
					<input type="hidden" name="next" value={data.next} />
					<button class="inst" disabled={busyId === i.id}>
						<span class="logo">{#if i.logoUrl}<img src={i.logoUrl} alt="" />{:else}<Building2 />{/if}</span>
						<span class="grow"><span class="name">{i.name}</span><span class="tag">{i.tagline || i.address || 'Coaching institute on EduSphere'}</span></span>
						<span class="go">{busyId === i.id ? 'Joining…' : data.mine.some((m) => m.id === i.id) ? 'Joined' : 'Join'}<ArrowRight /></span>
					</button>
				</form>
			{:else}
				<div class="empty">
					<GraduationCap />
					<p>No institutes are listed publicly yet.</p>
					<p class="tiny muted">Use the institute code above, or ask your coaching institute to add you.</p>
				</div>
			{/each}
		</div>

		<p class="tiny muted mt-4 text-center">Every institute you join appears as a separate button on your dashboard — tests, results and batches stay per institute.</p>
	</main>
</div>

<style>
	.join { min-height: 100svh; display: flex; flex-direction: column; padding: 0 var(--gutter) calc(2rem + var(--safe-bottom)); }
	.top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; height: 64px; max-width: 50rem; margin: 0 auto; width: 100%; }
	.who { font-size: .8rem; color: hsl(var(--muted-foreground)); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.inner { flex: 1; width: 100%; max-width: 50rem; margin: 0 auto; padding-top: clamp(1.5rem, 4vw, 3rem); }
	.code-card { margin-top: 1.25rem; display: grid; gap: .8rem; }
	.code-head { display: flex; gap: .8rem; align-items: flex-start; }
	.code-icon { display: grid; place-items: center; width: 2.6rem; height: 2.6rem; border-radius: .8rem; background: hsl(var(--accent)); color: hsl(var(--accent-foreground)); flex-shrink: 0; }
	.code-icon :global(svg) { width: 1.2rem; height: 1.2rem; }
	.code-form { display: flex; gap: .6rem; flex-wrap: wrap; }
	.code-input { flex: 1 1 14rem; font-family: var(--font-mono); letter-spacing: .02em; }
	.code-form .btn { flex: 0 0 auto; }
	.code-card code { font-family: var(--font-mono); font-size: .85em; background: hsl(var(--muted)); padding: .1rem .35rem; border-radius: .35rem; }
	.or { display: flex; align-items: center; gap: .7rem; margin: 1.6rem 0 .2rem; color: hsl(var(--muted-foreground)); font-size: .75rem; text-transform: uppercase; letter-spacing: .08em; }
	.or::before, .or::after { content: ""; flex: 1; height: 1px; background: hsl(var(--border)); }
	.grid { display: grid; gap: .65rem; margin-top: 1rem; }
	.inst { width: 100%; display: flex; align-items: center; gap: .8rem; padding: .9rem 1rem; background: hsl(var(--surface)); border: 1px solid hsl(var(--border)); border-radius: 1rem; text-align: left; transition: border-color .15s, transform .15s; }
	.inst:hover:not(:disabled) { border-color: hsl(var(--primary) / .6); }
	.inst:active:not(:disabled) { transform: scale(.995); }
	.logo { display: grid; place-items: center; width: 2.75rem; height: 2.75rem; border-radius: .8rem; background: hsl(var(--accent)); color: hsl(var(--accent-foreground)); overflow: hidden; flex-shrink: 0; }
	.logo :global(svg) { width: 1.2rem; height: 1.2rem; }
	.logo img { width: 100%; height: 100%; object-fit: cover; }
	.name { display: block; font-weight: 700; font-size: .95rem; }
	.tag { display: block; font-size: .8rem; color: hsl(var(--muted-foreground)); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.go { display: flex; align-items: center; gap: .25rem; font-size: .8rem; font-weight: 700; color: hsl(var(--primary)); flex-shrink: 0; }
	.go :global(svg) { width: .9rem; height: .9rem; }
	.empty { display: grid; place-items: center; gap: .5rem; padding: 3rem 1rem; text-align: center; color: hsl(var(--muted-foreground)); border: 1px dashed hsl(var(--border)); border-radius: 1rem; }
	.empty :global(svg) { width: 2rem; height: 2rem; }
</style>
