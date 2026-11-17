package com.uci.examprep;

import android.webkit.CookieManager;

import androidx.annotation.NonNull;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Receives FCM push messages from Firebase — works even when the app is fully closed (killed).
 *
 * Firebase guarantees delivery through its own background connection, so the app does NOT need
 * to be running. Android wakes this service just long enough to show the notification.
 *
 * Flow:
 *   Admin sends notification (server) → pushTo() → FCM API → Firebase cloud → this service →
 *   Notify.show() → Android system tray, even on lock screen.
 */
public class FcmService extends FirebaseMessagingService {

    private static final String REGISTER_URL = "https://ucisarthi.in/api/push/fcm";

    /** Called every time the app gets a NEW FCM token (first install, reinstall, data-clear). */
    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        // Save locally so the app can re-register after a login.
        getSharedPreferences("uci_notify", MODE_PRIVATE).edit().putString("fcm_token", token).apply();
        // Try to register with our server right now (best-effort; InboxWorker retries on open).
        registerToken(token);
    }

    /**
     * Called for DATA messages (or notification messages while app is in foreground).
     * For pure notification messages delivered when app is BACKGROUND/KILLED, Firebase
     * auto-shows the notification from the `notification` payload — this method is not called.
     *
     * We handle it anyway to show notifications consistently in all states.
     */
    @Override
    public void onMessageReceived(@NonNull RemoteMessage msg) {
        super.onMessageReceived(msg);
        if (!Notify.enabled(this)) return;

        String id    = msg.getMessageId() != null ? msg.getMessageId() : String.valueOf(System.currentTimeMillis());
        String title = "";
        String body  = "";
        String url   = "/app/inbox";

        // Prefer the `notification` block (server always sends it).
        if (msg.getNotification() != null) {
            RemoteMessage.Notification n = msg.getNotification();
            if (n.getTitle() != null) title = n.getTitle();
            if (n.getBody()  != null) body  = n.getBody();
        }
        // Override/supplement with data payload.
        if (msg.getData().containsKey("title") && msg.getData().get("title") != null)
            title = msg.getData().get("title");
        if (msg.getData().containsKey("body") && msg.getData().get("body") != null)
            body = msg.getData().get("body");
        if (msg.getData().containsKey("url") && msg.getData().get("url") != null)
            url = msg.getData().get("url");

        Notify.show(this, id, title, body, url);
    }

    /** POST the FCM token to our server so it can push to this device. */
    private void registerToken(String token) {
        try {
            CookieManager.getInstance().flush();
            String cookie = CookieManager.getInstance().getCookie("https://ucisarthi.in");
            if (cookie == null || !cookie.contains("uci_session")) return; // not logged in yet
            byte[] payload = ("{\"token\":\"" + token + "\"}").getBytes(StandardCharsets.UTF_8);
            HttpURLConnection c = (HttpURLConnection) new URL(REGISTER_URL).openConnection();
            c.setRequestMethod("POST");
            c.setRequestProperty("Content-Type", "application/json");
            c.setRequestProperty("Cookie", cookie);
            c.setDoOutput(true);
            c.setConnectTimeout(10000);
            c.setReadTimeout(10000);
            try (OutputStream out = c.getOutputStream()) { out.write(payload); }
            c.getResponseCode(); // trigger the request
            c.disconnect();
        } catch (Exception ignored) { /* best-effort */ }
    }

    /**
     * Called from MainActivity.onResume() to ensure the FCM token is registered after login.
     * Also re-registers if the token was refreshed while offline.
     */
    static void ensureRegistered(android.content.Context ctx) {
        FirebaseMessaging.getInstance().getToken().addOnSuccessListener(token -> {
            if (token == null) return;
            String saved = ctx.getSharedPreferences("uci_notify", android.content.Context.MODE_PRIVATE)
                    .getString("fcm_token", "");
            // Always re-POST on resume so a fresh login registers the same token.
            ctx.getSharedPreferences("uci_notify", android.content.Context.MODE_PRIVATE)
                    .edit().putString("fcm_token", token).apply();
            new Thread(() -> new FcmService().registerToken(token) /* best-effort */).start();
        });
    }
}
