import 'dart:async';
import 'contracts/i_engine_core.dart';
import 'contracts/i_module_manager.dart';
import 'module_manager.dart';
import '../renderer/contracts/i_render_pipeline.dart';

class SpatialOSEngine implements IEngineCore {
  // Singleton instance
  static final SpatialOSEngine _instance = SpatialOSEngine._internal();
  factory SpatialOSEngine() => _instance;
  SpatialOSEngine._internal();

  final IModuleManager modules = ModuleManager();
  final StreamController<EngineState> _stateController = StreamController<EngineState>.broadcast();
  
  EngineState _state = EngineState.uninitialized;

  @override
  EngineState get state => _state;

  @override
  Stream<EngineState> get onStateChanged => _stateController.stream;

  void _setState(EngineState newState) {
    _state = newState;
    _stateController.add(newState);
  }

  @override
  Future<void> initialize(IRenderPipeline renderPipeline) async {
    _setState(EngineState.initializing);
    // Base modules would be registered here or injected by the host app
    _setState(EngineState.ready);
  }

  @override
  Future<void> start() async {
    if (_state != EngineState.ready && _state != EngineState.paused) {
      throw Exception('Engine cannot start from state: $_state');
    }
    _setState(EngineState.running);
  }

  @override
  Future<void> pause() async {
    if (_state == EngineState.running) {
      _setState(EngineState.paused);
    }
  }

  @override
  Future<void> destroy() async {
    _setState(EngineState.stopped);
    modules.clear();
    await _stateController.close();
  }
}
