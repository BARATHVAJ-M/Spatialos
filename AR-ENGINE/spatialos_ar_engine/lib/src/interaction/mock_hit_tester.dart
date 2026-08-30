import 'contracts/i_hit_tester.dart';
import '../scene/contracts/i_scene_manager.dart';
import '../objects/models/i_spatial_node_data.dart';
import '../objects/models/transform_3d.dart';

class MockHitTester implements IHitTester {
  final ISceneManager _sceneManager;

  MockHitTester(this._sceneManager);

  @override
  ISpatialNodeData? hitTestLogicalObject(Vector2 screenPoint) {
    // In Phase D, this would do real Matrix math.
    // For the mock, we just return the first node in the scene if it exists.
    final nodes = _sceneManager.getSceneSnapshot();
    if (nodes.isNotEmpty) {
      return nodes.first;
    }
    return null;
  }
}
