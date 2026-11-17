package com.uci.examprep;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowInsetsController;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
	static final String HOME = "https://ucisarthi.in/login";
	private static final int FILE_CHOOSER = 1001;
	private static final int NOTIFY_PERM = 1002;

	private WebView webView;
	private View splash;
	private ValueCallback<Uri[]> fileCallback;

	@SuppressLint("SetJavaScriptEnabled")
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		applySecure(true);
		setContentView(R.layout.activity_main);

		webView = findViewById(R.id.web);
		splash = findViewById(R.id.splash);
		webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
		webView.addJavascriptInterface(new ChromeBridge(), "UciChrome");
		int night = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
		applyBars(night == Configuration.UI_MODE_NIGHT_YES);

		WebSettings settings = webView.getSettings();
		settings.setJavaScriptEnabled(true);
		settings.setDomStorageEnabled(true);
		settings.setDatabaseEnabled(true);
		// Honor width=device-width, then stay at 100%. Overview mode zooms the page out to "fit", which is the web feel.
		settings.setUseWideViewPort(true);
		settings.setLoadWithOverviewMode(false);
		settings.setTextZoom(100);
		settings.setSupportZoom(false);
		settings.setBuiltInZoomControls(false);
		settings.setDisplayZoomControls(false);
		webView.setInitialScale(100);
		settings.setMediaPlaybackRequiresUserGesture(false);
		settings.setJavaScriptCanOpenWindowsAutomatically(false);
		settings.setSupportMultipleWindows(false);
		settings.setCacheMode(WebSettings.LOAD_DEFAULT);
		settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) settings.setOffscreenPreRaster(true);
		settings.setUserAgentString(settings.getUserAgentString().replace("; wv", ""));
		webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

		CookieManager cookies = CookieManager.getInstance();
		cookies.setAcceptCookie(true);
		cookies.setAcceptThirdPartyCookies(webView, true);

		webView.setWebViewClient(new WebViewClient() {
			@Override
			public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
				return handleUri(request.getUrl());
			}

			@Override
			@SuppressWarnings("deprecation")
			public boolean shouldOverrideUrlLoading(WebView view, String url) {
				return handleUri(Uri.parse(url));
			}

			@Override
			public void onPageFinished(WebView view, String url) {
				hideSplash();
				applySecure(true);
				view.evaluateJavascript(
					"(function(){return document.documentElement.classList.contains('dark')?'1':'0'})()",
					value -> applyBars(value != null && value.contains("1")));
			}

			@Override
			public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
				if (request.isForMainFrame()) {
					hideSplash();
					view.loadDataWithBaseURL(HOME, errorHtml(), "text/html", "utf-8", null);
				}
			}
		});

		webView.setWebChromeClient(new WebChromeClient() {
			@Override
			public void onProgressChanged(WebView view, int newProgress) {
				if (newProgress >= 80) hideSplash();
			}

			@Override
			public boolean onShowFileChooser(
				WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
				if (fileCallback != null) fileCallback.onReceiveValue(null);
				fileCallback = callback;
				try {
					startActivityForResult(params.createIntent(), FILE_CHOOSER);
					return true;
				} catch (ActivityNotFoundException e) {
					fileCallback = null;
					return false;
				}
			}
		});

		webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
			try {
				startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
			} catch (ActivityNotFoundException ignored) {
			}
		});

		if (savedInstanceState != null) {
			webView.restoreState(savedInstanceState);
			hideSplash();
		} else {
			webView.loadUrl(startUrl(getIntent()));
		}
		askNotify();
		Updater.check(this); // OTA: check for new APK on every launch
	}

	private String startUrl(Intent intent) {
		if (intent == null) return HOME;
		String extra = intent.getStringExtra(Notify.EXTRA_URL);
		if (extra != null && extra.startsWith("https://")) return extra;
		Uri data = intent.getData();
		return data != null ? data.toString() : HOME;
	}

	private boolean hasNotifyPermission() {
		if (Build.VERSION.SDK_INT < 33) return true;
		return checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
	}

	private void askNotify() {
		Notify.ensureChannel(this);
		if (!Notify.enabled(this)) return;
		if (Build.VERSION.SDK_INT >= 33 && !hasNotifyPermission()) {
			requestPermissions(new String[] { android.Manifest.permission.POST_NOTIFICATIONS }, NOTIFY_PERM);
			return;
		}
		InboxWorker.schedule(this);
	}

	@Override
	public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
		super.onRequestPermissionsResult(requestCode, permissions, grantResults);
		if (requestCode != NOTIFY_PERM) return;
		if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) InboxWorker.schedule(this);
		else Notify.setEnabled(this, false);
	}

	private final class ChromeBridge {
		@JavascriptInterface
		public void setDark(boolean dark) {
			runOnUiThread(() -> applyBars(dark));
		}

		@JavascriptInterface
		public boolean notificationsSupported() {
			return true;
		}

		@JavascriptInterface
		public boolean notificationsOn() {
			return Notify.enabled(MainActivity.this) && hasNotifyPermission();
		}

		@JavascriptInterface
		public void setNotifications(boolean on) {
			runOnUiThread(() -> {
				Notify.setEnabled(MainActivity.this, on);
				if (on) askNotify();
			});
		}

		@JavascriptInterface
		public void setSecure(boolean on) {
			runOnUiThread(() -> applySecure(on));
		}
	}

	/** FLAG_SECURE blocks screenshots and recents. Clearing it from JS is ignored. */
	private void applySecure(boolean on) {
		if (!on) return;
		SecureDisplay.lock(this);
	}

	/** Status/nav bars follow the page theme so a light system bar never shows as a white line. */
	private void applyBars(boolean dark) {
		int color = Color.parseColor(dark ? "#0f1218" : "#f4f6f8");
		Window w = getWindow();
		w.setStatusBarColor(color);
		w.setNavigationBarColor(color);
		w.setBackgroundDrawable(new ColorDrawable(color));
		if (webView != null) webView.setBackgroundColor(color);
		View root = findViewById(android.R.id.content);
		if (root != null) root.setBackgroundColor(color);
		if (Build.VERSION.SDK_INT >= 30) {
			WindowInsetsController c = w.getInsetsController();
			if (c != null) {
				int light = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
					| WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
				c.setSystemBarsAppearance(dark ? 0 : light, light);
			}
		} else {
			View decor = w.getDecorView();
			int flags = decor.getSystemUiVisibility();
			if (Build.VERSION.SDK_INT >= 23) {
				if (dark) flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
				else flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
			}
			if (Build.VERSION.SDK_INT >= 26) {
				if (dark) flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
				else flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
			}
			decor.setSystemUiVisibility(flags);
		}
	}

	private void hideSplash() {
		if (splash != null && splash.getVisibility() == View.VISIBLE) {
			splash.animate().alpha(0f).setDuration(180).withEndAction(() -> splash.setVisibility(View.GONE));
		}
	}

	private boolean handleUri(Uri uri) {
		if (uri == null) return true;
		String scheme = uri.getScheme() == null ? "" : uri.getScheme();
		String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
		if ("https".equals(scheme) || "http".equals(scheme)) {
			if (hostOk(host, "ucisarthi.in")
				|| hostOk(host, "accounts.google.com")
				|| hostOk(host, "accounts.youtube.com")
				|| hostOk(host, "google.com")
				|| hostOk(host, "gstatic.com")
				|| hostOk(host, "googleapis.com")
				|| hostOk(host, "razorpay.com")
				|| hostOk(host, "youtube.com")
				|| hostOk(host, "youtube-nocookie.com")
				|| hostOk(host, "ytimg.com")) {
				return false;
			}
		}
		try {
			startActivity(new Intent(Intent.ACTION_VIEW, uri));
		} catch (ActivityNotFoundException ignored) {
		}
		return true;
	}

	/** Exact domain or a subdomain. `endsWith("ucisarthi.in")` would also allow notucisarthi.in. */
	private static boolean hostOk(String host, String domain) {
		return host.equals(domain) || host.endsWith("." + domain);
	}

	private String errorHtml() {
		return "<!doctype html><html><head><meta name=viewport content='width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no'>"
			+ "<style>body{font-family:sans-serif;background:#f4f6f8;color:#0f1218;display:flex;"
			+ "min-height:100vh;align-items:center;justify-content:center;margin:0;padding:24px;text-align:center}"
			+ "a{color:#0f1218;font-weight:700}</style></head><body>"
			+ "<div><p>UCI could not reach the server.</p>"
			+ "<p><a href='" + HOME + "'>Try again</a></p></div></body></html>";
	}

	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		super.onActivityResult(requestCode, resultCode, data);
		if (requestCode != FILE_CHOOSER || fileCallback == null) return;
		Uri[] result = resultCode == RESULT_OK && data != null
			? WebChromeClient.FileChooserParams.parseResult(resultCode, data)
			: null;
		fileCallback.onReceiveValue(result);
		fileCallback = null;
	}

	@Override
	protected void onSaveInstanceState(Bundle outState) {
		super.onSaveInstanceState(outState);
		if (webView != null) webView.saveState(outState);
	}

	@Override
	public void onBackPressed() {
		if (webView != null && webView.canGoBack()) {
			webView.goBack();
			return;
		}
		super.onBackPressed();
	}

	@Override
	protected void onNewIntent(Intent intent) {
		super.onNewIntent(intent);
		setIntent(intent);
		if (webView != null) webView.loadUrl(startUrl(intent));
	}

	@Override
	protected void onPause() {
		if (webView != null) webView.onPause();
		CookieManager.getInstance().flush();
		super.onPause();
	}

	@Override
	protected void onResume() {
		super.onResume();
		applySecure(true);
		if (webView != null) webView.onResume();
		if (Notify.enabled(this) && hasNotifyPermission()) {
			InboxWorker.kick(this);
			// Re-register FCM token in case it was refreshed or user just logged in.
			FcmService.ensureRegistered(this);
		}
	}

	@Override
	public void onWindowFocusChanged(boolean hasFocus) {
		super.onWindowFocusChanged(hasFocus);
		if (hasFocus) applySecure(true);
	}

	@Override
	protected void onDestroy() {
		if (webView != null) {
			((ViewGroup) webView.getParent()).removeView(webView);
			webView.destroy();
			webView = null;
		}
		super.onDestroy();
	}
}
