import 'spatial_node.dart';
import 'transform_3d.dart';

class ButtonNode extends SpatialNode {
  final String label;
  final String actionId;

  ButtonNode({
    required super.id,
    super.parentId,
    required super.localTransform,
    required this.label,
    required this.actionId,
    super.isVisible,
  }) : super(nodeType: NodeType.button);
}
