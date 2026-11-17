<script lang="ts">
	import { page } from '$app/state';
	import AppShell from '#lib/components/shell/AppShell.svelte';
	import { studentGroups, studentTabs } from '#lib/components/shell/nav';
	import PtAutoSubmit from '#lib/features/tests/components/PtAutoSubmit.svelte';

	let { data, children } = $props();
	const examScreen = $derived(/^\/app\/tests\/[^/]+\/attempt\//.test(page.url.pathname) || /^\/onboarding(\/|$)/.test(page.url.pathname));
	const staffPreview = $derived((data.user.role === 'admin' || data.user.role === 'teacher') && !examScreen);
</script>

<PtAutoSubmit attempt={data.pt} serverNow={data.serverNow} />

<AppShell
	groups={studentGroups}
	tabs={studentTabs}
	user={data.user}
	modules={data.modules ?? []}
	instituteName={data.tenant?.instituteName ?? 'EduSphere'}
	unread={data.unread}
	inboxHref="/app/inbox"
	fullScreen={/^\/app\/tests\/[^/]+\/attempt\/|^\/onboarding(\/|$)/}
>
	{#if staffPreview}
		<p class="alert alert-warning mx-4 mt-3 mb-0" role="status">
			You are signed in as {data.user.role === 'admin' ? 'an admin' : 'a teacher'}. This is the student app.
			<a href="/admin" class="font-semibold underline">Open admin</a>
		</p>
	{/if}
	{@render children()}
</AppShell>
