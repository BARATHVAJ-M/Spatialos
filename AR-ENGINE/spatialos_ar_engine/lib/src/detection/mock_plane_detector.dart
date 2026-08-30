import 'dart:async';
import 'contracts/i_plane_detector.dart';
import 'models/plane_anchor.dart';
import '../objects/models/transform_3d.dart';

/// A pure-Dart simulated plane detector for testing the core engine.
class MockPlaneDetector implements IPlaneDetector {
  final StreamController<List<PlaneAnchor>> _controller = StreamController.broadcast();
  final List<PlaneAnchor> _mockPlanes = [];
  Timer? _timer;

  MockPlaneDetector() {
    // Simulate finding a floor after 1 second
    _timer = Timer(const Duration(seconds: 1), () {
      final floor = PlaneAnchor(
        id: 'mock_floor_1',
        transform: Transform3D(
          position: Vector3(0, -1.5, 0), // 1.5 meters below camera
        ),
        physicalWidth: 5.0,
        physicalLength: 5.0,
        alignment: 'horizontal_up',
      );
      _mockPlanes.add(floor);
      _controller.add(List.unmodifiable(_mockPlanes));
    });
  }

  @override
  Stream<List<PlaneAnchor>> get onPlanesUpdated => _controller.stream;

  @override
  Future<List<PlaneAnchor>> hitTest(Vector2 screenPoint) async {
    // If we have planes, pretend we hit the first one.
    if (_mockPlanes.isNotEmpty) {
      return [_mockPlanes.first];
    }
    return [];
  }

  void dispose() {
    _timer?.cancel();
    _controller.close();
  }
}
