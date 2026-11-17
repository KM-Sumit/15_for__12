package com.uci.examprep;

import android.app.Activity;
import android.app.Application;
import android.os.Bundle;

public class UciApp extends Application {
	@Override
	public void onCreate() {
		super.onCreate();
		Notify.ensureChannel(this);
		InboxWorker.schedule(this);
		registerActivityLifecycleCallbacks(new ActivityLifecycleCallbacks() {
			@Override
			public void onActivityCreated(Activity a, Bundle s) {
				SecureDisplay.lock(a);
			}

			@Override
			public void onActivityStarted(Activity a) {}

			@Override
			public void onActivityResumed(Activity a) {
				SecureDisplay.lock(a);
			}

			@Override
			public void onActivityPaused(Activity a) {}

			@Override
			public void onActivityStopped(Activity a) {}

			@Override
			public void onActivitySaveInstanceState(Activity a, Bundle s) {}

			@Override
			public void onActivityDestroyed(Activity a) {}
		});
	}
}
