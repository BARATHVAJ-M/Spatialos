import '../models/spatial_anchor.dart';
import '../../objects/models/transform_3d.dart';

/// Contract for managing world anchors.
abstract class IAnchorContract {
  /// Emits when an anchor's tracking state changes.
  Stream<SpatialAnchor> get onAnchorUpdated;

  /// Requests the OS to create a physical anchor at the desired transform.
  Future<SpatialAnchor> createAnchor(String id, Transform3D transform);

  /// Removes an anchor from physical tracking.
  Future<void> removeAnchor(String id);

  /// Gets an anchor by ID.
  SpatialAnchor? getAnchor(String id);
}
