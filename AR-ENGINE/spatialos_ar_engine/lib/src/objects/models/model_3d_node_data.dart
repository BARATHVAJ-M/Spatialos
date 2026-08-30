import 'i_spatial_node_data.dart';
import 'transform_3d.dart';

/// Represents a GLTF/GLB 3D model rendered in space.
class Model3DNodeData implements ISpatialNodeData {
  @override
  final String id;
  @override
  final String? parentId;
  @override
  final String type = 'model_3d';
  @override
  final Transform3D localTransform;
  @override
  final bool isVisible;
  @override
  final bool isEnabled;
  @override
  final Map<String, dynamic> metadata;

  final String assetUrl;
  final String? animationState;

  Model3DNodeData({
    required this.id,
    this.parentId,
    this.localTransform = const Transform3D(),
    this.isVisible = true,
    this.isEnabled = true,
    this.metadata = const {},
    required this.assetUrl,
    this.animationState,
  });

  @override
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'parentId': parentId,
      'type': type,
      'localTransform': localTransform.toJson(),
      'isVisible': isVisible,
      'isEnabled': isEnabled,
      'metadata': metadata,
      'assetUrl': assetUrl,
      'animationState': animationState,
    };
  }
}
