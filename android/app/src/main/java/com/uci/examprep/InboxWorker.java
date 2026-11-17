package com.uci.examprep;

import android.content.Context;
import android.webkit.CookieManager;

import androidx.annotation.NonNull;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.OutOfQuotaPolicy;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

/** Pulls unread alerts while the app is closed and posts them to the system tray. */
public class InboxWorker extends Worker {
	private static final String PERIODIC = "uci-inbox";
	private static final String ONCE = "uci-inbox-once";
	private static final String PEEK = "https://ucisarthi.in/api/push/peek";

	public InboxWorker(@NonNull Context context, @NonNull WorkerParameters params) {
		super(context, params);
	}

	@NonNull
	@Override
	public Result doWork() {
		if (!Notify.enabled(getApplicationContext())) return Result.success();
		try {
			CookieManager.getInstance().flush();
			String cookie = CookieManager.getInstance().getCookie("https://ucisarthi.in");
			if (cookie == null || !cookie.contains("uci_session")) return Result.success();
			HttpURLConnection c = (HttpURLConnection) new URL(PEEK).openConnection();
			c.setRequestMethod("GET");
			c.setRequestProperty("Accept", "application/json");
			c.setRequestProperty("Cookie", cookie);
			c.setConnectTimeout(15000);
			c.setReadTimeout(15000);
			int code = c.getResponseCode();
			InputStream in = code >= 200 && code < 300 ? c.getInputStream() : c.getErrorStream();
			String body = read(in);
			c.disconnect();
			if (code >= 200 && code < 300) Notify.ingest(getApplicationContext(), body);
			return Result.success();
		} catch (Exception e) {
			return Result.retry();
		}
	}

	static void schedule(Context ctx) {
		if (!Notify.enabled(ctx)) return;
		Constraints net = new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build();
		// REPLACE (not KEEP) so the 15-min interval restarts whenever the app is re-opened;
		// this prevents a stale job from drifting hours into the future after Doze.
		PeriodicWorkRequest periodic = new PeriodicWorkRequest.Builder(InboxWorker.class, 15, TimeUnit.MINUTES)
			.setConstraints(net)
			.build();
		WorkManager.getInstance(ctx).enqueueUniquePeriodicWork(PERIODIC, ExistingPeriodicWorkPolicy.REPLACE, periodic);
		kick(ctx);
	}

	static void kick(Context ctx) {
		if (!Notify.enabled(ctx)) return;
		// setExpedited() tells Android to run this immediately, even in Doze / battery-saver
		// mode. Without this, WorkManager can delay the one-time check by hours when the app
		// is closed and the phone screen is off.
		OneTimeWorkRequest once = new OneTimeWorkRequest.Builder(InboxWorker.class)
			.setConstraints(new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
			.setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
			.build();
		WorkManager.getInstance(ctx).enqueueUniqueWork(ONCE, ExistingWorkPolicy.REPLACE, once);
	}

	static void cancel(Context ctx) {
		WorkManager wm = WorkManager.getInstance(ctx);
		wm.cancelUniqueWork(PERIODIC);
		wm.cancelUniqueWork(ONCE);
	}

	private static String read(InputStream in) throws Exception {
		if (in == null) return "";
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		byte[] buf = new byte[2048];
		int n;
		while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
		return new String(out.toByteArray(), StandardCharsets.UTF_8);
	}
}
