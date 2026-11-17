<script lang="ts">
	// Blocks copy, print, right-click, and tries to blank the page on PrintScreen.
	// Android FLAG_SECURE blocks real screenshots in the APK. Desktop OS captures can still win the race.
	import { onMount } from 'svelte';
	import { installCaptureGuard } from '#lib/features/security/guard';

	type Native = { setSecure?: (on: boolean) => void };
	const native = () => (window as Window & { UciChrome?: Native }).UciChrome;

	function formField(e: Event) {
		const el = e.target;
		return el instanceof Element && !!el.closest('input, textarea, select, [contenteditable="true"]');
	}

	function block(e: Event) {
		if (formField(e)) return;
		e.preventDefault();
	}

	onMount(() => {
		try {
			native()?.setSecure?.(true);
		} catch {
			/* browser */
		}
		document.body.classList.add('exam-lock');

		let hide: ReturnType<typeof setTimeout> | undefined;
		const blank = () => {
			document.documentElement.classList.add('exam-lock-blank');
			void document.documentElement.offsetHeight;
			clearTimeout(hide);
			hide = setTimeout(() => document.documentElement.classList.remove('exam-lock-blank'), 2500);
			void navigator.clipboard?.writeText('').catch(() => {});
		};
		const shot = (e: KeyboardEvent) => {
			const print = e.key === 'PrintScreen' || e.code === 'PrintScreen';
			const snip = e.shiftKey && (e.metaKey || e.key === 'Meta') && (e.key === 's' || e.key === 'S' || e.code === 'KeyS');
			const printDlg = (e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P');
			if (!print && !snip && !printDlg) return;
			e.preventDefault();
			e.stopImmediatePropagation();
			blank();
		};
		window.addEventListener('keydown', shot, true);
		window.addEventListener('keyup', shot, true);
		const stopCapture = installCaptureGuard(blank);
		return () => {
			clearTimeout(hide);
			stopCapture();
			document.documentElement.classList.remove('exam-lock-blank');
			window.removeEventListener('keydown', shot, true);
			window.removeEventListener('keyup', shot, true);
		};
	});
</script>

<svelte:window oncopy={block} oncut={block} oncontextmenu={block} ondragstart={block} />
