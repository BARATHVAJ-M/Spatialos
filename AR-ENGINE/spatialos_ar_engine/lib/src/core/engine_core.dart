import 'dart:async';
import 'contracts/i_engine_core.dart';
import 'contracts/i_module_manager.dart';
import 'contracts/i_event_bus.dart';
import 'contracts/i_configuration.dart';
import 'contracts/i_error_system.dart';
import 'models/engine_error_data.dart';
import 'module_manager.dart';
import 'event_bus.dart';
import 'configuration.dart';
import 'error_system.dart';
import '../spatial/contracts/i_world_tracker.dart';
import '../spatial/mock_world_tracker.dart';
import '../scene/contracts/i_scene_manager.dart';
import '../scene/scene_manager.dart';
import '../interaction/contracts/i_interaction_system.dart';
import '../interaction/interaction_system.dart';
import '../interaction/contracts/i_hit_tester.dart';
import '../interaction/mock_hit_tester.dart';
import '../mini_apps/contracts/i_mini_app_runtime.dart';
import '../mini_apps/mini_app_runtime.dart';
import '../detection/contracts/i_plane_detector.dart';
import '../detection/mock_plane_detector.dart';
import '../services/contracts/i_api_gateway.dart';
import '../services/mock_api_gateway.dart';
import '../renderer/contracts/i_render_pipeline.dart';

/// The root orchestrator that boots the engine.
class EngineCore implements IEngineCore {
  final StreamController<EngineState> _stateController = StreamController<EngineState>.broadcast();
  EngineState _state = EngineState.uninitialized;

  late final IModuleManager moduleManager;

  @override
  EngineState get state => _state;

  @override
  Stream<EngineState> get onStateChanged => _stateController.stream;

  void _updateState(EngineState newState) {
    if (_state == newState) return;
    _state = newState;
    _stateController.add(_state);
  }

  @override
  Future<void> initialize(IRenderPipeline renderPipeline) async {
    if (_state != EngineState.uninitialized) return;
    _updateState(EngineState.initializing);

    try {
      // Phase 1 & 2: Core modules Dependencies
      moduleManager = ModuleManager();
      moduleManager.register<IModuleManager>(moduleManager);
      
      // Register Host-Provided Renderer
      moduleManager.register<IRenderPipeline>(renderPipeline);
      
      final errorSystem = ErrorSystem();
      moduleManager.register<IErrorSystem>(errorSystem);

      final eventBus = EventBus();
      moduleManager.register<IEventBus>(eventBus);

      final config = Configuration();
      moduleManager.register<IConfiguration>(config);
      await config.load();

      // Phase 3: Spatial Modules
      final tracker = MockWorldTracker();
      moduleManager.register<IWorldTracker>(tracker);
      
      final sceneManager = SceneManager(eventBus, tracker);
      moduleManager.register<ISceneManager>(sceneManager);

      // Phase 4: Interaction Module
      final hitTester = MockHitTester(sceneManager);
      moduleManager.register<IHitTester>(hitTester);

      final interaction = InteractionSystem(eventBus, hitTester);
      moduleManager.register<IInteractionSystem>(interaction);

      final miniAppRuntime = MiniAppRuntime(eventBus, interaction);
      moduleManager.register<IMiniAppRuntime>(miniAppRuntime);

      // Phase 6: Reality Modules
      final planeDetector = MockPlaneDetector();
      moduleManager.register<IPlaneDetector>(planeDetector);

      final apiGateway = MockApiGateway();
      moduleManager.register<IApiGateway>(apiGateway);

      // Wire Scene Updates to the Renderer
      sceneManager.onSceneUpdated.listen((event) {
        renderPipeline.onSceneSnapshotUpdated(event.nodes);
      });

      // At this point, the Core framework is securely booted.
      _updateState(EngineState.ready);
    } catch (e, stackTrace) {
      _updateState(EngineState.error);
      
      // Fallback manual print if error system failed to boot
      print('FATAL ENGINE INITIALIZATION ERROR: $e\n$stackTrace');
      
      if (moduleManager.isRegistered<IErrorSystem>()) {
        moduleManager.resolve<IErrorSystem>().reportError(
          EngineErrorData(
            errorId: 'ERR_CORE_INIT',
            timestamp: DateTime.now(),
            sourceModule: 'CORE',
            severity: ErrorSeverity.fatal,
            message: 'Failed to initialize Engine Core: $e',
            stackTrace: stackTrace.toString(),
            isRecoverable: false,
          )
        );
      }
    }
  }

  @override
  Future<void> start() async {
    if (_state != EngineState.ready && _state != EngineState.paused) return;
    _updateState(EngineState.running);
    // Triggering lower level systems will happen here in future phases
  }

  @override
  Future<void> pause() async {
    if (_state != EngineState.running) return;
    _updateState(EngineState.paused);
  }

  @override
  Future<void> destroy() async {
    _updateState(EngineState.stopped);
    
    if (moduleManager.isRegistered<IEventBus>()) {
      (moduleManager.resolve<IEventBus>() as EventBus).dispose();
    }
    if (moduleManager.isRegistered<IErrorSystem>()) {
      (moduleManager.resolve<IErrorSystem>() as ErrorSystem).dispose();
    }
    
    moduleManager.clear();
    await _stateController.close();
  }
}
