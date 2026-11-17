<script lang="ts">
	import { enhance } from '$app/forms';
	import { ArrowLeft, Building2, Check, Globe, KeyRound, LockKeyhole, Palette, Plus, Power, Save, ShieldCheck, Trash2, UserPlus, X } from '@lucide/svelte';
	import { moduleLabel } from '#lib/features/platform/modules';
	import { toast } from '#lib/components/ui/toast.svelte';
	import { untrack } from 'svelte';

	let { data, form } = $props();
	let busy = $state(false);
	let adding = $state(false);
	$effect(() => {
		const message = form?.message;
		untrack(() => {
			if (message) toast(message);
		});
	});
	const i = $derived(data.institute);
	const activeModules = $derived(data.modules.filter((m) => m.enabled).length);
	const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Never');
</script>

<svelte:head><title>{i.name} · Platform</title></svelte:head>

<div class="wrap">
	<a class="back" href="/super/institutes"><ArrowLeft />All institutes</a>

	<header class="rise">
		<div class="identity">
			<span class="logo">{#if i.logoUrl}<img src={i.logoUrl} alt="" />{:else}<Building2 />{/if}</span>
			<div>
				<p class="eyebrow">{i.status === 'active' ? 'Active institute' : 'Suspended institute'} · /{i.slug}</p>
				<h1 class="page-title">{i.name}</h1>
				<p class="page-sub">Created {when(i.createdAt)} · {activeModules} of {data.modules.length} modules enabled</p>
			</div>
		</div>
		<div class="head-actions">
			<a class="btn btn-secondary" href="/i/{i.slug}" target="_blank" rel="noopener"><Globe />Public page</a>
			<form method="POST" action="?/status" use:enhance>
				<input type="hidden" name="status" value={i.status === 'active' ? 'suspended' : 'active'} />
				<button class="btn" class:btn-danger={i.status === 'active'} class:btn-success={i.status !== 'active'}>
					<Power />{i.status === 'active' ? 'Suspend' : 'Activate'}
				</button>
			</form>
		</div>
	</header>

	<section class="kpis rise" style="--i: 1" aria-label="Institute numbers">
		<article><span>Students</span><strong>{data.stats.students}</strong></article>
		<article><span>Tests</span><strong>{data.stats.tests}</strong></article>
		<article><span>Questions</span><strong>{data.stats.questions}</strong></article>
		<article><span>Attempts</span><strong>{data.stats.attempts}</strong></article>
		<article><span>Materials</span><strong>{data.stats.materials}</strong></article>
	</section>

	<div class="cols">
		<section class="card card-pad rise" style="--i: 2">
			<div class="card-head"><h2>Profile</h2><Palette /></div>
			<form method="POST" action="?/profile" use:enhance={() => { busy = true; return async ({ update }) => { await update({ reset: false }); busy = false; }; }} class="grid-2">
				<label class="field"><span class="label">Name</span><input class="input" name="name" required value={i.name} /></label>
				<label class="field"><span class="label">Plan</span><select class="select" name="planId"><option value="">No plan</option>{#each data.plans as p (p.id)}<option value={p.id} selected={p.id === i.planId}>{p.name}</option>{/each}</select></label>
				<label class="field"><span class="label">Tagline</span><input class="input" name="tagline" value={i.tagline} /></label>
				<label class="field"><span class="label">Primary colour</span><input class="input" name="primaryColor" type="color" value={i.primaryColor} /></label>
				<label class="field"><span class="label">Contact email</span><input class="input" name="contactEmail" type="email" value={i.contactEmail ?? ''} /></label>
				<label class="field"><span class="label">Phone</span><input class="input" name="phone" value={i.phone ?? ''} /></label>
				<label class="field"><span class="label">Website</span><input class="input" name="website" type="url" value={i.website ?? ''} /></label>
				<label class="field"><span class="label">Logo URL</span><input class="input" name="logoUrl" type="url" value={i.logoUrl ?? ''} /></label>
				<label class="field span-2">
					<span class="label">Payment page link <span class="opt">(admin-only, never shown to students)</span></span>
					<input class="input" name="paymentLink" type="url" inputmode="url" placeholder="https://razorpay.me/@yourinstitute" value={i.paymentLink ?? ''} />
					<span class="help">External Razorpay/payment page. The institute admin can copy or open it from Payments; students never see this link.</span>
				</label>
				<label class="field span-2"><span class="label">Address</span><input class="input" name="address" value={i.address} /></label>
				<label class="field span-2"><span class="label">About</span><textarea class="textarea" name="description" rows="3">{i.description}</textarea></label>
				<label class="field span-2"><span class="label">Internal notes</span><textarea class="textarea" name="notes" rows="2">{i.notes}</textarea></label>
				<div class="span-2"><button class="btn btn-primary" disabled={busy}><Save />{busy ? 'Saving…' : 'Save profile'}</button></div>
			</form>
		</section>

		<section class="card card-pad rise" style="--i: 3">
			<div class="card-head"><h2>Plan</h2><ShieldCheck /></div>
			<form method="POST" action="?/plan" use:enhance class="inline">
				<select class="select" name="planId"><option value="">No plan</option>{#each data.plans as p (p.id)}<option value={p.id} selected={p.id === i.planId}>{p.name}</option>{/each}</select>
				<button class="btn btn-secondary btn-sm">Apply plan</button>
			</form>
			<p class="muted small mt-2">Plan modules seed new institutes. Explicit switches below always win.</p>

			<div class="card-head mt-5"><h2>Modules</h2><span class="badge badge-primary">{activeModules}/{data.modules.length}</span></div>
			<ul class="modules">
				{#each data.modules as m (m.key)}
					<li>
						<span class="tick" class:on={m.enabled}>{#if m.enabled}<Check />{:else}<X />{/if}</span>
						<span class="grow"><span class="name">{moduleLabel(m.key)}</span><span class="state">{m.overridden ? 'Custom override' : 'From plan'}</span></span>
						<form method="POST" action="?/module" use:enhance>
							<input type="hidden" name="key" value={m.key} />
							<input type="hidden" name="enabled" value={m.enabled ? 'false' : 'true'} />
							<button class="btn btn-ghost btn-sm">{m.enabled ? 'Disable' : 'Enable'}</button>
						</form>
					</li>
				{/each}
			</ul>
		</section>
	</div>

	<section class="card card-pad rise" style="--i: 4">
		<div class="card-head"><h2>Team</h2><button class="btn btn-secondary btn-sm" onclick={() => (adding = !adding)}><UserPlus />{adding ? 'Close' : 'Add account'}</button></div>

		{#if adding}
			<form method="POST" action="?/admin" use:enhance class="grid-3 add">
				<label class="field"><span class="label">Name</span><input class="input" name="name" maxlength="120" /></label>
				<label class="field"><span class="label">Email</span><input class="input" name="email" type="email" required /></label>
				<label class="field"><span class="label">Role</span><select class="select" name="role"><option value="admin">Admin</option><option value="teacher">Teacher</option></select></label>
				<label class="field"><span class="label">Password</span><input class="input" name="password" type="password" minlength="8" required autocomplete="new-password" /></label>
				<div class="span-all end"><button class="btn btn-primary"><Plus />Create account</button></div>
			</form>
		{/if}

		<div class="table-wrap">
			<table>
				<thead><tr><th>Person</th><th>Role</th><th>Status</th><th>Last seen</th><th class="right">Actions</th></tr></thead>
				<tbody>
					{#each data.members as m (m.id)}
						<tr>
							<td><span class="pname">{m.name}</span><span class="pemail">{m.email}</span></td>
							<td><span class="badge badge-primary">{m.role}</span></td>
							<td>{#if m.suspended}<span class="badge badge-danger">suspended</span>{:else}<span class="badge badge-live">active</span>{/if}</td>
							<td class="muted small">{when(m.lastSeenAt)}</td>
							<td class="right actions-cell">
								<details>
									<summary class="btn btn-ghost btn-sm"><KeyRound />Reset</summary>
									<form method="POST" action="?/reset" use:enhance class="pw">
										<input type="hidden" name="userId" value={m.id} />
										<input class="input" name="password" type="password" minlength="8" required placeholder="New password" autocomplete="new-password" />
										<button class="btn btn-primary btn-sm">Save</button>
									</form>
								</details>
								<form method="POST" action="?/suspend" use:enhance>
									<input type="hidden" name="userId" value={m.id} />
									<input type="hidden" name="suspended" value={m.suspended ? 'false' : 'true'} />
									<button class="btn btn-ghost btn-sm" class:danger={!m.suspended}>{m.suspended ? 'Reactivate' : 'Suspend'}</button>
								</form>
							</td>
						</tr>
					{:else}
						<tr><td colspan="5" class="muted">No members yet.</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<div class="cols">
		<section class="card card-pad rise" style="--i: 5">
			<div class="card-head"><h2>Recent activity</h2></div>
			<ul class="audit">
				{#each data.audit as a (a.id)}
					<li><span class="grow"><span class="name">{a.action.replaceAll('_', ' ')} {a.target ? `· ${a.target}` : ''}</span><span class="state">{a.actor} · {when(a.at)}</span></span></li>
				{:else}
					<li class="muted small">No activity yet.</li>
				{/each}
			</ul>
		</section>

		<section class="card card-pad rise danger-zone" style="--i: 6">
			<div class="card-head"><h2>Delete institute</h2><Trash2 /></div>
			<p class="muted small">This removes the institute, its memberships and all tenant data. Type the exact name to confirm.</p>
			<form method="POST" action="?/delete" use:enhance onsubmit={(e) => { if (!confirm('Delete this institute and all its data?')) e.preventDefault(); }} class="stack-sm">
				<input class="input" name="confirmName" placeholder={i.name} required />
				<button class="btn btn-danger"><Trash2 />Delete permanently</button>
			</form>
		</section>
	</div>
</div>

<style>
	.wrap { max-width: 72rem; margin: 0 auto; padding: 0 var(--gutter) 3rem; display: grid; gap: 1.25rem; }
	.back { display: inline-flex; align-items: center; gap: .35rem; font-size: .875rem; font-weight: 600; color: hsl(var(--muted-foreground)); }
	.back :global(svg) { width: 1rem; height: 1rem; }
	header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; }
	.identity { display: flex; align-items: center; gap: .9rem; min-width: 0; }
	.logo { display: grid; place-items: center; width: 3.25rem; height: 3.25rem; border-radius: 1rem; background: hsl(var(--accent)); color: hsl(var(--accent-foreground)); overflow: hidden; flex-shrink: 0; }
	.logo :global(svg) { width: 1.5rem; height: 1.5rem; }
	.logo img { width: 100%; height: 100%; object-fit: cover; }
	.head-actions { display: flex; gap: .4rem; flex-wrap: wrap; }
	.kpis { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .6rem; }
	@media (min-width: 800px) { .kpis { grid-template-columns: repeat(5, minmax(0, 1fr)); } }
	.kpis article { display: grid; gap: .15rem; padding: .8rem .9rem; background: hsl(var(--surface)); border: 1px solid hsl(var(--border)); border-radius: .9rem; }
	.kpis span { font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; font-weight: 700; color: hsl(var(--muted-foreground)); }
	.kpis strong { font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; line-height: 1; }
	.cols { display: grid; gap: 1.1rem; }
	@media (min-width: 980px) { .cols { grid-template-columns: 1.35fr 1fr; } }
	.card-head { display: flex; align-items: center; justify-content: space-between; gap: .5rem; margin-bottom: .8rem; }
	.card-head :global(svg) { width: 1.1rem; height: 1.1rem; color: hsl(var(--muted-foreground)); }
	.grid-2 { display: grid; gap: .8rem; grid-template-columns: 1fr; }
	.grid-3 { display: grid; gap: .8rem; grid-template-columns: 1fr; }
	@media (min-width: 720px) { .grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } .grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
	.span-2 { grid-column: 1 / -1; }
	.span-all { grid-column: 1 / -1; }
	.inline { display: flex; gap: .5rem; align-items: center; }
	.inline .select { flex: 1; }
	.modules { display: grid; gap: .35rem; }
	.modules li { display: flex; align-items: center; gap: .6rem; padding: .5rem .6rem; border: 1px solid hsl(var(--border)); border-radius: .65rem; }
	.tick { display: grid; place-items: center; width: 1.5rem; height: 1.5rem; border-radius: 999px; background: hsl(var(--muted)); color: hsl(var(--muted-foreground)); flex-shrink: 0; }
	.tick.on { background: hsl(var(--success) / .12); color: hsl(var(--success)); }
	.tick :global(svg) { width: .9rem; height: .9rem; }
	.name { display: block; font-weight: 600; font-size: .875rem; }
	.state { display: block; font-size: .72rem; color: hsl(var(--muted-foreground)); }
	.add { padding: .75rem; border: 1px dashed hsl(var(--border)); border-radius: .8rem; margin-bottom: .8rem; }
	.end { display: flex; justify-content: flex-end; }
	.table-wrap { overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; font-size: .85rem; }
	th, td { padding: .6rem .55rem; border-bottom: 1px solid hsl(var(--border)); text-align: left; vertical-align: middle; }
	th { font-size: .7rem; text-transform: uppercase; letter-spacing: .06em; color: hsl(var(--muted-foreground)); }
	tr:last-child td { border-bottom: 0; }
	.right { text-align: right; }
	.pname { display: block; font-weight: 600; }
	.pemail { display: block; font-size: .75rem; color: hsl(var(--muted-foreground)); }
	.actions-cell { display: flex; gap: .25rem; justify-content: flex-end; flex-wrap: wrap; }
	summary { cursor: pointer; list-style: none; }
	summary::-webkit-details-marker { display: none; }
	.pw { display: flex; gap: .3rem; margin-top: .35rem; min-width: 13rem; }
	.pw .input { flex: 1; min-width: 0; }
	.danger { color: hsl(var(--danger)); }
	.audit { display: grid; gap: .35rem; }
	.audit li { padding: .4rem 0; border-bottom: 1px solid hsl(var(--border)); }
	.audit li:last-child { border-bottom: 0; }
	.danger-zone { border-color: hsl(var(--danger) / .35); }
</style>
