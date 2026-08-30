import 'dart:async';
import '../objects/models/transform_3d.dart';
import 'contracts/i_world_tracker.dart';
import 'models/spatial_pose.dart';

/// A pure-Dart simulated tracker for Phase B testing.
/// 
/// It runs a 60 FPS loop that slowly moves the 'camera' forward
/// along the Z axis to simulate mathematical space traversal.
class MockWorldTracker implements IWorldTracker {
  final StreamController<SpatialPose> _poseController = StreamController<SpatialPose>.broadcast();
  Timer? _timer;
  SpatialPose? _currentPose;
  
  double _zOffset = 0.0;

  @override
  Stream<SpatialPose> get onPoseUpdated => _poseController.stream;

  @override
  Future<void> startTracking() async {
    if (_timer != null) return;
    
    // Simulate 60 FPS loop
    _timer = Timer.periodic(const Duration(milliseconds: 16), (timer) {
      // Simulate walking forward
      _zOffset += 0.01;
      
      _currentPose = SpatialPose(
        transform: Transform3D(
          position: Vector3(0, 1.5, _zOffset), // Camera at 1.5m height
        ),
        timestamp: DateTime.now(),
        trackingConfidence: TrackingConfidence.high,
      );
      
      _poseController.add(_currentPose!);
    });
  }

  @override
  Future<void> pauseTracking() async {
    _timer?.cancel();
    _timer = null;
  }

  @override
  Future<void> stopTracking() async {
    await pauseTracking();
    _zOffset = 0.0;
    _currentPose = null;
  }

  @override
  SpatialPose? getCurrentPose() => _currentPose;
}
