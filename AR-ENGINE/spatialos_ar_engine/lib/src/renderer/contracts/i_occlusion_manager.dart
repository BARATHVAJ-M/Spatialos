/// Masks virtual objects behind physical real-world objects.
abstract class IOcclusionManager {
  Future<void> enableOcclusion();
  Future<void> disableOcclusion();
  bool get isOcclusionActive;
}
