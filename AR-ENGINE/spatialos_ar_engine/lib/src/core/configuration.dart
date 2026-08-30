import 'contracts/i_configuration.dart';

class Configuration implements IConfiguration {
  final Map<String, dynamic> _config = {};

  @override
  Future<void> load() async {
    // In a real implementation, this would load from a local JSON file or remote server.
    // For V1, we seed it with defaults.
    _config['environment'] = 'development';
    _config['version'] = '1.0.0';
    _config['log_level'] = 'debug';
  }

  @override
  String getString(String key, {String defaultValue = ''}) {
    return _config[key] as String? ?? defaultValue;
  }

  @override
  bool getBool(String key, {bool defaultValue = false}) {
    return _config[key] as bool? ?? defaultValue;
  }

  @override
  double getDouble(String key, {double defaultValue = 0.0}) {
    final val = _config[key];
    if (val is double) return val;
    if (val is int) return val.toDouble();
    return defaultValue;
  }
}
