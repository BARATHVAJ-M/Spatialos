import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/services/api_service.dart';
import '../shared/models/user_model.dart';
import 'auth_repository_interface.dart';

class ApiAuthRepository implements IAuthRepository {
  final ApiService _apiService;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  UserModel? _currentUser;
  static const String _userStorageKey = 'cached_user_profile';

  ApiAuthRepository(this._apiService);

  @override
  Future<UserModel> login(String email, String password) async {
    final response = await _apiService.post('/auth/login', data: {
      'email': email,
      'password': password,
    });

    final resData = response.data;
    if (resData != null && resData['success'] == true) {
      final token = resData['data']['token'];
      final userJson = resData['data']['user'];
      await _apiService.saveToken(token);

      _currentUser = UserModel(
        id: userJson['id'] ?? 'user-1',
        name: userJson['name'] ?? 'SpatialOS User',
        email: userJson['email'] ?? email,
        role: userJson['role'] ?? 'USER',
        status: 'ACTIVE',
        lastLogin: DateTime.now(),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      await _cacheUser(_currentUser!);
      return _currentUser!;
    }
    throw Exception(resData?['message'] ?? 'Authentication failed against server');
  }

  @override
  Future<UserModel> register(String name, String email, String password) async {
    final response = await _apiService.post('/auth/register', data: {
      'name': name,
      'email': email,
      'password': password,
    });

    final resData = response.data;
    if (resData != null && resData['success'] == true) {
      final token = resData['data']['token'];
      final userJson = resData['data']['user'];
      await _apiService.saveToken(token);

      _currentUser = UserModel(
        id: userJson['id'] ?? 'user-1',
        name: userJson['name'] ?? name,
        email: userJson['email'] ?? email,
        role: userJson['role'] ?? 'USER',
        status: 'ACTIVE',
        lastLogin: DateTime.now(),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      await _cacheUser(_currentUser!);
      return _currentUser!;
    }
    throw Exception(resData?['message'] ?? 'Registration failed against server');
  }

  Future<void> _cacheUser(UserModel user) async {
    try {
      final str = jsonEncode(user.toJson());
      await _storage.write(key: _userStorageKey, value: str);
    } catch (_) {}
  }

  @override
  Future<void> logout() async {
    await _apiService.clearToken();
    try {
      await _storage.delete(key: _userStorageKey);
    } catch (_) {}
    _currentUser = null;
  }

  @override
  Future<UserModel?> getCurrentUser() async {
    final token = await _apiService.getToken();
    if (token != null && token.isNotEmpty) {
      if (_currentUser != null) return _currentUser;
      try {
        final cached = await _storage.read(key: _userStorageKey);
        if (cached != null && cached.isNotEmpty) {
          final map = jsonDecode(cached);
          _currentUser = UserModel.fromJson(map);
          return _currentUser;
        }
      } catch (_) {}
    }
    return null;
  }

  @override
  Future<bool> isAuthenticated() async {
    final token = await _apiService.getToken();
    return token != null && token.isNotEmpty;
  }
}
