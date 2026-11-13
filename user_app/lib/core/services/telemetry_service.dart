import 'package:flutter/foundation.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
// import 'package:firebase_crashlytics/firebase_crashlytics.dart'; // Uncomment when Firebase is configured

class TelemetryService {
  static Future<void> init() async {
    // Sentry Initialization
    await SentryFlutter.init(
      (options) {
        options.dsn = 'YOUR_SENTRY_DSN_HERE';
        options.tracesSampleRate = 1.0; // Capture 100% of transactions for performance monitoring.
      },
    );

    // Firebase Crashlytics Initialization (Stubbed until google-services.json is added)
    // FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;
    
    // Catch rendering errors
    FlutterError.onError = (FlutterErrorDetails details) {
      if (kDebugMode) {
        FlutterError.dumpErrorToConsole(details);
      } else {
        Sentry.captureException(details.exception, stackTrace: details.stack);
        // FirebaseCrashlytics.instance.recordFlutterError(details);
      }
    };
  }

  static void recordError(dynamic exception, StackTrace stackTrace, {dynamic reason}) {
    Sentry.captureException(exception, stackTrace: stackTrace, withScope: (scope) {
      if (reason != null) scope.setContexts('error_context', {'reason': reason.toString()});
    });
    // FirebaseCrashlytics.instance.recordError(exception, stackTrace, reason: reason);
  }

  static void logNetworkError(String url, int? statusCode, dynamic data) {
    Sentry.captureMessage(
      'Network API Error: $url',
      level: SentryLevel.error,
      withScope: (scope) {
        scope.setContexts('network_error', {
          'statusCode': statusCode,
          'responseData': data.toString(),
        });
      },
    );
  }
}
