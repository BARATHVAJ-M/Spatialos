import 'package:flutter_test/flutter_test.dart';
import 'package:spatialos_ar_engine/spatialos_ar_engine.dart';
import 'package:spatialos_ar_engine/src/network/contracts/i_network_client.dart';
import 'package:spatialos_ar_engine/src/network/api_gateway.dart';
import 'package:spatialos_ar_engine/src/cache/contracts/i_asset_cache.dart';
import 'package:spatialos_ar_engine/src/cache/memory_asset_cache.dart';
import 'package:spatialos_ar_engine/src/content/asset_manager.dart';
import 'package:spatialos_ar_engine/src/state/engine_store.dart';
import 'dart:async';

class MockNetworkClient implements INetworkClient {
  @override
  Stream connectWebSocket(String path) {
    return const Stream.empty();
  }

  @override
  Future get(String path) async {
    if (path == '/api/scenes/scene_1') {
      return {
        'id': 'scene_1',
        'type': 'test_scene'
      };
    } else if (path == 'https://example.com/asset.png') {
      return [0x89, 0x50, 0x4E, 0x47]; // Fake PNG bytes
    }
    throw Exception('Not found');
  }

  @override
  Future post(String path, body) async {
    return {'success': true};
  }
}

void main() {
  group('Phase E Architecture Tests', () {
    test('Network and Cache Modules download and store assets', () async {
      // Setup
      final networkClient = MockNetworkClient();
      final apiGateway = ApiGateway(networkClient);
      final cache = MemoryAssetCache();
      final assetManager = AssetManager(networkClient, cache);

      // 1. ApiGateway fetches scene JSON
      final sceneData = await apiGateway.fetchScene('scene_1');
      expect(sceneData['id'], 'scene_1');

      // 2. AssetManager loads asset (simulates network download)
      final assetPath = await assetManager.loadAsset('asset_1', 'https://example.com/asset.png');
      expect(assetPath, 'memory://asset_1');

      // 3. Verify it was cached
      final hasAsset = await cache.hasAsset('asset_1');
      expect(hasAsset, true);

      // 4. AssetManager loads asset again (should hit cache)
      final cachedPath = await assetManager.loadAsset('asset_1', 'https://example.com/asset.png');
      expect(cachedPath, 'memory://asset_1');
    });

    test('EngineStore maintains state', () {
      final store = EngineStore();
      
      expect(store.engineState, EngineState.uninitialized);
      
      store.updateEngineState(EngineState.ready);
      expect(store.engineState, EngineState.ready);
      
      store.dispose();
    });
  });
}
