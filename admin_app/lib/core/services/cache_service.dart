import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';

abstract class CacheProvider {
  Future<void> clearAppCache();
  Future<String> calculateCacheSize();
}

class DefaultCacheProvider implements CacheProvider {
  @override
  Future<void> clearAppCache() async {
    if (kIsWeb) return;
    
    try {
      final tempDir = await getTemporaryDirectory();
      if (tempDir.existsSync()) {
        final List<FileSystemEntity> children = tempDir.listSync();
        for (final FileSystemEntity child in children) {
          // DO NOT delete standard OS files/directories blindly.
          // We only delete specific folders or files belonging to the app's direct caching mechanisms.
          // For instance, we skip deleting parent OS specific hidden folders if they exist.
          final basename = child.uri.pathSegments.lastWhere((s) => s.isNotEmpty, orElse: () => '');
          if (basename.startsWith('.')) continue; // skip hidden system files
          
          if (child is File) {
            child.deleteSync();
          } else if (child is Directory) {
            // Delete subdirectories entirely
            child.deleteSync(recursive: true);
          }
        }
      }
    } catch (e) {
      debugPrint('Error clearing specific app cache: $e');
    }
  }

  @override
  Future<String> calculateCacheSize() async {
    if (kIsWeb) return '0.0 MB';
    
    try {
      final tempDir = await getTemporaryDirectory();
      int totalSize = 0;
      if (tempDir.existsSync()) {
        final List<FileSystemEntity> children = tempDir.listSync(recursive: true);
        for (final FileSystemEntity child in children) {
          if (child is File) {
            totalSize += child.lengthSync();
          }
        }
      }
      
      if (totalSize < 1024) {
        return '$totalSize B';
      } else if (totalSize < 1024 * 1024) {
        return '${(totalSize / 1024).toStringAsFixed(1)} KB';
      } else {
        return '${(totalSize / (1024 * 1024)).toStringAsFixed(1)} MB';
      }
    } catch (e) {
      return 'Unknown Size';
    }
  }
}
