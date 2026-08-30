import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final settingsRepositoryProvider = Provider<SettingsRepository>((ref) {
  return SettingsRepository();
});

class SettingsRepository {
  static const _keyCameraPermission = 'settings_camera_permission';
  static const _keyArPlacement = 'settings_ar_placement';
  static const _keyDetectionQuality = 'settings_detection_quality';
  static const _keyThemeMode = 'settings_theme_mode';

  Future<SharedPreferences> get _prefs async => await SharedPreferences.getInstance();

  Future<bool> getCameraPermission() async {
    final prefs = await _prefs;
    return prefs.getBool(_keyCameraPermission) ?? true;
  }

  Future<void> setCameraPermission(bool value) async {
    final prefs = await _prefs;
    await prefs.setBool(_keyCameraPermission, value);
  }

  Future<bool> getArPlacement() async {
    final prefs = await _prefs;
    return prefs.getBool(_keyArPlacement) ?? true;
  }

  Future<void> setArPlacement(bool value) async {
    final prefs = await _prefs;
    await prefs.setBool(_keyArPlacement, value);
  }

  Future<String> getDetectionQuality() async {
    final prefs = await _prefs;
    return prefs.getString(_keyDetectionQuality) ?? 'Balanced';
  }

  Future<void> setDetectionQuality(String value) async {
    final prefs = await _prefs;
    await prefs.setString(_keyDetectionQuality, value);
  }

  Future<String> getThemeMode() async {
    final prefs = await _prefs;
    return prefs.getString(_keyThemeMode) ?? 'System';
  }

  Future<void> setThemeMode(String value) async {
    final prefs = await _prefs;
    await prefs.setString(_keyThemeMode, value);
  }
}
