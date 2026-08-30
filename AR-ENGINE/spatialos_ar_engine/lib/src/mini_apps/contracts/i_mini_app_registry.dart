/// Maintains a registry of installed/available Mini-Apps.
abstract class IMiniAppRegistry {
  Future<void> registerApp(String appId, Map<String, dynamic> manifest);
  Future<void> unregisterApp(String appId);
  Map<String, dynamic>? getAppManifest(String appId);
}
