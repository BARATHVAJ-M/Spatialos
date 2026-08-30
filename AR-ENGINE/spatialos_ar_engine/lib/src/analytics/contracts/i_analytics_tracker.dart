/// Tracks engine usage, errors, and interaction events.
abstract class IAnalyticsTracker {
  void logEvent(String eventName, [Map<String, dynamic>? params]);
  void logError(Exception error, StackTrace stackTrace);
}
