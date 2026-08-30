/// Uniquely identifies a spatial entity across network boundaries.
class SpatialIdentity {
  final String uuid;
  final String ownerId;
  final bool isPublic;
  final Map<String, dynamic> metadata;

  const SpatialIdentity({
    required this.uuid,
    required this.ownerId,
    this.isPublic = true,
    this.metadata = const {},
  });
}
