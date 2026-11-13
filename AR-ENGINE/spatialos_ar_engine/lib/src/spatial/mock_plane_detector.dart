import 'dart:async';
import '../detection/contracts/i_plane_detector.dart';
import '../detection/models/plane_anchor.dart';
import '../objects/models/transform_3d.dart';

class MockPlaneDetector implements IPlaneDetector {
  final StreamController<List<PlaneAnchor>> _planesController = StreamController.broadcast();
  final List<PlaneAnchor> _mockPlanes = [];

  MockPlaneDetector() {
    // Add a default "floor" plane for testing
    _mockPlanes.add(
      PlaneAnchor(
        id: 'mock_floor_1',
        transform: Transform3D(
          position: Vector3(0, -1.5, 0),
        ),
        physicalWidth: 2.0,
        physicalLength: 2.0,
        alignment: 'horizontal_up',
      ),
    );
  }

  @override
  Stream<List<PlaneAnchor>> get onPlanesUpdated => _planesController.stream;

  @override
  Future<List<PlaneAnchor>> hitTest(Vector2 screenPoint) async {
    // In a mock, we just return the first mock plane if requested
    return _mockPlanes;
  }
}
