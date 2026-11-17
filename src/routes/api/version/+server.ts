import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Public endpoint — no auth needed.
 * Android app checks this on every launch to detect if a newer APK is available.
 *
 * To release a new version:
 *   1. Build new APK  →  android/uci.apk
 *   2. Upload APK somewhere publicly accessible (e.g. GitHub Releases, R2, or this server's /static/)
 *   3. Bump versionCode + versionName in android/app/build.gradle
 *   4. Update VERSION_CODE and DOWNLOAD_URL below
 *   5. Deploy server  →  app will prompt users to update on next open
 */

// ⬇️  Sirf yeh 3 lines update karo har release pe
const VERSION_CODE = 11;                  // android/app/build.gradle ka versionCode
const VERSION_NAME = '1.4.1';            // human-readable (shown to user)
const DOWNLOAD_URL = 'https://ucisarthi.in/uci.apk'; // APK ka public URL

export const GET: RequestHandler = () => {
	return json({
		versionCode: VERSION_CODE,
		versionName: VERSION_NAME,
		downloadUrl: DOWNLOAD_URL,
		// Optional: force update — user cannot dismiss dialog
		forceUpdate: false,
		// Release notes shown in update dialog
		whatsNew: 'Bug fixes and performance improvements.'
	});
};
