<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { Layers, Plus } from '@lucide/svelte';
	import { EmptyState, PageHeader, toast } from '#lib/components/ui';

	let { data, form } = $props();
	let name = $state('');

	$effect(() => {
		const message = form?.message;
		untrack(() => {
			if (message) toast(message, form?.ok ? 'success' : 'error');
			if (form?.ok) name = '';
		});
	});
</script>

<svelte:head><title>Test series · EduSphere staff</title></svelte:head>

<div class="page stack">
	<PageHeader
		title="Test series"
		subtitle="Group related tests into one series. Access and pricing are set once for the whole series."
		crumbs={[{ href: '/admin/tests', label: 'Tests' }]}
	/>

	<form
		method="POST"
		action="?/create"
		class="card card-pad stack"
		use:enhance={() => async ({ result, update }) => {
			if (result.type === 'failure') {
				toast(String(result.data?.message ?? 'Could not create the series.'), 'error');
				return;
			}
			await update({ reset: false });
		}}
	>
		<div class="field">
			<label class="label" for="set-name">Series name</label>
			<input id="set-name" class="input" name="name" maxlength="120" bind:value={name} placeholder="SSC CGL 2026 full mocks" required />
		</div>
		<div><button class="btn btn-primary"><Plus class="size-4" />Create series</button></div>
	</form>

	{#if data.sets.length}
		<ul class="stack-sm">
			{#each data.sets as s (s.id)}
				<li class="card card-pad flex items-center justify-between gap-3">
					<span class="flex items-center gap-3">
						<span class="mark"><Layers class="size-4" /></span>
						<span>
							<a class="font-semibold hover:underline" href="/admin/tests/sets/{s.id}">{s.name}</a>
							<span class="block small muted">{s.testCount} {s.testCount === 1 ? 'test' : 'tests'} · {s.access === 'paid' ? `₹${s.priceInr ?? 0}` : s.access}</span>
						</span>
					</span>
					<a class="btn btn-secondary btn-sm" href="/admin/tests/sets/{s.id}">Open</a>
				</li>
			{/each}
		</ul>
	{:else}
		<EmptyState icon={Layers} title="No test series yet" body="Create a series, then add tests to it from the New test screen." />
	{/if}
</div>

<style>
	.mark { display: grid; place-items: center; width: 2.2rem; height: 2.2rem; border-radius: .65rem; background: hsl(var(--accent)); color: hsl(var(--accent-foreground)); flex-shrink: 0; }
</style>
