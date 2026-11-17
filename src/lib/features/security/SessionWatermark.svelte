<script lang="ts">
	// Laptop/desktop: a moving, user-specific mark so a leaked screenshot still names the student.
	let { text }: { text: string } = $props();
	const tiles = [0, 1, 2, 3, 4, 5, 6, 7];
</script>

{#if text}
	<div class="wm" aria-hidden="true">
		{#each tiles as i (i)}
			<span style="--i: {i}">{text}</span>
		{/each}
	</div>
{/if}

<style>
	.wm {
		position: fixed;
		inset: 0;
		z-index: 9998;
		overflow: hidden;
		pointer-events: none;
	}
	span {
		position: absolute;
		left: -8%;
		top: calc(6% + var(--i) * 12%);
		white-space: nowrap;
		font-size: clamp(0.7rem, 1.6vw, 0.95rem);
		font-weight: 700;
		letter-spacing: 0.03em;
		opacity: 0.14;
		mix-blend-mode: difference;
		transform: rotate(-16deg);
		animation: drift 22s linear infinite;
		animation-delay: calc(var(--i) * -2.6s);
	}
	@keyframes drift {
		from {
			translate: 0 0;
		}
		to {
			translate: 22% 14%;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		span {
			animation: none;
		}
	}
</style>
