<script lang="ts">
	import { enhance } from '$app/forms';
	import { FileText, Link2, Plus, Trash2 } from '@lucide/svelte';
	import { toast } from '#lib/components/ui/toast.svelte';
	import { untrack } from 'svelte';
	let { data, form } = $props();
	let creating = $state(false);
	$effect(() => {
		const message = form?.message;
		untrack(() => {
			if (message) toast(message);
		});
	});
</script>

<svelte:head><title>Study materials · Admin</title></svelte:head>

<div class="wrap">
	<header class="head">
		<div>
			<p class="eyebrow">Study materials</p>
			<h1 class="page-title">Resources</h1>
			<p class="page-sub">PDFs, links and reading notes for your students.</p>
		</div>
		<button class="btn btn-primary" onclick={() => (creating = !creating)}><Plus />{creating ? 'Close' : 'Add material'}</button>
	</header>

	{#if creating}
		<form method="POST" action="?/create" use:enhance class="card form">
			<div class="row">
				<label class="field"><span>Title</span><input name="title" required maxlength="160" /></label>
				<label class="field"><span>Type</span>
					<select name="kind"><option value="text">Reading</option><option value="pdf">PDF</option><option value="link">Link</option></select>
				</label>
			</div>
			<label class="field"><span>Short description</span><input name="description" maxlength="500" /></label>
			<label class="field"><span>URL (PDF or external link)</span><input name="url" type="url" placeholder="https://" /></label>
			<label class="field"><span>Reading content (markdown)</span><textarea name="body" rows="8"></textarea></label>
			<label class="check"><input type="checkbox" name="published" /> Publish to students immediately</label>
			<button class="btn btn-primary">Create material</button>
		</form>
	{/if}

	{#if data.materials.length}
		<div class="list">
			{#each data.materials as m (m.id)}
				<article class="card item">
					<span class="icon">{#if m.kind === 'link'}<Link2 />{:else}<FileText />{/if}</span>
					<div class="grow">
						<p class="title">{m.title} {#if !m.published}<span class="badge">Draft</span>{/if}</p>
						<p class="meta">{m.kind.toUpperCase()} · updated {new Date(m.updatedAt).toLocaleDateString('en-IN')}</p>
						{#if m.description}<p class="desc">{m.description}</p>{/if}
					</div>
					<div class="actions">
						<form method="POST" action="?/toggle" use:enhance>
							<input type="hidden" name="id" value={m.id} />
							<input type="hidden" name="published" value={m.published ? '' : 'on'} />
							<button class="btn btn-secondary btn-sm">{m.published ? 'Unpublish' : 'Publish'}</button>
						</form>
						<form method="POST" action="?/delete" use:enhance onsubmit={(e) => { if (!confirm('Delete this material?')) e.preventDefault(); }}>
							<input type="hidden" name="id" value={m.id} />
							<button class="btn btn-ghost btn-sm danger" aria-label="Delete"><Trash2 /></button>
						</form>
					</div>
				</article>
			{/each}
		</div>
	{:else}
		<div class="empty"><FileText /><p>No study material yet. Add your first PDF, link or reading note.</p></div>
	{/if}
</div>

<style>
	.wrap { max-width: 60rem; margin: 0 auto; padding: 0 var(--gutter) 3rem; display: grid; gap: 1.5rem; }
	.head { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 1rem; }
	.form { display: grid; gap: .9rem; padding: 1.25rem; }
	.row { display: grid; gap: .9rem; grid-template-columns: 1fr; }
	@media (min-width: 640px) { .row { grid-template-columns: 2fr 1fr; } }
	.field { display: grid; gap: .35rem; font-size: .875rem; font-weight: 600; }
	.field input, .field select, .field textarea { width: 100%; padding: .65rem .75rem; border: 1px solid hsl(var(--border)); border-radius: .65rem; background: hsl(var(--background)); font: inherit; font-weight: 400; }
	.check { display: flex; align-items: center; gap: .5rem; font-size: .9rem; }
	.item { display: flex; gap: .9rem; align-items: flex-start; padding: 1rem; }
	.icon { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; border-radius: .75rem; background: hsl(var(--accent)); color: hsl(var(--accent-foreground)); flex-shrink: 0; }
	.icon :global(svg) { width: 1.2rem; height: 1.2rem; }
	.grow { flex: 1; min-width: 0; }
	.title { font-weight: 700; }
	.meta { font-size: .75rem; color: hsl(var(--muted-foreground)); margin-top: .15rem; }
	.desc { font-size: .875rem; color: hsl(var(--muted-foreground)); margin-top: .35rem; }
	.badge { font-size: .65rem; text-transform: uppercase; letter-spacing: .05em; padding: .15rem .4rem; border-radius: 99px; background: hsl(var(--muted)); color: hsl(var(--muted-foreground)); margin-left: .35rem; }
	.actions { display: flex; gap: .35rem; }
	.danger { color: hsl(var(--danger)); }
	.empty { display: grid; place-items: center; gap: .5rem; padding: 3rem 1rem; text-align: center; color: hsl(var(--muted-foreground)); border: 1px dashed hsl(var(--border)); border-radius: 1rem; }
</style>
