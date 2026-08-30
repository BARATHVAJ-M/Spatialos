import '../objects/models/spatial_node.dart';

/// Represents the hierarchical tree of the AR scene.
class SceneGraph {
  SpatialNode? rootNode;

  /// Recursively searches the tree for a node with the given ID.
  SpatialNode? findNodeById(String id, {SpatialNode? currentNode}) {
    if (rootNode == null) return null;
    
    final nodeToCheck = currentNode ?? rootNode!;
    if (nodeToCheck.id == id) {
      return nodeToCheck;
    }

    // In a real implementation, SpatialNode would have a `children` list.
    // For now, since SpatialNode doesn't explicitly store children in the data model 
    // (it uses parentId for flat lists), we might need an index.
    // Let's assume a flat index for O(1) lookups in the Manager.
    return null;
  }
}
