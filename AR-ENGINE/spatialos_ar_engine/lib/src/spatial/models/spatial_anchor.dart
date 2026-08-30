import '../../objects/models/transform_3d.dart';

/// Represents a persisted, physical point locked in world space.
class SpatialAnchor {
  final String id;
  final Transform3D transform;
  final bool isResolved;

  SpatialAnchor({
    required this.id,
    required this.transform,
    this.isResolved = false,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'transform': transform.toJson(),
      'isResolved': isResolved,
    };
  }
}
