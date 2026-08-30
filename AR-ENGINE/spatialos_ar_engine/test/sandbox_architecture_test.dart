import 'package:test/test.dart';
import 'package:spatialos_ar_engine/spatialos_ar_engine.dart';
import 'package:spatialos_ar_engine/src/core/event_bus.dart';
import 'package:spatialos_ar_engine/src/spatial/mock_world_tracker.dart';
import 'package:spatialos_ar_engine/src/scene/scene_manager.dart';
import 'package:spatialos_ar_engine/src/interaction/interaction_system.dart';
import 'package:spatialos_ar_engine/src/mini_apps/mini_app_runtime.dart';
import 'package:spatialos_ar_engine/src/interaction/mock_hit_tester.dart';
import 'package:spatialos_ar_engine/src/objects/models/transform_3d.dart';

void main() {
  group('Sandbox Architecture Tests', () {
    test('MiniApp Runtime receives tap from Interaction System without tight coupling', () async {
      final eventBus = EventBus();
      final tracker = MockWorldTracker();
      final sceneManager = SceneManager(eventBus, tracker);
      final hitTester = MockHitTester(sceneManager);
      final interaction = InteractionSystem(eventBus, hitTester);
      final runtime = MiniAppRuntime(eventBus, interaction);

      // Add the Mini App node to the scene so it can be hit-tested
      final appNode = MiniAppNodeData(
        id: 'com.spatialos.test_app',
        appId: 'com.spatialos.test_app',
        entryRoute: '/home',
      );
      sceneManager.addNode(appNode);

      // Boot the Mini App
      await runtime.launchMiniApp('com.spatialos.test_app', appNode);
      
      // Get the isolated API bridge
      final api = runtime.getApiBridge('com.spatialos.test_app');
      
      bool appWasTapped = false;
      api.onUserTapped.listen((_) {
        appWasTapped = true;
      });

      // Simulate the user physically tapping the screen.
      // The interaction system should detect the appNode and fire an event.
      // The MiniAppAPI should catch the event and trigger `onUserTapped`.
      interaction.onPointerDown(Vector2(100.0, 100.0));

      // Wait a tick for streams to resolve
      await Future.delayed(const Duration(milliseconds: 50));
      
      expect(appWasTapped, isTrue);

      // Clean up
      runtime.dispose();
      interaction.dispose();
      sceneManager.dispose();
    });
  });
}
