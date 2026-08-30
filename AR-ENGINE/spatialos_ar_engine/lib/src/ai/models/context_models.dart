/// Represents the geometric and visual context of a room.
class SpatialContext {
  final List<String> detectedPlanes;
  final String roomType;

  const SpatialContext({
    required this.detectedPlanes,
    required this.roomType,
  });
}

/// Represents the visual and semantic context of a single object.
class ObjectContext {
  final String objectClassification;
  final double confidence;

  const ObjectContext({
    required this.objectClassification,
    required this.confidence,
  });
}
