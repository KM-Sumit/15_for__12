/** Screen-capture guards that a website can actually apply (OS recorders can still win). */

/** Stop this page from starting a screen share, exit PiP, and blank when a capture is reported. */
export function installCaptureGuard(onCapture: () => void): () => void {
	const md = navigator.mediaDevices;
	const proto = typeof MediaDevices !== 'undefined' ? MediaDevices.prototype : null;
	const original = proto?.getDisplayMedia;
	if (proto && original) {
		proto.getDisplayMedia = function () {
			onCapture();
			return Promise.reject(new DOMException('Screen capture is not allowed on this site.', 'NotAllowedError'));
		};
	}
	try {
		const cfg = md as Navigator['mediaDevices'] & { setCaptureHandleConfig?: (o: object) => void };
		cfg.setCaptureHandleConfig?.({ handle: 'ucisarthi', exposeOrigin: true, permittedOrigins: ['*'] });
	} catch {
		/* unsupported */
	}

	const onPip = (e: Event) => {
		e.preventDefault();
		onCapture();
		void document.exitPictureInPicture?.();
	};
	document.addEventListener('enterpictureinpicture', onPip, true);

	return () => {
		if (proto && original) proto.getDisplayMedia = original;
		document.removeEventListener('enterpictureinpicture', onPip, true);
	};
}