<script lang="ts">
	import { enhance } from '$app/forms';
	import { ArrowRight, BarChart3, CalendarClock, KeyRound, ListChecks, PlayCircle, Plus, Trophy } from '@lucide/svelte';
	let { data, form } = $props();
	const m = $derived(data.modules ?? []);
	const hour = $derived(Number(new Intl.DateTimeFormat('en-IN', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Kolkata' }).format(new Date(data.serverNow ?? new Date().toISOString()))));
	const greet = $derived(hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');
	let joining = $state(false);
</script>

<svelte:head><title>Student home{data.needsInstitute ? '' : ` · ${data.institute.name}`}</title></svelte:head>

<div class="home">
	<header class="rise">
		<p class="eyebrow">{data.needsInstitute ? 'Welcome' : data.institute.name}</p>
		<h1 class="page-title">{greet}, {data.firstName}</h1>
		<p class="page-sub">{data.needsInstitute ? 'One last step — add your coaching institute.' : 'Your tests, results and progress — all in one place.'}</p>
	</header>

	{#if data.needsInstitute}
		<section class="card card-pad code-card rise" style="--i: 1" aria-label="Add institute">
			<div class="code-head">
				<span class="code-icon"><KeyRound /></span>
				<div>
					<h2 class="section-title">Enter institute code</h2>
					<p class="muted small">The unique code your coaching shares. Join more than one coaching — each gets its own button and its own tests.</p>
				</div>
			</div>
			{#if form?.message}<p class="alert alert-danger" role="alert">{form.message}</p>{/if}
			<form
				method="POST"
				action="?/join"
				class="code-form"
				use:enhance={() => {
					joining = true;
					return async ({ update }) => {
						await update({ reset: false });
						joining = false;
					};
				}}
			>
				<label class="sr-only" for="institute-code">Institute code</label>
				<input
					id="institute-code"
					class="input code-input"
					name="code"
					placeholder="institute-code"
					autocomplete="off"
					autocapitalize="none"
					spellcheck="false"
					required
				/>
				<button class="btn btn-primary btn-lg" disabled={joining}>{joining ? 'Adding…' : 'Add institute'}</button>
			</form>
			<p class="tiny muted">Example: <code>vision-institute</code>. Coaching ke admin se code maango.</p>
		</section>
	{:else}
	{#if data.institutes.length > 1}
		<section class="insts rise" style="--i: 1" aria-label="My institutes">
			<p class="eyebrow mb-2">My institutes</p>
			<div class="inst-grid">
				{#each data.institutes as inst (inst.id)}
					<form method="POST" action="?/switch">
						<input type="hidden" name="instituteId" value={inst.id} />
						<button class="inst-btn" class:current={inst.id === data.activeInstitute} type="submit">
							<span class="inst-logo">{#if inst.logoUrl}<img src={inst.logoUrl} alt="" />{:else}{inst.name.slice(0, 1)}{/if}</span>
							<span class="inst-name">{inst.name}</span>
							{#if inst.id === data.activeInstitute}<span class="badge badge-accent">Now</span>{/if}
						</button>
					</form>
				{/each}
				<a class="inst-btn add" href="/join"><span class="inst-logo"><Plus /></span><span class="inst-name">Add coaching</span></a>
			</div>
		</section>
	{:else if data.institutes.length === 1}
		<p class="tiny muted add-line rise" style="--i: 1">Studying at more than one coaching? <a class="underline" href="/join">Add another institute</a> — its tests appear separately.</p>
	{/if}

	{#if data.inProgress || data.next}
		<section class="hero rise" style="--i: 1">
			{#if data.inProgress}
				<p class="eyebrow">Continue where you left off</p>
				<h2>{data.inProgress.title}</h2>
				<p>Your answers are saved. Finish before the timer runs out.</p>
				<a class="btn btn-primary btn-lg" href="/app/tests/{data.inProgress.id}/attempt/{data.inProgress.inProgressAttemptId}"><PlayCircle />Resume test</a>
			{:else if data.next}
				<p class="eyebrow">Open now</p>
				<h2>{data.next.title}</h2>
				<p>{data.next.questionCount} questions · {data.next.durationMin} minutes · {data.next.totalMarks} marks</p>
				<a class="btn btn-primary btn-lg" href="/app/tests/{data.next.id}">Start test <ArrowRight /></a>
			{/if}
		</section>
	{/if}

	{#if m.includes('results')}
		<section class="stats rise" style="--i: 2" aria-label="Your progress">
			<article><span>Tests taken</span><strong>{data.stats.testsTaken}</strong></article>
			<article><span>Average score</span><strong>{data.stats.avgPercent == null ? '—' : `${data.stats.avgPercent}%`}</strong></article>
			<article><span>Best score</span><strong>{data.stats.bestPercent == null ? '—' : `${data.stats.bestPercent}%`}</strong></article>
		</section>
	{/if}

	<nav class="tiles rise" style="--i: 3" aria-label="Shortcuts">
		{#if m.includes('online_tests')}
			<a class="tile" href="/app/tests"><span class="ic bg-1"><ListChecks /></span><span>All tests</span><ArrowRight /></a>
		{/if}
		{#if m.includes('results')}
			<a class="tile" href="/app/me/history"><span class="ic bg-3"><BarChart3 /></span><span>My results</span><ArrowRight /></a>
		{/if}
		{#if m.includes('notifications')}
			<a class="tile" href="/app/inbox"><span class="ic bg-4"><CalendarClock /></span><span>Inbox</span><ArrowRight /></a>
		{/if}
	</nav>

	<div class="cols">
		{#if m.includes('online_tests') && data.upcoming.length}
			<section class="rise" style="--i: 4">
				<div class="section-head"><h2 class="section-title">Coming up</h2><a class="link" href="/app/tests">All tests</a></div>
				<ul class="list">
					{#each data.upcoming as t (t.id)}
						<li><a class="list-row" href="/app/tests/{t.id}"><span class="grow"><span class="title block">{t.title}</span><span class="meta block">{new Date(t.startsAt!).toLocaleString('en-IN')}</span></span><ArrowRight class="chev" /></a></li>
					{/each}
				</ul>
			</section>
		{/if}
	</div>

	{#if m.includes('results') && data.results.length}
		<section class="rise" style="--i: 6">
			<div class="section-head"><h2 class="section-title">Recent results</h2><a class="link" href="/app/me/history">Full history</a></div>
			<ul class="list">
				{#each data.results as r (r.attemptId)}
					<li>
						<a class="list-row" href="/app/results/{r.attemptId}">
							<span class="grow"><span class="title block">{r.testTitle}</span><span class="meta block">{new Date(r.startedAt).toLocaleDateString('en-IN')}</span></span>
							<span class="trail"><Trophy /><span class="font-mono">{r.percentage == null ? '—' : `${Math.round(r.percentage)}%`}</span></span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
	{/if}
</div>

<style>
	.code-card { display: grid; gap: .8rem; }
	.code-head { display: flex; gap: .8rem; align-items: flex-start; }
	.code-icon { display: grid; place-items: center; width: 2.6rem; height: 2.6rem; border-radius: .8rem; background: hsl(var(--accent)); color: hsl(var(--accent-foreground)); flex-shrink: 0; }
	.code-icon :global(svg) { width: 1.2rem; height: 1.2rem; }
	.code-form { display: flex; gap: .6rem; flex-wrap: wrap; }
	.code-input { flex: 1 1 14rem; font-family: var(--font-mono); letter-spacing: .02em; }
	.code-form .btn { flex: 0 0 auto; }
	.code-card code { font-family: var(--font-mono); font-size: .85em; background: hsl(var(--muted)); padding: .1rem .35rem; border-radius: .35rem; }
	.insts .inst-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .6rem; }
	@media (min-width: 700px) { .insts .inst-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
	.inst-btn { width: 100%; display: flex; align-items: center; gap: .6rem; padding: .65rem .75rem; background: hsl(var(--surface)); border: 1px solid hsl(var(--border)); border-radius: .9rem; text-align: left; transition: border-color .15s; }
	.inst-btn:hover { border-color: hsl(var(--primary) / .6); }
	.inst-btn.current { border-color: hsl(var(--primary)); }
	.inst-btn.add { color: hsl(var(--muted-foreground)); }
	.inst-logo { display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: .6rem; background: hsl(var(--accent)); color: hsl(var(--accent-foreground)); font-weight: 800; font-size: .85rem; overflow: hidden; flex-shrink: 0; }
	.inst-logo :global(svg) { width: 1rem; height: 1rem; }
	.inst-logo img { width: 100%; height: 100%; object-fit: cover; }
	.inst-name { flex: 1; min-width: 0; font-weight: 600; font-size: .85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.add-line { margin-top: -.5rem; }
	.home { max-width: 60rem; margin: 0 auto; padding: 0 var(--gutter) 3rem; display: grid; gap: 1.6rem; }
	.hero { padding: 1.35rem 1.25rem; border-radius: 1.25rem; border: 1px solid hsl(var(--border)); background: linear-gradient(135deg, hsl(var(--surface)), hsl(var(--accent) / .55)); display: grid; gap: .55rem; justify-items: start; }
	.hero h2 { font-family: var(--font-display); font-size: clamp(1.25rem, 1.1rem + 1vw, 1.75rem); font-weight: 800; line-height: 1.15; }
	.hero p { color: hsl(var(--muted-foreground)); font-size: .9375rem; }
	.hero .btn { margin-top: .35rem; }
	.stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; }
	.stats article { display: grid; gap: .2rem; padding: .95rem 1rem; background: hsl(var(--surface)); border: 1px solid hsl(var(--border)); border-radius: 1rem; }
	.stats span { font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; font-weight: 700; color: hsl(var(--muted-foreground)); }
	.stats strong { font-family: var(--font-display); font-size: 1.7rem; font-weight: 800; line-height: 1.1; }
	.tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .7rem; }
	@media (min-width: 800px) { .tiles { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
	.tile { display: flex; align-items: center; gap: .6rem; padding: .8rem; border: 1px solid hsl(var(--border)); border-radius: 1rem; background: hsl(var(--surface)); font-weight: 700; }
	.tile .ic { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; border-radius: .8rem; color: #fff; flex-shrink: 0; }
	.tile .ic :global(svg) { width: 1.2rem; height: 1.2rem; }
	.tile span:nth-child(2) { flex: 1; font-size: .9rem; }
	.tile :global(svg:last-child) { width: 1rem; height: 1rem; color: hsl(var(--muted-foreground)); }
	.bg-1 { background: linear-gradient(150deg, #7c6cff, #4a3bd6); }
	.bg-2 { background: linear-gradient(150deg, #35c97a, #12965a); }
	.bg-3 { background: linear-gradient(150deg, #ffb347, #f07a16); }
	.bg-4 { background: linear-gradient(150deg, #4bb6ff, #2c6fe4); }
	.cols { display: grid; gap: 1.5rem; }
	@media (min-width: 900px) { .cols { grid-template-columns: 1fr 1fr; align-items: start; } }
	.trail { display: flex; align-items: center; gap: .35rem; font-weight: 700; color: hsl(var(--primary)); }
	.trail :global(svg) { width: 1rem; height: 1rem; }
</style>
