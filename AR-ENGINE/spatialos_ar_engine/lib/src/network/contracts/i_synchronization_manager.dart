/// Syncs local offline changes to the remote server when connectivity is restored.
abstract class ISynchronizationManager {
  Future<void> syncPendingChanges();
  Stream<double> get onSyncProgress;
}
