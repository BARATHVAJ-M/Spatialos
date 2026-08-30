import '../models/spatial_pose.dart';

/// The contract for OS-level physical AR tracking.
abstract class IWorldTracker {
  /// Emits the camera's 6DoF movement through the physical world.
  Stream<SpatialPose> get onPoseUpdated;

  /// Starts the tracking session.
  Future<void> startTracking();

  /// Pauses the tracking session without losing session data.
  Future<void> pauseTracking();

  /// Stops tracking and destroys session data.
  Future<void> stopTracking();
  
  /// Gets the last known pose.
  SpatialPose? getCurrentPose();
}
