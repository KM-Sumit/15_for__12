package com.uci.examprep;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * OTA (Over-The-Air) update checker — Play Protect safe version.
 *
 * No REQUEST_INSTALL_PACKAGES permission needed.
 * On update: opens the browser/Chrome to the download URL.
 * Android handles the download and install prompt natively.
 *
 * Developer workflow for each release:
 *   1. Make Android code changes.
 *   2. Bump versionCode + versionName in android/app/build.gradle.
 *   3. Build:  cd android && ./gradlew assembleRelease
 *   4. Copy output APK → static/uci.apk  (deployed at ucisarthi.in/uci.apk)
 *   5. Update VERSION_CODE + VERSION_NAME in src/routes/api/version/+server.ts
 *   6. Deploy server → users see update dialog on next app open.
 */
public class Updater {

    private static final String VERSION_URL = "https://ucisarthi.in/api/version";

    /** Call this from MainActivity.onCreate — runs network check in background thread. */
    public static void check(Activity activity) {
        new Thread(() -> {
            try {
                HttpURLConnection conn = (HttpURLConnection) new URL(VERSION_URL).openConnection();
                conn.setConnectTimeout(6000);
                conn.setReadTimeout(6000);
                conn.setRequestMethod("GET");

                if (conn.getResponseCode() != 200) {
                    conn.disconnect();
                    return;
                }

                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) sb.append(line);
                reader.close();
                conn.disconnect();

                JSONObject json     = new JSONObject(sb.toString());
                int    serverCode   = json.getInt("versionCode");
                String serverName   = json.optString("versionName", "");
                String dlUrl        = json.optString("downloadUrl", "https://ucisarthi.in/uci.apk");
                boolean force       = json.optBoolean("forceUpdate", false);
                String  notes       = json.optString("whatsNew", "");

                // No update needed
                if (serverCode <= BuildConfig.VERSION_CODE) return;

                activity.runOnUiThread(() -> showDialog(activity, serverName, dlUrl, force, notes));

            } catch (Exception ignored) {
                // Network error / server down — silently skip, don't crash.
            }
        }).start();
    }

    private static void showDialog(Activity activity, String ver, String dlUrl,
                                   boolean force, String notes) {
        if (activity.isFinishing() || activity.isDestroyed()) return;

        String msg = "Version " + ver + " available hai.";
        if (!notes.isEmpty()) msg += "\n\n" + notes;

        AlertDialog.Builder b = new AlertDialog.Builder(activity);
        b.setTitle("🎉 Nayi Update!")
         .setMessage(msg)
         .setPositiveButton("Download karo", (d, w) -> openBrowser(activity, dlUrl))
         .setCancelable(!force);

        if (!force) b.setNegativeButton("Baad mein", null);

        b.show();
    }

    /** Opens Chrome/browser to download the APK — no install permission needed. */
    private static void openBrowser(Activity activity, String url) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity.startActivity(intent);
        } catch (Exception ignored) {}
    }
}
