import 'spatial_node.dart';
import 'transform_3d.dart';

class FormNode extends SpatialNode {
  final List<String> fields;
  final String submitActionId;

  FormNode({
    required super.id,
    super.parentId,
    required super.localTransform,
    required this.fields,
    required this.submitActionId,
    super.isVisible,
  }) : super(nodeType: NodeType.form);
}
