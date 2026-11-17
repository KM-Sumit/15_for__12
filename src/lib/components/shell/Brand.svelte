<script lang="ts">
	interface Props {
		href?: string;
		/** App bar: mark + short name only. */
		compact?: boolean;
		/** Small label under the name, e.g. an institute name. */
		area?: string;
		name?: string;
		logoSrc?: string | null;
	}
	let { href = '/', compact = false, area, name = 'EduSphere', logoSrc = null }: Props = $props();
	const short = $derived(name.trim().split(/\s+/).slice(0, 1).join(' '));
</script>

<a {href} class="brand" aria-label="{name} home">
	{#if logoSrc}
		<img src={logoSrc} alt="" class="brand-mark" width="32" height="32" />
	{:else}
		<span class="brand-mark brand-fallback" aria-hidden="true">{short.slice(0, 1).toUpperCase()}</span>
	{/if}
	<span class="brand-name">
		<span>{compact ? short : name}</span>
		{#if !compact && area}<small>{area}</small>{/if}
	</span>
</a>
