import 'dart:async';
import 'contracts/i_engine_core.dart';
import 'contracts/i_module_manager.dart';
import 'module_manager.dart';

class SpatialOSEngine implements IEngineCore {
  // Singleton instance
  static final SpatialOSEngine _instance = SpatialOSEngine._internal();
  factory SpatialOSEngine() => _instance;
  SpatialOSEngine._internal();

  final IModuleManager modules = ModuleManager();
  
  EngineState _state = EngineState.initializing;

  @override
  EngineState get state => _state;

  @override
  Future<void> initialize() async {
    _state = EngineState.initializing;
    // Base modules would be registered here or injected by the host app
    _state = EngineState.ready;
  }

  @override
  Future<void> start() async {
    if (_state != EngineState.ready && _state != EngineState.suspended) {
      throw Exception('Engine cannot start from state: $_state');
    }
    _state = EngineState.running;
  }

  @override
  Future<void> pause() async {
    if (_state == EngineState.running) {
      _state = EngineState.suspended;
    }
  }

  @override
  Future<void> destroy() async {
    _state = EngineState.destroyed;
    modules.clear();
  }
}
