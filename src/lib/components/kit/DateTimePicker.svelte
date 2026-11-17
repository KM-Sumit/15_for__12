<script lang="ts" module>
	// India Standard Time is UTC+05:30 all year (no DST), so plain offset math is exact.
	import { formatIstTime } from './ist';
	const IST = 330 * 60_000;
	const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

	type Parts = { y: number; m: number; d: number; hh: number; mm: number };
	export function istParts(iso: string): Parts {
		const t = new Date(Date.parse(iso) + IST);
		return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate(), hh: t.getUTCHours(), mm: t.getUTCMinutes() };
	}
	export const istIso = (p: Parts) => new Date(Date.UTC(p.y, p.m, p.d, p.hh, p.mm) - IST).toISOString();
	const dayKey = (y: number, m: number, d: number) => y * 10_000 + m * 100 + d;
	/** "Tue 21 Oct, 10:00 AM IST" (same output on server and client). */
	export function formatIst(iso: string): string {
		const p = istParts(iso);
		const wd = DAYS[new Date(Date.UTC(p.y, p.m, p.d)).getUTCDay()];
		return `${wd} ${p.d} ${MONTHS[p.m]}, ${formatIstTime(p.hh, p.mm)} IST`;
	}
</script>

<script lang="ts">
	// Date picker in IST plus a typed clock time (staff type 10:30 AM / 14:00). Popover on desktop, bottom
	// sheet on phones. Value is a UTC ISO string; the hidden input `name` carries it for form actions.
	import { CalendarClock, ChevronLeft, ChevronRight } from '@lucide/svelte';
	import Dropdown from './Dropdown.svelte';
	import { parseIstTime } from './ist';

	interface Props {
		value: string | null;
		name?: string;
		/** Earliest allowed moment (ISO). Earlier days are disabled. */
		min?: string;
		label?: string;
		id?: string;
	}
	let { value = $bindable(null), name, min, label = 'Date and time', id }: Props = $props();

	let open = $state(false);
	let trigger = $state<HTMLButtonElement>();
	let view = $state({ y: 2026, m: 0 });
	let focusKey = $state(0);
	let grid = $state<HTMLDivElement>();
	let timeEl = $state<HTMLInputElement>();
	let timeText = $state('');
	let timeError = $state('');
	const uid = $props.id();

	const cur = $derived(value ? istParts(value) : null);
	const minP = $derived(min ? istParts(min) : null);
	const minKey = $derived(minP ? dayKey(minP.y, minP.m, minP.d) : 0);

	function show() {
		const p = cur ?? (min ? istParts(min) : istParts(new Date().toISOString()));
		view = { y: p.y, m: p.m };
		focusKey = dayKey(p.y, p.m, p.d);
		timeText = formatIstTime(p.hh, p.mm);
		timeError = '';
		open = true;
		setTimeout(() => grid?.querySelector<HTMLElement>('[tabindex="0"]')?.focus({ preventScroll: true }), 50);
	}

	const cells = $derived.by(() => {
		const first = new Date(Date.UTC(view.y, view.m, 1));
		const lead = (first.getUTCDay() + 6) % 7; // Monday first
		return Array.from({ length: 42 }, (_, i) => {
			const d = new Date(Date.UTC(view.y, view.m, 1 - lead + i));
			const y = d.getUTCFullYear(), m = d.getUTCMonth(), day = d.getUTCDate();
			return { y, m, d: day, key: dayKey(y, m, day), out: m !== view.m };
		});
	});
	const todayKey = $derived.by(() => {
		const p = istParts(new Date().toISOString());
		return dayKey(p.y, p.m, p.d);
	});
	function stepMonth(n: number) {
		const d = new Date(Date.UTC(view.y, view.m + n, 1));
		view = { y: d.getUTCFullYear(), m: d.getUTCMonth() };
	}

	function set(p: Parts) {
		let iso = istIso(p);
		if (min && Date.parse(iso) < Date.parse(min)) iso = min;
		value = iso;
		const got = istParts(iso);
		timeText = formatIstTime(got.hh, got.mm);
		timeError = '';
	}

	function typedClock() {
		return parseIstTime(timeText) ?? (cur ? { hh: cur.hh, mm: cur.mm } : { hh: 10, mm: 0 });
	}

	function pickDay(c: { y: number; m: number; d: number; key: number }) {
		if (c.key < minKey) return;
		const t = typedClock();
		set({ y: c.y, m: c.m, d: c.d, hh: t.hh, mm: t.mm });
		focusKey = c.key;
		if (c.m !== view.m) view = { y: c.y, m: c.m };
		requestAnimationFrame(() => timeEl?.focus());
	}

	function applyTime(close = false) {
		const t = parseIstTime(timeText);
		if (!t) {
			if (cur) timeText = formatIstTime(cur.hh, cur.mm);
			else timeError = 'Type a time like 10:30 AM or 14:00.';
			return false;
		}
		const base = cur ?? (minP ? { ...minP } : istParts(new Date().toISOString()));
		set({ ...base, hh: t.hh, mm: t.mm });
		if (close) {
			open = false;
			trigger?.focus({ preventScroll: true });
		}
		return true;
	}

	function onTimeKey(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			applyTime(true);
		}
	}

	function gridKey(e: KeyboardEvent) {
		const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
		const c = cells.find((x) => x.key === focusKey);
		if (!c) return;
		if (e.key in moves) {
			e.preventDefault();
			const d = new Date(Date.UTC(c.y, c.m, c.d + moves[e.key]));
			focusKey = dayKey(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
			if (d.getUTCMonth() !== view.m) view = { y: d.getUTCFullYear(), m: d.getUTCMonth() };
			requestAnimationFrame(() => grid?.querySelector<HTMLElement>('[tabindex="0"]')?.focus());
		} else if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			pickDay(c);
		}
	}
</script>

{#if name}<input type="hidden" {name} value={value ?? ''} />{/if}
<button
	bind:this={trigger}
	{id}
	type="button"
	class="input kit-dt"
	class:is-open={open}
	aria-haspopup="dialog"
	aria-expanded={open}
	aria-label="{label}: {value ? formatIst(value) : 'not set'}"
	onclick={show}
>
	<CalendarClock aria-hidden="true" />
	<span class="kit-dt-value" class:is-placeholder={!value}>{value ? formatIst(value) : 'Pick date and time'}</span>
</button>

<Dropdown bind:open anchor={trigger} title={label} width={360}>
	<div class="kit-dt-pop">
		<div class="kit-cal">
			<div class="kit-cal-head">
				<button type="button" class="icon-btn icon-btn-sm" aria-label="Previous month" onclick={() => stepMonth(-1)}><ChevronLeft /></button>
				<p class="kit-cal-title" aria-live="polite">{MONTHS_LONG[view.m]} {view.y}</p>
				<button type="button" class="icon-btn icon-btn-sm" aria-label="Next month" onclick={() => stepMonth(1)}><ChevronRight /></button>
			</div>
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions (arrow keys move between day buttons) -->
			<div class="kit-cal-grid" role="group" aria-label="{MONTHS_LONG[view.m]} {view.y}" bind:this={grid} onkeydown={gridKey}>
				{#each ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as w, i (i)}<span class="kit-cal-wd" aria-hidden="true">{w}</span>{/each}
				{#each cells as c (c.key)}
					<button
						type="button"
						class="kit-day"
						class:is-out={c.out}
						class:is-today={c.key === todayKey}
						aria-pressed={cur ? c.key === dayKey(cur.y, cur.m, cur.d) : false}
						aria-label="{c.d} {MONTHS_LONG[c.m]} {c.y}"
						disabled={c.key < minKey}
						tabindex={c.key === focusKey ? 0 : -1}
						onclick={() => pickDay(c)}
					>
						{c.d}
					</button>
				{/each}
			</div>
		</div>
		<div class="kit-times">
			<label class="kit-times-title" for="{uid}-time">Time (IST)</label>
			<input
				bind:this={timeEl}
				id="{uid}-time"
				class="input kit-time-input"
				type="text"
				inputmode="text"
				autocomplete="off"
				placeholder="e.g. 10:30 AM"
				aria-invalid={timeError ? 'true' : undefined}
				bind:value={timeText}
				onblur={() => applyTime()}
				onkeydown={onTimeKey}
			/>
			<p class={['kit-times-help', { 'is-err': !!timeError }]}>{timeError || 'Type the time, like 10:30 AM or 14:00.'}</p>
			<button type="button" class="btn btn-primary kit-time-done" onclick={() => applyTime(true)}>Done</button>
		</div>
	</div>
</Dropdown>

<style>
	.kit-dt {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		text-align: left;
		cursor: pointer;
	}
	.kit-dt.is-open {
		border-color: hsl(var(--ring));
		box-shadow: 0 0 0 3px hsl(var(--ring) / 0.18);
	}
	.kit-dt :global(svg) {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
		color: hsl(var(--muted-foreground));
	}
	.kit-dt-value {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}
	.is-placeholder {
		color: hsl(var(--muted-foreground) / 0.8);
	}
	.kit-dt-pop {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.25rem;
	}
	.kit-cal {
		flex: 1;
		min-width: 0;
	}
	.kit-cal-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.25rem;
	}
	.kit-cal-title {
		font-weight: 700;
		font-size: 0.9375rem;
	}
	.kit-cal-grid {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 2px;
		outline: none;
	}
	.kit-cal-wd {
		display: grid;
		place-items: center;
		height: 28px;
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
	}
	.kit-day {
		height: 44px;
		border-radius: 10px;
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
		transition: background-color 0.12s;
	}
	@media (min-width: 768px) and (pointer: fine) {
		.kit-day {
			height: 38px;
		}
	}
	.kit-day:hover:not(:disabled) {
		background: hsl(var(--muted));
	}
	.kit-day:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: -2px;
	}
	.kit-day.is-out {
		color: hsl(var(--muted-foreground) / 0.7);
	}
	.kit-day.is-today {
		font-weight: 700;
		box-shadow: inset 0 0 0 1px hsl(var(--border));
	}
	.kit-day[aria-pressed='true'] {
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		font-weight: 700;
	}
	.kit-day:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
	.kit-times {
		display: grid;
		gap: 0.375rem;
		min-width: 0;
		padding-top: 0.25rem;
		border-top: 1px solid hsl(var(--border));
	}
	.kit-times-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
	}
	.kit-time-input {
		font-variant-numeric: tabular-nums;
	}
	.kit-times-help {
		margin: 0;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}
	.kit-times-help.is-err {
		color: hsl(var(--danger));
	}
	.kit-time-input[aria-invalid='true'] {
		border-color: hsl(var(--danger));
	}
	.kit-time-done {
		justify-self: start;
		min-height: 44px;
	}
</style>
