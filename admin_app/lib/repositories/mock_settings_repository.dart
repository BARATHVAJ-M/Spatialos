import 'settings_repository_interface.dart';
import '../shared/models/settings_model.dart';

class MockSettingsRepository implements ISettingsRepository {
  SettingsModel _settings = const SettingsModel(
    themeMode: 'DARK',
    cameraQuality: '1080p Full-HD',
    showPlaneDetection: true,
    showAnchorGizmo: true,
    autoSaveCoordinates: true,
  );

  @override
  Future<SettingsModel> getSettings() async {
    await Future.delayed(const Duration(milliseconds: 300));
    return _settings;
  }

  @override
  Future<void> updateSettings(SettingsModel settings) async {
    await Future.delayed(const Duration(milliseconds: 300));
    _settings = settings;
  }
}
