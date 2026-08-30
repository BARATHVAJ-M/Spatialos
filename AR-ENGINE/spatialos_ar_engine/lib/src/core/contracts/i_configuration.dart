/// Provides static and dynamic configuration to the engine modules.
abstract class IConfiguration {
  /// Initializes configuration from local/remote sources.
  Future<void> load();

  /// Retrieves a string configuration value.
  String getString(String key, {String defaultValue = ''});

  /// Retrieves a boolean configuration value.
  bool getBool(String key, {bool defaultValue = false});

  /// Retrieves a numeric configuration value.
  double getDouble(String key, {double defaultValue = 0.0});
}
