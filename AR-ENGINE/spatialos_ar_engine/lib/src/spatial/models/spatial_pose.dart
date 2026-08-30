import '../../objects/models/transform_3d.dart';

enum TrackingConfidence {
  high,
  medium,
  low,
  failed,
}

/// Represents an absolute tracking pose provided by the World Tracker.
class SpatialPose {
  final Transform3D transform;
  final DateTime timestamp;
  final TrackingConfidence trackingConfidence;

  SpatialPose({
    required this.transform,
    required this.timestamp,
    required this.trackingConfidence,
  });

  Map<String, dynamic> toJson() {
    return {
      'transform': transform.toJson(),
      'timestamp': timestamp.toIso8601String(),
      'trackingConfidence': trackingConfidence.toString(),
    };
  }
}
