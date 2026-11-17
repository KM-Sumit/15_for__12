<script lang="ts">
	// Overlay for video chrome. PDF pages are also stamped onto the canvas pixels.
	import { getWatermark } from './context';

	let { tone = 'light' }: { tone?: 'light' | 'dark' } = $props();
	const ctx = getWatermark();
	const label = $derived(ctx.text || 'EduSphere');
</script>

{#if label}
	<div class={['wm', { dark: tone === 'dark' }]} aria-hidden="true">
		{#each [0, 1, 2, 3, 4] as i (i)}
			<span style="--i: {i}">{label}</span>
		{/each}
	</div>
{/if}

<style>
	.wm {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		z-index: 3;
	}
	span {
		position: absolute;
		left: -10%;
		top: calc(12% + var(--i) * 16%);
		white-space: nowrap;
		font-size: clamp(0.7rem, 2vw, 0.95rem);
		font-weight: 700;
		letter-spacing: 0.04em;
		color: #fff;
		opacity: 0.22;
		text-shadow: 0 1px 2px rgb(0 0 0 / 0.45);
		transform: rotate(-18deg);
		animation: drift 16s linear infinite;
		animation-delay: calc(var(--i) * -2.4s);
	}
	.wm.dark span {
		color: #111;
		opacity: 0.16;
		text-shadow: none;
	}
	@keyframes drift {
		from {
			translate: 0 0;
		}
		to {
			translate: 18% 10%;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		span {
			animation: none;
		}
	}
</style>
