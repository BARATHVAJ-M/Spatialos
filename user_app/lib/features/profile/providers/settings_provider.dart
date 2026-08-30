import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/settings_repository.dart';

class SettingsState {
  final bool cameraPermission;
  final bool arPlacement;
  final String detectionQuality;
  final String themeMode;
  final bool isLoading;

  const SettingsState({
    this.cameraPermission = true,
    this.arPlacement = true,
    this.detectionQuality = 'Balanced',
    this.themeMode = 'System',
    this.isLoading = true,
  });

  SettingsState copyWith({
    bool? cameraPermission,
    bool? arPlacement,
    String? detectionQuality,
    String? themeMode,
    bool? isLoading,
  }) {
    return SettingsState(
      cameraPermission: cameraPermission ?? this.cameraPermission,
      arPlacement: arPlacement ?? this.arPlacement,
      detectionQuality: detectionQuality ?? this.detectionQuality,
      themeMode: themeMode ?? this.themeMode,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

final settingsProvider = StateNotifierProvider<SettingsNotifier, SettingsState>((ref) {
  return SettingsNotifier(ref);
});

class SettingsNotifier extends StateNotifier<SettingsState> {
  final Ref _ref;

  SettingsNotifier(this._ref) : super(const SettingsState()) {
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final repo = _ref.read(settingsRepositoryProvider);
    final cam = await repo.getCameraPermission();
    final ar = await repo.getArPlacement();
    final dq = await repo.getDetectionQuality();
    final tm = await repo.getThemeMode();

    state = state.copyWith(
      cameraPermission: cam,
      arPlacement: ar,
      detectionQuality: dq,
      themeMode: tm,
      isLoading: false,
    );
  }

  Future<void> updateCameraPermission(bool val) async {
    await _ref.read(settingsRepositoryProvider).setCameraPermission(val);
    state = state.copyWith(cameraPermission: val);
  }

  Future<void> updateArPlacement(bool val) async {
    await _ref.read(settingsRepositoryProvider).setArPlacement(val);
    state = state.copyWith(arPlacement: val);
  }

  Future<void> updateDetectionQuality(String val) async {
    await _ref.read(settingsRepositoryProvider).setDetectionQuality(val);
    state = state.copyWith(detectionQuality: val);
  }

  Future<void> updateThemeMode(String val) async {
    await _ref.read(settingsRepositoryProvider).setThemeMode(val);
    state = state.copyWith(themeMode: val);
  }
}
