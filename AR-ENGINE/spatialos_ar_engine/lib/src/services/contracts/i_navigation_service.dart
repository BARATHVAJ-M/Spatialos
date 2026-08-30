import 'dart:async';
import '../../objects/models/transform_3d.dart';

/// Provides AR wayfinding and navigation data.
abstract class INavigationService {
  Future<List<Vector2>> getRoute(Vector2 start, Vector2 end);
  Stream<Vector2> get onRouteUpdated;
}
