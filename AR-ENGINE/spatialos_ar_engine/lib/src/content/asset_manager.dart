import 'dart:async';
import '../cache/contracts/i_asset_cache.dart';
import '../network/contracts/i_network_client.dart';

/// The central repository for requesting assets.
/// It uses the NetworkClient to download files and IAssetCache to store them.
class AssetManager {
  final INetworkClient _networkClient;
  final IAssetCache _assetCache;

  AssetManager(this._networkClient, this._assetCache);

  /// Requests an asset, using the cache if available, or downloading it if not.
  Future<String> loadAsset(String assetId, String remoteUrl) async {
    if (await _assetCache.hasAsset(assetId)) {
      return await _assetCache.getAssetPath(assetId);
    }

    // Download the asset (mocked network return of bytes)
    final response = await _networkClient.get(remoteUrl);
    
    if (response is List<int>) {
      await _assetCache.storeAsset(assetId, response);
      return await _assetCache.getAssetPath(assetId);
    }
    
    throw Exception('Failed to download asset $assetId');
  }

  /// Clears all cached assets
  Future<void> clear() async {
    await _assetCache.clearCache();
  }
}
