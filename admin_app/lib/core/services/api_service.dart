import 'dart:io';
import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/api_config.dart';

/// Riverpod provider exposing centralized ApiService reactive to ApiConfig network changes
final apiServiceProvider = Provider<ApiService>((ref) {
  final config = ref.watch(apiConfigProvider);
  return ApiService(baseUrl: config.serverUrl);
});

/// Centralized API service wrapping Dio with global authentication headers and error interceptors.
class ApiService {
  final Dio _dio;
  final FlutterSecureStorage _storage;
  static String? _inMemoryToken; // Used on Web over HTTP (Wi-Fi testing) to bypass insecure context restrictions

  String get baseUrl => _dio.options.baseUrl;

  ApiService({String? baseUrl}) 
      : _dio = Dio(BaseOptions(
          baseUrl: baseUrl ?? kDefaultServerUrl,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 45),
          sendTimeout: const Duration(seconds: 45),
          headers: {'Content-Type': 'application/json'},
        )),
        _storage = const FlutterSecureStorage() {
    if (!kIsWeb) {
      try {
        _dio.httpClientAdapter = IOHttpClientAdapter(
          createHttpClient: () {
            final client = HttpClient();
            // Allow locally generated mkcert / self-signed SSL certificates strictly during debug / Wi-Fi testing (kDebugMode)
            client.badCertificateCallback = (X509Certificate cert, String host, int port) => kDebugMode;
            return client;
          },
        );
        loadCustomBaseUrl();
      } catch (e) {
        debugPrint('Failed to attach IOHttpClientAdapter: $e');
      }
    }
    _setupInterceptors();
  }

  Future<void> loadCustomBaseUrl() async {
    try {
      final saved = await _storage.read(key: 'custom_server_url');
      if (saved != null && saved.isNotEmpty) {
        _dio.options.baseUrl = saved;
      }
    } catch (_) {}
  }

  Future<void> updateBaseUrl(String newUrl) async {
    _dio.options.baseUrl = newUrl;
    if (!kIsWeb) {
      await _storage.write(key: 'custom_server_url', value: newUrl);
    }
  }

  void _setupInterceptors() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await getToken();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        final formattedMessage = formatNetworkError(e);
        final newError = DioException(
          requestOptions: e.requestOptions,
          response: e.response,
          type: e.type,
          error: formattedMessage,
          message: formattedMessage,
        );
        return handler.next(newError);
      },
    ));
  }

  /// Transforms raw socket network failures (errno 113 / connection refused) into actionable developer guidance.
  static String formatNetworkError(dynamic error) {
    if (error is DioException) {
      if (error.response?.data != null && error.response?.data is Map) {
        final msg = error.response?.data['message'] ?? error.response?.data['error'];
        if (msg != null && msg.toString().isNotEmpty) {
          return msg.toString();
        }
      }
      final errStr = error.toString().toLowerCase();
      if (errStr.contains('113') || errStr.contains('no route to host')) {
        return "🌐 Wi-Fi Router block or IP change detected (errno 113).\n👉 Verify your Laptop IP in 'Configure Server URL' and run setup_dev_server.ps1 to open Windows Firewall.";
      }
      if (error.type == DioExceptionType.connectionError || errStr.contains('connection refused')) {
        return "🚫 Server unreachable at target URL.\n👉 Make sure NestJS backend is running on your laptop and your smartphone is connected to the same Wi-Fi network.";
      }
      if (error.type == DioExceptionType.connectionTimeout || error.type == DioExceptionType.receiveTimeout) {
        return "⏱️ Connection timed out. Check signal strength and laptop firewall settings.";
      }
      if (error.message != null && error.message!.isNotEmpty) {
        return error.message!;
      }
    }
    return error.toString().replaceAll('Exception: ', '').replaceAll('DioException: ', '');
  }

  /// Establishes a connection heartbeat to verify server reachability.
  Future<bool> checkHeartbeat() async {
    try {
      final response = await _dio.get('/health/live', options: Options(
        sendTimeout: const Duration(seconds: 3),
        receiveTimeout: const Duration(seconds: 3),
      ));
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Heartbeat failed: ${formatNetworkError(e)}');
      return false;
    }
  }

  Future<Response<T>> get<T>(String path, {Map<String, dynamic>? queryParameters}) {
    return _dio.get<T>(path, queryParameters: queryParameters);
  }

  Future<Response<T>> post<T>(String path, {dynamic data, Map<String, dynamic>? queryParameters}) {
    return _dio.post<T>(path, data: data, queryParameters: queryParameters);
  }

  Future<Response<T>> postFormData<T>(String path, {required FormData data, Map<String, dynamic>? queryParameters}) {
    return _dio.post<T>(path, data: data, queryParameters: queryParameters);
  }

  Future<Response<T>> put<T>(String path, {dynamic data, Map<String, dynamic>? queryParameters}) {
    return _dio.put<T>(path, data: data, queryParameters: queryParameters);
  }

  Future<Response<T>> patch<T>(String path, {dynamic data, Map<String, dynamic>? queryParameters}) {
    return _dio.patch<T>(path, data: data, queryParameters: queryParameters);
  }

  Future<Response<T>> delete<T>(String path, {Map<String, dynamic>? queryParameters}) {
    return _dio.delete<T>(path, queryParameters: queryParameters);
  }

  Future<String?> getToken() async {
    if (kIsWeb) return _inMemoryToken;
    return _storage.read(key: 'jwt_token');
  }

  Future<void> saveToken(String token) async {
    if (kIsWeb) {
      _inMemoryToken = token;
    } else {
      await _storage.write(key: 'jwt_token', value: token);
    }
  }

  Future<void> saveUserProfile(String jsonStr) async {
    if (!kIsWeb) {
      await _storage.write(key: 'user_profile', value: jsonStr);
    }
  }

  Future<String?> getUserProfile() async {
    if (!kIsWeb) {
      return await _storage.read(key: 'user_profile');
    }
    return null;
  }

  Future<void> clearToken() async {
    if (kIsWeb) {
      _inMemoryToken = null;
    } else {
      await _storage.delete(key: 'jwt_token');
    }
  }
}
