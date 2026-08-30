/// Manages loading and applying shaders/materials to 3D surfaces.
abstract class IMaterialManager {
  Future<void> loadMaterial(String materialId, String sourceUrl);
  void applyMaterial(String objectId, String materialId);
}
