/// Determines when to evict items from the cache.
class CachePolicy {
  final int maxMemoryBytes;
  final int maxDiskBytes;
  final Duration maxAge;

  const CachePolicy({
    required this.maxMemoryBytes,
    required this.maxDiskBytes,
    required this.maxAge,
  });
}
