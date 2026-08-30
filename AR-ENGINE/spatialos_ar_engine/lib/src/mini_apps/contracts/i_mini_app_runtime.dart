import 'i_mini_app_api.dart';
import '../models/mini_app_manifest.dart';
import '../../objects/models/i_spatial_node_data.dart';

enum MiniAppState {
  stopped,
  starting,
  running,
  suspended,
  crashed,
}

/// The sandbox environment for third-party SpatialOS mini-apps.
abstract class IMiniAppRuntime {
  Stream<MiniAppState> onAppStateChanged(String appId);

  /// Boots a mini-app from a remote bundle.
  Future<void> launchMiniApp(String appId, ISpatialNodeData targetAnchor);

  /// Shuts down an active mini-app.
  Future<void> terminateMiniApp(String appId);

  /// Pauses the mini-app's execution.
  void suspendMiniApp(String appId);

  /// Exposes the secure API bridge for the Mini App to talk back to SpatialOS.
  IMiniAppAPI getApiBridge(String appId);
}
