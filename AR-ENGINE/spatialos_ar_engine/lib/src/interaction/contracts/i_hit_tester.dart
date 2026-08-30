import 'package:spatialos_ar_engine/src/objects/models/i_spatial_node_data.dart';
import 'package:spatialos_ar_engine/src/objects/models/transform_3d.dart';

/// Determines which spatial object the user is looking at or touching.
abstract class IHitTester {
  /// Casts a ray from the screen into the 3D world to find logical objects.
  ISpatialNodeData? hitTestLogicalObject(Vector2 screenPoint);
}
