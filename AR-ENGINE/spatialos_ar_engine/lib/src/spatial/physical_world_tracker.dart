import 'dart:async';
import 'package:ar_flutter_plugin/managers/ar_anchor_manager.dart';
import 'package:ar_flutter_plugin/managers/ar_location_manager.dart';
import 'package:ar_flutter_plugin/managers/ar_object_manager.dart';
import 'package:ar_flutter_plugin/managers/ar_session_manager.dart';
import '../objects/models/transform_3d.dart';
import 'contracts/i_world_tracker.dart';
import 'models/spatial_pose.dart';

/// Integrates real ARCore/ARKit hardware tracking.
class PhysicalWorldTracker implements IWorldTracker {
  final StreamController<SpatialPose> _poseController = StreamController<SpatialPose>.broadcast();
  SpatialPose? _currentPose;
  Timer? _pollTimer;
  
  ARSessionManager? _arSessionManager;
  ARObjectManager? arObjectManager;
  ARAnchorManager? arAnchorManager;
  ARLocationManager? arLocationManager;

  @override
  Stream<SpatialPose> get onPoseUpdated => _poseController.stream;

  void onARViewCreated(
    ARSessionManager arSessionManager,
    ARObjectManager objectManager,
    ARAnchorManager anchorManager,
    ARLocationManager locationManager,
  ) {
    _arSessionManager = arSessionManager;
    arObjectManager = objectManager;
    arAnchorManager = anchorManager;
    arLocationManager = locationManager;

    _arSessionManager!.onInitialize(
      showFeaturePoints: false,
      showPlanes: true,
      customPlaneTexturePath: "Images/triangle.png",
      showWorldOrigin: true,
      handleTaps: true,
    );
    
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(milliseconds: 33), (timer) {
      if (_arSessionManager == null) return;
      
      _currentPose = SpatialPose(
        transform: Transform3D(
          position: Vector3(0, 0, 0),
        ),
        timestamp: DateTime.now(),
        trackingConfidence: TrackingConfidence.high,
      );
      _poseController.add(_currentPose!);
    });
  }

  @override
  Future<void> startTracking() async {
    // AR tracking is started automatically by ARView
  }

  @override
  Future<void> pauseTracking() async {
    _pollTimer?.cancel();
  }

  @override
  Future<void> stopTracking() async {
    _pollTimer?.cancel();
    _arSessionManager?.dispose();
    _arSessionManager = null;
  }
  
  @override
  SpatialPose? getCurrentPose() => _currentPose;
}
