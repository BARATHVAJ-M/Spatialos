import 'dart:async';
import 'contracts/i_mini_app_runtime.dart';
import 'contracts/i_mini_app_api.dart';
import 'models/mini_app_manifest.dart';
import 'mini_app_api.dart';
import '../interaction/contracts/i_interaction_system.dart';
import '../core/contracts/i_event_bus.dart';
import '../objects/models/i_spatial_node_data.dart';

class MiniAppRuntime implements IMiniAppRuntime {
  final IEventBus _eventBus;
  final IInteractionSystem _interactionSystem;
  
  final Map<String, MiniAppAPI> _bridges = {};
  final Map<String, StreamController<MiniAppState>> _stateControllers = {};

  MiniAppRuntime(this._eventBus, this._interactionSystem);

  @override
  Stream<MiniAppState> onAppStateChanged(String appId) {
    if (!_stateControllers.containsKey(appId)) {
      _stateControllers[appId] = StreamController<MiniAppState>.broadcast();
    }
    return _stateControllers[appId]!.stream;
  }

  @override
  Future<void> launchMiniApp(String appId, ISpatialNodeData targetAnchor) async {
    _updateState(appId, MiniAppState.starting);

    // Create the secure bridge API for this specific app
    final api = MiniAppAPI(appId, _interactionSystem);
    _bridges[appId] = api;

    // Simulate boot time
    await Future.delayed(const Duration(milliseconds: 50));
    _updateState(appId, MiniAppState.running);
  }

  @override
  void suspendMiniApp(String appId) {
    if (_bridges.containsKey(appId)) {
      _updateState(appId, MiniAppState.suspended);
    }
  }

  @override
  Future<void> terminateMiniApp(String appId) async {
    _updateState(appId, MiniAppState.stopped);
    _bridges[appId]?.dispose();
    _bridges.remove(appId);
  }

  @override
  IMiniAppAPI getApiBridge(String appId) {
    if (!_bridges.containsKey(appId)) {
      throw Exception('Mini App $appId is not running or has no secure bridge.');
    }
    return _bridges[appId]!;
  }

  void _updateState(String appId, MiniAppState state) {
    if (_stateControllers.containsKey(appId)) {
      _stateControllers[appId]!.add(state);
    }
  }
  
  void dispose() {
    for (var bridge in _bridges.values) {
      bridge.dispose();
    }
    _bridges.clear();
    for (var controller in _stateControllers.values) {
      controller.close();
    }
    _stateControllers.clear();
  }
}
