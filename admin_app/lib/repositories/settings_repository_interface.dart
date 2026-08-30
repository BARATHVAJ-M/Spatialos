import '../shared/models/settings_model.dart';

abstract class ISettingsRepository {
  Future<SettingsModel> getSettings();
  Future<void> updateSettings(SettingsModel settings);
}
