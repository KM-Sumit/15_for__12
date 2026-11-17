# ─── WebView / UCI app ───────────────────────────────────────────────────────
# Keep all @JavascriptInterface methods so the JS bridge works after minification
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep the ChromeBridge inner class (used by WebView.addJavascriptInterface)
-keep class com.uci.examprep.MainActivity$ChromeBridge { *; }

# Keep all public entry-point classes (Activities, Services, etc.)
-keep public class com.uci.examprep.** { public *; }

# ─── Firebase / FCM ──────────────────────────────────────────────────────────
# Firebase BOM already ships its own proguard rules; these are extra guards.
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# ─── AndroidX WorkManager (InboxWorker) ──────────────────────────────────────
-keep class androidx.work.** { *; }
-keepclassmembers class * extends androidx.work.Worker { *; }
-keepclassmembers class * extends androidx.work.ListenableWorker {
    public <init>(android.content.Context, androidx.work.WorkerParameters);
}

# ─── General Android safety ───────────────────────────────────────────────────
# Keep Parcelable creators
-keepclassmembers class * implements android.os.Parcelable {
    public static final ** CREATOR;
}

# Keep R fields (resource IDs)
-keepclassmembers class **.R$* {
    public static <fields>;
}

# Remove verbose logging in release
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
}
