package com.example.datvexe;

import android.content.Intent;
import android.net.Uri;
import androidx.annotation.NonNull;
import io.flutter.embedding.android.FlutterActivity;
import io.flutter.embedding.engine.FlutterEngine;
import io.flutter.plugin.common.MethodChannel;

public class MainActivity extends FlutterActivity {
    @Override
    public void configureFlutterEngine(@NonNull FlutterEngine flutterEngine) {
        super.configureFlutterEngine(flutterEngine);
        new MethodChannel(flutterEngine.getDartExecutor().getBinaryMessenger(), "rightway/browser")
            .setMethodCallHandler((call, result) -> {
                if (!call.method.equals("open")) {
                    result.notImplemented();
                    return;
                }
                String url = call.argument("url");
                Uri uri = url == null ? null : Uri.parse(url);
                if (uri == null || !("https".equals(uri.getScheme()) || "http".equals(uri.getScheme()))) {
                    result.error("INVALID_URL", "Invalid payment URL", null);
                    return;
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    result.success(true);
                } catch (Exception e) {
                    result.error("BROWSER_UNAVAILABLE", "No browser available", null);
                }
            });
    }
}
