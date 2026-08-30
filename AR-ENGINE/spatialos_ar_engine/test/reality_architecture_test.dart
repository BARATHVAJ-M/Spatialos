import 'package:flutter_test/flutter_test.dart';
import 'package:spatialos_ar_engine/spatialos_ar_engine.dart';
import 'package:spatialos_ar_engine/src/objects/models/transform_3d.dart';
import 'dart:async';

class MockRenderPipeline implements IRenderPipeline {
  final Completer<List<ISpatialNodeData>> sceneCompleter = Completer();
  int updateCount = 0;

  @override
  void onSceneSnapshotUpdated(List<ISpatialNodeData> nodes) {
    updateCount++;
    if (!sceneCompleter.isCompleted) {
      sceneCompleter.complete(nodes);
    }
  }

  @override
  void clearRenderer() {}
}

void main() {
  group('Reality Architecture Tests', () {
    test('EngineCore boots Phase D Modules and wires Renderer', () async {
      final engine = EngineCore();
      final mockRenderer = MockRenderPipeline();

      // Boot engine and inject renderer
      await engine.initialize(mockRenderer);
      expect(engine.state, EngineState.ready);

      final moduleManager = engine.moduleManager;

      // 1. Verify Phase D Modules exist in the locator
      final planeDetector = moduleManager.resolve<IPlaneDetector>();
      final apiGateway = moduleManager.resolve<IApiGateway>();

      expect(planeDetector, isNotNull);
      expect(apiGateway, isNotNull);

      // 2. Verify Plane Detector works
      final planes = await planeDetector.hitTest(Vector2(100, 100));
      expect(planes, isEmpty); // Mock returns empty initially before 1s timer

      // 3. Verify API Gateway works
      final manifest = await apiGateway.fetchMiniAppManifest('mock');
      expect(manifest['name'], 'Mock App');

      // 4. Verify Renderer wire-up
      // If we add a node to the SceneManager, the Renderer should receive the snapshot
      final sceneManager = moduleManager.resolve<ISceneManager>();
      
      sceneManager.addNode(PlaneNodeData(
        id: 'test_plane',
        physicalWidth: 1,
        physicalLength: 1,
        alignment: 'horizontal_up',
      ));

      final snapshot = await mockRenderer.sceneCompleter.future;
      expect(snapshot.length, 1);
      expect(snapshot.first.id, 'test_plane');
      expect(mockRenderer.updateCount, 1);
    });
  });
}
