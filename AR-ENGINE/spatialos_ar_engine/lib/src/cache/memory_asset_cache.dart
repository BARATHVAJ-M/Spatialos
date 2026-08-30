import 'dart:async';
import 'contracts/i_asset_cache.dart';

/// In-memory implementation of IAssetCache for rapid prototyping and testing.
/// In production, this should be backed by a disk cache.
class MemoryAssetCache implements IAssetCache {
  final Map<String, List<int>> _cache = {};

  @override
  Future<bool> hasAsset(String assetId) async {
    return _cache.containsKey(assetId);
  }

  @override
  Future<String> getAssetPath(String assetId) async {
    if (_cache.containsKey(assetId)) {
      return 'memory://$assetId';
    }
    throw Exception('Asset $assetId not found in cache');
  }

  @override
  Future<void> storeAsset(String assetId, List<int> bytes) async {
    _cache[assetId] = bytes;
  }

  @override
  Future<void> clearCache() async {
    _cache.clear();
  }
}
