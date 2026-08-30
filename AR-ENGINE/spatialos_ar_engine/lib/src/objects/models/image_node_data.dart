import 'i_spatial_node_data.dart';
import 'transform_3d.dart';

/// Represents a 2D image asset rendered in 3D space.
class ImageNodeData implements ISpatialNodeData {
  @override
  final String id;
  @override
  final String? parentId;
  @override
  final String type = 'image';
  @override
  final Transform3D localTransform;
  @override
  final bool isVisible;
  @override
  final bool isEnabled;
  @override
  final Map<String, dynamic> metadata;

  final String assetUrl;
  final double physicalWidth;

  ImageNodeData({
    required this.id,
    this.parentId,
    this.localTransform = const Transform3D(),
    this.isVisible = true,
    this.isEnabled = true,
    this.metadata = const {},
    required this.assetUrl,
    required this.physicalWidth,
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
      'physicalWidth': physicalWidth,
    };
  }
}
