import '../../spatial/models/spatial_anchor.dart';
import '../../objects/models/transform_3d.dart';

/// Represents a detected horizontal or vertical surface in the physical world.
class PlaneAnchor extends SpatialAnchor {
  final double physicalWidth;
  final double physicalLength;
  final String alignment; // e.g., 'horizontal_up', 'vertical'

  PlaneAnchor({
    required super.id,
    required super.transform,
    super.isResolved = true,
    required this.physicalWidth,
    required this.physicalLength,
    required this.alignment,
  });

  @override
  Map<String, dynamic> toJson() {
    final base = super.toJson();
    base.addAll({
      'physicalWidth': physicalWidth,
      'physicalLength': physicalLength,
      'alignment': alignment,
    });
    return base;
  }
}
