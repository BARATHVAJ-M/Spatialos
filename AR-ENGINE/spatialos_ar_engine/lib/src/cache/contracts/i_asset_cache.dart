import 'dart:async';

/// Prevents redundant downloads of large 3D/Video files.
abstract class IAssetCache {
  Future<bool> hasAsset(String assetId);
  Future<String> getAssetPath(String assetId);
  Future<void> storeAsset(String assetId, List<int> bytes);
  Future<void> clearCache();
}
