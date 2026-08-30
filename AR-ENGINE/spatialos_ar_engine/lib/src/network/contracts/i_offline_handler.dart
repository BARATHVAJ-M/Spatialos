/// Queues network actions while the device is offline.
abstract class IOfflineHandler {
  Future<void> queueAction(String actionId, Map<String, dynamic> payload);
  Future<List<Map<String, dynamic>>> getPendingActions();
}
