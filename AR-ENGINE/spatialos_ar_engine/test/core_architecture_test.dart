import 'package:test/test.dart';
import 'package:spatialos_ar_engine/spatialos_ar_engine.dart';
import 'package:spatialos_ar_engine/src/core/module_manager.dart';
import 'package:spatialos_ar_engine/src/core/event_bus.dart';
import 'dart:async';

class MockRenderPipeline implements IRenderPipeline {
  @override
  void onSceneSnapshotUpdated(List<ISpatialNodeData> nodes) {}

  @override
  void clearRenderer() {}
}

// Dummy class to test DI
class DummyDependency {}

// Dummy event to test EventBus
class DummyEvent {
  final String message;
  DummyEvent(this.message);
}

void main() {
  group('Core Architecture Tests', () {
    test('ModuleManager registers and resolves dependencies', () {
      final moduleManager = ModuleManager();
      final dummy = DummyDependency();

      moduleManager.register<DummyDependency>(dummy);

      expect(moduleManager.isRegistered<DummyDependency>(), isTrue);
      
      final resolved = moduleManager.resolve<DummyDependency>();
      expect(resolved, equals(dummy));
    });

    test('ModuleManager throws DependencyException for unregistered types', () {
      final moduleManager = ModuleManager();
      
      expect(
        () => moduleManager.resolve<DummyDependency>(),
        throwsA(isA<Exception>().having((e) => e.toString(), 'toString', contains('DependencyException')))
      );
    });

    test('EventBus publishes and subscribes to events', () async {
      final eventBus = EventBus(sync: true);
      
      String receivedMessage = '';
      
      eventBus.on<DummyEvent>().listen((event) {
        receivedMessage = event.message;
      });

      eventBus.publish(DummyEvent('Hello SpatialOS'));
      
      // Because we used a sync broadcast stream for testing, it resolves immediately
      expect(receivedMessage, equals('Hello SpatialOS'));
      
      eventBus.dispose();
    });

    test('EngineCore boots correctly and reaches ready state', () async {
      final engine = EngineCore();
      
      expect(engine.state, equals(EngineState.uninitialized));
      
      // 3. Initialize engine
      final renderer = MockRenderPipeline();
      await engine.initialize(renderer);
      
      expect(engine.state, equals(EngineState.ready));
      
      // Verify primal dependencies are injected
      expect(engine.moduleManager.isRegistered<IEventBus>(), isTrue);
      expect(engine.moduleManager.isRegistered<IConfiguration>(), isTrue);
      expect(engine.moduleManager.isRegistered<IErrorSystem>(), isTrue);

      await engine.destroy();
      expect(engine.state, equals(EngineState.stopped));
    });
  });
}
