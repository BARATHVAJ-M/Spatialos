import '../../objects/models/i_spatial_node_data.dart';
import '../../spatial/contracts/i_world_tracker.dart';
import '../../objects/models/transform_3d.dart';

/// Defines an event when the Scene Graph changes.
class SceneUpdatedEvent {
  final List<ISpatialNodeData> nodes;
  SceneUpdatedEvent(this.nodes);
}

/// The hierarchical manager of all Spatial Nodes.
abstract class ISceneManager {
  /// Emits whenever nodes are added, removed, or transformed.
  Stream<SceneUpdatedEvent> get onSceneUpdated;

  /// Adds a new node to the scene. If parentId is null, it attaches to the root.
  void addNode(ISpatialNodeData node);

  /// Removes a node and all of its children from the scene.
  void removeNode(String nodeId);

  /// Updates the local transform of a specific node.
  void updateNodeTransform(String nodeId, Transform3D newTransform);

  /// Returns an unmodifiable snapshot of the entire flat scene graph.
  List<ISpatialNodeData> getSceneSnapshot();

  /// Safely clears all nodes from the scene.
  void clearScene();
}
