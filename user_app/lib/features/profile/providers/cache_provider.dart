import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/cache_repository.dart';

final cacheProvider = StateNotifierProvider<CacheNotifier, AsyncValue<int>>((ref) {
  return CacheNotifier(ref);
});

class CacheNotifier extends StateNotifier<AsyncValue<int>> {
  final Ref _ref;

  CacheNotifier(this._ref) : super(const AsyncValue.loading()) {
    refreshCacheSize();
  }

  Future<void> refreshCacheSize() async {
    state = const AsyncValue.loading();
    try {
      final size = await _ref.read(cacheRepositoryProvider).getCacheSize();
      state = AsyncValue.data(size);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<Map<String, dynamic>> clearCache() async {
    try {
      final result = await _ref.read(cacheRepositoryProvider).clearTempCache();
      await refreshCacheSize();
      return result;
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }
}
