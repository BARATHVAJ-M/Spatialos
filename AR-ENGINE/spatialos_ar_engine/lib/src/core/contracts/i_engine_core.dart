import '../../renderer/contracts/i_render_pipeline.dart';

/// Defines the states the entire engine can be in.
enum EngineState {
  uninitialized,
  initializing,
  ready,
  running,
  paused,
  stopped,
  error,
}

/// The main orchestrator of the AR Engine.
abstract class IEngineCore {
  /// Bootstraps the engine, requiring the host app to provide the physical renderer.
  Future<void> initialize(IRenderPipeline renderPipeline);

  /// The current global lifecycle state of the engine.
  EngineState get state;

  /// Emits a new value whenever the engine state transitions.
  Stream<EngineState> get onStateChanged;

  /// Starts the core processing loops (e.g. tracking, detection).
  Future<void> start();

  /// Pauses processing (usually triggered by OS lifecycle).
  Future<void> pause();

  /// Safely shuts down all modules and clears resources.
  Future<void> destroy();
}
