import 'dart:io';
import 'package:flutter/painting.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';

final cacheRepositoryProvider = Provider<CacheRepository>((ref) {
  return CacheRepository();
});

class CacheRepository {
  /// Returns total cache size in bytes
  Future<int> getCacheSize() async {
    int totalSize = 0;
    try {
      final tempDir = await getTemporaryDirectory();
      if (tempDir.existsSync()) {
        totalSize += _calculateDirectorySize(tempDir);
      }
      return totalSize;
    } catch (e) {
      return 0;
    }
  }

  /// Calculates size of a directory recursively
  int _calculateDirectorySize(Directory dir) {
    int size = 0;
    try {
      if (dir.existsSync()) {
        dir.listSync(recursive: true, followLinks: false).forEach((FileSystemEntity entity) {
          if (entity is File) {
            size += entity.lengthSync();
          }
        });
      }
    } catch (e) {
      // Ignore read errors
    }
    return size;
  }

  /// Clears temporary cache (images, videos, temporary downloads)
  Future<Map<String, dynamic>> clearTempCache() async {
    int bytesFreed = 0;
    int filesRemoved = 0;

    try {
      // Clear Flutter RAM image cache
      PaintingBinding.instance.imageCache.clear();
      PaintingBinding.instance.imageCache.clearLiveImages();

      final tempDir = await getTemporaryDirectory();
      if (tempDir.existsSync()) {
        final entities = tempDir.listSync(recursive: true, followLinks: false);
        for (var entity in entities) {
          if (entity is File) {
            bytesFreed += entity.lengthSync();
            entity.deleteSync();
            filesRemoved++;
          }
        }
      }

      return {
        'success': true,
        'bytesFreed': bytesFreed,
        'filesRemoved': filesRemoved,
      };
    } catch (e) {
      throw Exception('Failed to clear cache: $e');
    }
  }
}
