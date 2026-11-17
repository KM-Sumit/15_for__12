import { error } from '@sveltejs/kit';
import { openFile, paidRefs } from '#lib/features/files/server/service';
import { courseAccess, noteAccess } from '#lib/features/billing/server/paywall';
import { SIGNED_TTL_SEC } from '#lib/features/files/server/r2';
import { requireUser, toHttp } from '#lib/server/http';
import type { RequestHandler } from './$types';

/** Serve file bytes directly (never redirect to R2).
 *  A 302 to R2's cross-origin URL causes CORS failures in mobile WebViews and pdfjs,
 *  because R2 doesn't emit CORS headers by default. Proxying here keeps everything same-origin. */
export const GET: RequestHandler = async (event) => {
	let res: Awaited<ReturnType<typeof openFile>>;
	try {
		res = await openFile(event.params.id);
	} catch (e) {
		toHttp(e);
	}
	if (!res.public) {
		const user = requireUser(event);
		// A paid note's PDF or a paid lesson's file only goes to people who unlocked it (staff pass inside the checks).
		const refs = await paidRefs(event.params.id);
		if (refs.noteIds.length || refs.courseIds.length) {
			const checks = [...refs.noteIds.map((id) => noteAccess(user.id, id)), ...refs.courseIds.map((id) => courseAccess(user.id, id))];
			if (!(await Promise.all(checks)).some(Boolean)) error(403, 'Unlock this course or pass to open the file.');
		}
	}
	const cache = res.public ? `public, max-age=${SIGNED_TTL_SEC - 60}` : 'private, no-store';

	// Resolve bytes: local disk has them directly; R2 path fetches from the signed URL server-side.
	let bytes: Uint8Array;
	if (res.bytes) {
		bytes = res.bytes;
	} else if (res.url) {
		const r2 = await fetch(res.url);
		if (!r2.ok) error(502, 'Could not load file from storage.');
		bytes = new Uint8Array(await r2.arrayBuffer());
	} else {
		error(500, 'File has no storage location.');
	}

	const total = bytes.byteLength;
	const headers: Record<string, string> = {
		'content-type': res.mime,
		'accept-ranges': 'bytes',
		'cache-control': cache,
		'content-disposition': 'inline'
	};

	const range = event.request.headers.get('range');
	const match = range && /^bytes=(\d+)-(\d*)$/.exec(range);
	if (match) {
		const start = Number(match[1]);
		const end = match[2] ? Math.min(Number(match[2]), total - 1) : total - 1;
		if (start > end || start >= total) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${total}` } });
		const slice = new Uint8Array(bytes.subarray(start, end + 1));
		return new Response(slice, {
			status: 206,
			headers: { ...headers, 'content-range': `bytes ${start}-${end}/${total}`, 'content-length': String(slice.byteLength) }
		});
	}
	return new Response(new Uint8Array(bytes), { headers: { ...headers, 'content-length': String(total) } });
};
