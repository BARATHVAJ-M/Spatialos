import 'dart:async';
import 'package:vector_math/vector_math_64.dart';
import 'contracts/i_plane_detector.dart';

class MockPlaneAnchor implements IPlaneAnchor {
  @override
  final String id;
  
  @override
  final Matrix4 transform;

  MockPlaneAnchor({required this.id, required this.transform});
}

class MockPlaneDetector implements IPlaneDetector {
  final StreamController<List<IPlaneAnchor>> _planesController = StreamController.broadcast();
  final List<IPlaneAnchor> _mockPlanes = [];

  MockPlaneDetector() {
    // Add a default "floor" plane for testing
    _mockPlanes.add(
      MockPlaneAnchor(
        id: 'mock_floor_1',
        transform: Matrix4.translationValues(0, -1.5, 0), // 1.5m below camera
      )
    );
  }

  @override
  Stream<List<IPlaneAnchor>> get onPlanesUpdated => _planesController.stream;

  @override
  Future<List<IPlaneAnchor>> hitTest(Vector2 screenPoint) async {
    // In a mock, we just return the first mock plane if requested
    return _mockPlanes;
  }
}
