import 'dart:convert';
import '../core/services/api_service.dart';
import '../shared/models/user_model.dart';
import 'auth_repository_interface.dart';

class ApiAuthRepository implements IAuthRepository {
  final ApiService _apiService;
  UserModel? _currentUser;

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
      
      await _apiService.saveUserProfile(jsonEncode(userJson));

      _currentUser = UserModel(
        id: userJson['id'] ?? 'user-1',
        name: userJson['name'] ?? 'Admin User',
        email: userJson['email'] ?? email,
        role: userJson['role'] ?? 'ADMIN',
        status: 'ACTIVE',
        lastLogin: DateTime.now(),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      return _currentUser!;
    }
    throw Exception(resData?['message'] ?? 'Authentication failed against server');
  }

  @override
  Future<void> logout() async {
    await _apiService.clearToken();
    _currentUser = null;
  }

  @override
  Future<UserModel?> getCurrentUser() async {
    final token = await _apiService.getToken();
    if (token != null && token.isNotEmpty) {
      if (_currentUser != null) {
        return _currentUser;
      }
      // Read from local storage since it was saved during login or profile update
      final userStr = await _apiService.getUserProfile();
      if (userStr != null) {
        final userJson = jsonDecode(userStr);
        _currentUser = UserModel(
          id: userJson['id'] ?? 'user-1',
          name: userJson['name'] ?? 'Admin User',
          email: userJson['email'] ?? 'admin@spatialos.com',
          role: userJson['role'] ?? 'ADMIN',
          status: 'ACTIVE',
          lastLogin: DateTime.now(),
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
        return _currentUser;
      }
    }
    return null;
  }

  @override
  Future<bool> isAuthenticated() async {
    final token = await _apiService.getToken();
    return token != null && token.isNotEmpty;
  }

  @override
  Future<bool> updateProfileName(String userId, String name) async {
    try {
      final response = await _apiService.patch('/auth/profile', data: {
        'userId': userId,
        'name': name,
      });
      final resData = response.data;
      if (resData != null && resData['success'] == true) {
        if (_currentUser != null) {
          _currentUser = _currentUser!.copyWith(name: name);
        } else {
          _currentUser = UserModel(
            id: userId,
            name: name,
            email: 'admin@spatialos.com',
            role: 'ADMIN',
            status: 'ACTIVE',
            lastLogin: DateTime.now(),
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          );
        }
        await _apiService.saveUserProfile(jsonEncode({
          'id': _currentUser!.id,
          'name': _currentUser!.name,
          'email': _currentUser!.email,
          'role': _currentUser!.role,
        }));
        return true;
      }
      throw Exception('Server rejected profile update');
    } catch (e) {
      throw Exception(ApiService.formatNetworkError(e));
    }
  }
}
