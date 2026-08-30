import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

const String kDefaultServerUrl = 'http://192.168.1.6:3000';

class ApiConfigState {
  final String serverUrl;
  final bool isSecure;

  const ApiConfigState({
    required this.serverUrl,
    required this.isSecure,
  });

  String get host {
    try {
      final uri = Uri.parse(serverUrl);
      return uri.host.isNotEmpty ? uri.host : serverUrl;
    } catch (_) {
      return serverUrl;
    }
  }
}

class ApiConfigNotifier extends StateNotifier<ApiConfigState> {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  static const String _storageKey = 'custom_server_url';

  ApiConfigNotifier() : super(const ApiConfigState(serverUrl: kDefaultServerUrl, isSecure: false)) {
    _init();
  }

  Future<void> _init() async {
    if (!kIsWeb) {
      try {
        final saved = await _storage.read(key: _storageKey);
        if (saved != null && saved.isNotEmpty) {
          state = ApiConfigState(serverUrl: saved, isSecure: saved.startsWith('https'));
        }
      } catch (e) {
        debugPrint('Error reading custom server url: $e');
      }
    }
  }

  Future<void> setServerUrl(String newUrl) async {
    final cleanUrl = newUrl.trim();
    state = ApiConfigState(serverUrl: cleanUrl, isSecure: cleanUrl.startsWith('https'));
    if (!kIsWeb) {
      try {
        await _storage.write(key: _storageKey, value: cleanUrl);
      } catch (e) {
        debugPrint('Error writing custom server url: $e');
      }
    }
  }
}

final apiConfigProvider = StateNotifierProvider<ApiConfigNotifier, ApiConfigState>((ref) {
  return ApiConfigNotifier();
});
