import 'dart:async';
import 'package:ar_flutter_plugin_flutterflow/ar_flutter_plugin.dart';
import 'package:ar_flutter_plugin_flutterflow/managers/ar_session_manager.dart';
import '../device/contracts/i_camera_provider.dart';
import '../spatial/contracts/i_world_tracker.dart';
import '../spatial/models/spatial_pose.dart';
import '../objects/models/transform_3d.dart';

class ARSessionManagerAdapter implements ICameraProvider, IWorldTracker {
  ARSessionManager? _sessionManager;
  
  final _frameCapturedController = StreamController<dynamic>.broadcast();
  final _poseUpdatedController = StreamController<SpatialPose>.broadcast();
  
  SpatialPose? _currentPose;
  bool _isCameraAvailable = false;

  void attachSessionManager(ARSessionManager manager) {
    _sessionManager = manager;
    _sessionManager!.onInitialize(
      showFeaturePoints: false,
      showPlanes: false,
      customPlaneTexturePath: "Images/triangle.png",
      showWorldOrigin: false,
      handleTaps: true,
    );
    _isCameraAvailable = true;
  }

  // --- ICameraProvider ---
  @override
  bool get isCameraAvailable => _isCameraAvailable;

  @override
  Stream<dynamic> get onFrameCaptured => _frameCapturedController.stream;

  @override
  Future<void> requestPermission() async {
    // Handled by ar_flutter_plugin internally.
  }

  @override
  Future<void> startCamera() async {
    // Started implicitly by ARView
  }

  @override
  Future<void> stopCamera() async {
    _sessionManager?.dispose();
  }

  // --- IWorldTracker ---
  @override
  SpatialPose? getCurrentPose() => _currentPose;

  @override
  Stream<SpatialPose> get onPoseUpdated => _poseUpdatedController.stream;

  @override
  Future<void> pauseTracking() async {
    // ARSessionManager doesn't directly expose pause in the flutter plugin,
    // usually handled by App Lifecycle.
  }

  @override
  Future<void> startTracking() async {
    // Implicitly started on attach.
  }

  @override
  Future<void> stopTracking() async {
    _sessionManager?.dispose();
  }

  void dispose() {
    _frameCapturedController.close();
    _poseUpdatedController.close();
    _sessionManager?.dispose();
  }
}
