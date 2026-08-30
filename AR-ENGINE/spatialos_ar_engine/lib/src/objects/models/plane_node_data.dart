import 'i_spatial_node_data.dart';
import 'transform_3d.dart';

/// Represents a detected physical plane or artificial surface.
class PlaneNodeData implements ISpatialNodeData {
  @override
  final String id;
  @override
  final String? parentId;
  @override
  final String type = 'plane';
  @override
  final Transform3D localTransform;
  @override
  final bool isVisible;
  @override
  final bool isEnabled;
  @override
  final Map<String, dynamic> metadata;

  final double physicalWidth;
  final double physicalLength;
  final String alignment;

  PlaneNodeData({
    required this.id,
    this.parentId,
    this.localTransform = const Transform3D(),
    this.isVisible = true,
    this.isEnabled = true,
    this.metadata = const {},
    required this.physicalWidth,
    required this.physicalLength,
    required this.alignment,
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
      'physicalWidth': physicalWidth,
      'physicalLength': physicalLength,
      'alignment': alignment,
    };
  }
}
