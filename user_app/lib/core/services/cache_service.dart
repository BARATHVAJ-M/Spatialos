import 'dart:convert';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:path_provider/path_provider.dart';
import 'package:isar/isar.dart';

part 'cache_service.g.dart';

@collection
class CachedScene {
  Id id = Isar.autoIncrement;
  
  @Index(unique: true, replace: true)
  late String qrId;
  
  late String jsonPayload;
  late DateTime cachedAt;
}

class CacheService {
  static final CacheService _instance = CacheService._internal();
  factory CacheService() => _instance;
  CacheService._internal();

  Isar? _isar;
  DefaultCacheManager? _assetCache;
  DefaultCacheManager get assetCache => _assetCache ??= DefaultCacheManager();

  Future<void> init() async {
    final dir = await getApplicationDocumentsDirectory();
    _isar = await Isar.open(
      [CachedSceneSchema],
      directory: dir.path,
    );
  }

  Future<void> saveScene(String qrId, Map<String, dynamic> data) async {
    if (_isar == null) return;
    
    final scene = CachedScene()
      ..qrId = qrId
      ..jsonPayload = jsonEncode(data)
      ..cachedAt = DateTime.now();

    await _isar!.writeTxn(() async {
      await _isar!.cachedScenes.put(scene);
    });
  }

  Future<Map<String, dynamic>?> getScene(String qrId) async {
    if (_isar == null) return null;
    
    final scene = await _isar!.cachedScenes.where().qrIdEqualTo(qrId).findFirst();
    if (scene == null) return null;
    
    return jsonDecode(scene.jsonPayload) as Map<String, dynamic>;
  }

  Future<String?> cacheAsset(String url) async {
    try {
      final file = await assetCache.getSingleFile(url);
      return file.path;
    } catch (e) {
      return null;
    }
  }
}
