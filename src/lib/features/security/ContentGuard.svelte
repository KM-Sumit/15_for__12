<script lang="ts">
	// Root shield: FLAG_SECURE on Android, capture hide on web, moving watermark when signed in.
	import type { Snippet } from 'svelte';
	import type { SessionUser } from '#lib/features/auth/schema';
	import ExamLock from '#lib/features/tests/components/ExamLock.svelte';
	import SessionWatermark from './SessionWatermark.svelte';
	import { setWatermark } from './context';
	import { mediaMark, sessionMark } from './mark';

	interface Props {
		user: SessionUser | null;
		children: Snippet;
	}
	let { user, children }: Props = $props();
	const mark = $state({ text: 'EduSphere' });
	setWatermark(mark);
	$effect.pre(() => {
		mark.text = mediaMark(user);
	});
</script>

<ExamLock />
{@render children()}
<SessionWatermark text={sessionMark(user)} />
