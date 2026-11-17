package com.uci.examprep;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

/** Lock-screen / heads-up alerts, same shape as WhatsApp: high channel, sound, vibrate. */
final class Notify {
	static final String CHANNEL = "uci_alerts";
	static final String EXTRA_URL = "uci_url";
	private static final String PREF = "uci_notify";
	private static final String KEY_ON = "on";
	private static final String KEY_SEEN = "seen";

	private Notify() {}

	static void ensureChannel(Context ctx) {
		if (Build.VERSION.SDK_INT < 26) return;
		NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
		if (nm == null || nm.getNotificationChannel(CHANNEL) != null) return;
		NotificationChannel ch = new NotificationChannel(CHANNEL, "UCI", NotificationManager.IMPORTANCE_HIGH);
		ch.setDescription("Classes, tests and answers");
		ch.enableVibration(true);
		ch.setVibrationPattern(new long[] { 0, 250, 120, 250 });
		ch.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
		ch.setShowBadge(true);
		Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
		ch.setSound(sound, new AudioAttributes.Builder()
			.setUsage(AudioAttributes.USAGE_NOTIFICATION)
			.setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
			.build());
		nm.createNotificationChannel(ch);
	}

	static boolean enabled(Context ctx) {
		return ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE).getBoolean(KEY_ON, true);
	}

	static void setEnabled(Context ctx, boolean on) {
		ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE).edit().putBoolean(KEY_ON, on).apply();
		if (on) InboxWorker.kick(ctx);
		else InboxWorker.cancel(ctx);
	}

	static void show(Context ctx, String id, String title, String body, String path) {
		ensureChannel(ctx);
		String url = path == null || path.isEmpty() ? MainActivity.HOME : path;
		if (url.startsWith("/")) url = "https://ucisarthi.in" + url;
		Intent open = new Intent(ctx, MainActivity.class)
			.setAction(Intent.ACTION_VIEW)
			.setData(Uri.parse(url))
			.putExtra(EXTRA_URL, url)
			.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
		int req = Math.abs(id.hashCode());
		PendingIntent pi = PendingIntent.getActivity(
			ctx,
			req,
			open,
			PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
		);
		android.app.Notification.Builder b;
		if (Build.VERSION.SDK_INT >= 26) b = new android.app.Notification.Builder(ctx, CHANNEL);
		else b = new android.app.Notification.Builder(ctx);
		b.setSmallIcon(R.drawable.ic_stat_uci)
			.setContentTitle(title == null || title.isEmpty() ? "UCI" : title)
			.setContentText(body == null ? "" : body)
			.setStyle(new android.app.Notification.BigTextStyle().bigText(body == null ? "" : body))
			.setContentIntent(pi)
			.setAutoCancel(true)
			.setDefaults(android.app.Notification.DEFAULT_ALL)
			.setPriority(android.app.Notification.PRIORITY_HIGH)
			.setVisibility(android.app.Notification.VISIBILITY_PUBLIC)
			.setColor(Color.parseColor("#E06B1A"));
		NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
		if (nm != null) nm.notify(req, b.build());
	}

	static void ingest(Context ctx, String json) {
		if (!enabled(ctx)) return;
		try {
			JSONArray items = new JSONObject(json).optJSONArray("items");
			if (items == null) return;
			android.content.SharedPreferences p = ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);
			String seenRaw = p.getString(KEY_SEEN, "");
			StringBuilder next = new StringBuilder();
			for (int i = 0; i < items.length(); i++) {
				JSONObject it = items.optJSONObject(i);
				if (it == null) continue;
				String id = it.optString("id", "");
				if (id.isEmpty()) continue;
				if (next.length() > 0) next.append('\n');
				next.append(id);
				if (("\n" + seenRaw + "\n").contains("\n" + id + "\n") || seenRaw.equals(id)) continue;
				show(ctx, id, it.optString("title"), it.optString("body"), it.optString("url"));
			}
			p.edit().putString(KEY_SEEN, next.toString()).apply();
		} catch (Exception ignored) {
		}
	}
}
