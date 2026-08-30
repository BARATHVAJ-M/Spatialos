import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/settings_model.dart';
import '../../../repositories/repository_providers.dart';
import '../../../repositories/settings_repository_interface.dart';

class SettingsNotifier extends StateNotifier<AsyncValue<SettingsModel>> {
  final ISettingsRepository _repository;

  SettingsNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadSettings();
  }

  Future<void> loadSettings() async {
    state = const AsyncValue.loading();
    try {
      final settings = await _repository.getSettings();
      state = AsyncValue.data(settings);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> updateSettings(SettingsModel newSettings) async {
    final oldState = state;
    state = AsyncValue.data(newSettings); // Optimistic update
    try {
      await _repository.updateSettings(newSettings);
    } catch (e) {
      state = oldState; // Revert on failure
    }
  }
}

final settingsProvider = StateNotifierProvider<SettingsNotifier, AsyncValue<SettingsModel>>((ref) {
  final repo = ref.watch(settingsRepositoryProvider);
  return SettingsNotifier(repo);
});
