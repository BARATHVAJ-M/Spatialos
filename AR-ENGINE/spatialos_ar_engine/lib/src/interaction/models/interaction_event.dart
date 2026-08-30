import '../../objects/models/transform_3d.dart';

enum InteractionType {
  tap,
  doubleTap,
  longPress,
  swipe,
}

/// The standardized payload emitted when a physical user interacts with a 3D node.
class InteractionEvent {
  final String objectId;
  final InteractionType type;
  final Vector3 impactPoint;
  final DateTime timestamp;

  InteractionEvent({
    required this.objectId,
    required this.type,
    required this.impactPoint,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() {
    return {
      'objectId': objectId,
      'type': type.toString(),
      'impactPoint': impactPoint.toJson(),
      'timestamp': timestamp.toIso8601String(),
    };
  }
}
