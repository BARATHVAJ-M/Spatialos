import 'spatial_node.dart';
import 'transform_3d.dart';

class Model3DNode extends SpatialNode {
  final String modelUrl;

  Model3DNode({
    required super.id,
    super.parentId,
    required super.localTransform,
    required this.modelUrl,
    super.isVisible,
  }) : super(nodeType: NodeType.model3D);
}
