import 'dart:async';
import '../core/contracts/i_engine_core.dart';

/// A reactive state store holding the source of truth for UI layers.
/// Provides streams for various engine states.
class EngineStore {
  EngineState _engineState = EngineState.uninitialized;
  final _engineStateController = StreamController<EngineState>.broadcast();

  EngineState get engineState => _engineState;
  Stream<EngineState> get onEngineStateChanged => _engineStateController.stream;

  void updateEngineState(EngineState state) {
    _engineState = state;
    _engineStateController.add(state);
  }

  void dispose() {
    _engineStateController.close();
  }
}
