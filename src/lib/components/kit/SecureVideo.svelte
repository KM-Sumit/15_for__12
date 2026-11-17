<script lang="ts">
	// Uploaded lesson video: no download, no PiP, no remote playback, dynamic watermark.
	// True Widevine DRM needs packaged keys; these files are ordinary MP4s.
	import MediaWatermark from '#lib/features/security/MediaWatermark.svelte';

	interface Props {
		src: string;
		onprogress?: (sec: number, duration: number) => void;
		onended?: () => void;
	}
	let { src, onprogress, onended }: Props = $props();

	function guard(node: HTMLVideoElement) {
		node.disablePictureInPicture = true;
		node.disableRemotePlayback = true;
		return () => {
			node.pause();
			node.removeAttribute('src');
			node.load();
		};
	}
</script>

<div class="secure">
	<video
		{src}
		{@attach guard}
		controls
		playsinline
		preload="metadata"
		controlslist="nodownload noplaybackrate noremoteplayback"
		disablepictureinpicture
		oncontextmenu={(e) => e.preventDefault()}
		ontimeupdate={(e) => onprogress?.(e.currentTarget.currentTime, e.currentTarget.duration || 0)}
		{onended}
	>
		<track kind="captions" label="Captions" srclang="en" />
	</video>
	<MediaWatermark />
</div>

<style>
	.secure {
		position: relative;
		width: 100%;
	}
	video {
		display: block;
		width: 100%;
		max-height: 70dvh;
		background: #000;
	}
</style>
