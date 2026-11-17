package com.uci.examprep;

import android.app.Activity;
import android.os.Build;
import android.view.WindowManager;

/** FLAG_SECURE is the real screenshot block. Android has no “disable screenshot” permission. */
final class SecureDisplay {
	private SecureDisplay() {}

	static void lock(Activity activity) {
		if (!BuildConfig.PREVENT_SCREENSHOTS) return;
		activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
		if (Build.VERSION.SDK_INT >= 33) activity.setRecentsScreenshotEnabled(false);
	}
}