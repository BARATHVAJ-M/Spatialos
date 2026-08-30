import 'dart:async';
import '../models/plane_anchor.dart';
import '../../objects/models/transform_3d.dart';

/// Detects physical planes (floors, tables, walls) in the real world.
abstract class IPlaneDetector {
  /// Emits updates whenever physical planes are found, updated, or lost.
  Stream<List<PlaneAnchor>> get onPlanesUpdated;
  
  /// Performs a hit test against detected physical geometry.
  Future<List<PlaneAnchor>> hitTest(Vector2 screenPoint);
}
