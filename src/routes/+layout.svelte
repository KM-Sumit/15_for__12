<script lang="ts">
	import '../app.css';
	import { Toaster } from '#lib/components/ui';
	import UpdatePrompt from '#lib/components/pwa/UpdatePrompt.svelte';
	import OfflineBanner from '#lib/components/pwa/OfflineBanner.svelte';
	import ContentGuard from '#lib/features/security/ContentGuard.svelte';

	let { data, children } = $props();
</script>

<ContentGuard user={data.user}>
	{@render children()}
</ContentGuard>

<Toaster />
<UpdatePrompt />
<OfflineBanner />
