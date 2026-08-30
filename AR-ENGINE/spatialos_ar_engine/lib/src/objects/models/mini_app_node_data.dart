import 'i_spatial_node_data.dart';
import 'transform_3d.dart';

/// Represents an interactive sandbox that hosts a spatial application.
class MiniAppNodeData implements ISpatialNodeData {
  @override
  final String id;
  @override
  final String? parentId;
  @override
  final String type = 'mini_app';
  @override
  final Transform3D localTransform;
  @override
  final bool isVisible;
  @override
  final bool isEnabled;
  @override
  final Map<String, dynamic> metadata;

  final String appId;
  final String entryRoute;
  final Map<String, dynamic> initialPayload;

  MiniAppNodeData({
    required this.id,
    this.parentId,
    this.localTransform = const Transform3D(),
    this.isVisible = true,
    this.isEnabled = true,
    this.metadata = const {},
    required this.appId,
    required this.entryRoute,
    this.initialPayload = const {},
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
      'appId': appId,
      'entryRoute': entryRoute,
      'initialPayload': initialPayload,
    };
  }
}
