import 'dart:async';

/// Caches large assets to the device's persistent storage.
abstract class IDiskCache {
  Future<void> writeToDisk(String key, List<int> data);
  Future<List<int>?> readFromDisk(String key);
  Future<void> clearDiskCache();
}
