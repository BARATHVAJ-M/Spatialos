import 'i_spatial_node_data.dart';
import 'transform_3d.dart';

/// Represents a video asset rendered in 3D space.
class VideoNodeData implements ISpatialNodeData {
  @override
  final String id;
  @override
  final String? parentId;
  @override
  final String type = 'video';
  @override
  final Transform3D localTransform;
  @override
  final bool isVisible;
  @override
  final bool isEnabled;
  @override
  final Map<String, dynamic> metadata;

  final String assetUrl;
  final bool autoPlay;
  final bool loop;

  VideoNodeData({
    required this.id,
    this.parentId,
    this.localTransform = const Transform3D(),
    this.isVisible = true,
    this.isEnabled = true,
    this.metadata = const {},
    required this.assetUrl,
    this.autoPlay = true,
    this.loop = true,
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
      'autoPlay': autoPlay,
      'loop': loop,
    };
  }
}
