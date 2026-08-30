import 'auth_repository_interface.dart';
import '../shared/models/user_model.dart';

/// Clean Mock implementation of Authentication Repository for Prototype V1 & instant offline execution.
class MockAuthRepository implements IAuthRepository {
  UserModel? _currentUser;

  MockAuthRepository() {
    _currentUser = UserModel(
      id: 'admin-uuid-001',
      name: 'Admin User',
      email: 'admin@spatialos.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: DateTime(2026, 1, 1),
      updatedAt: DateTime.now(),
    );
  }

  @override
  Future<UserModel?> getCurrentUser() async {
    await Future.delayed(const Duration(milliseconds: 300));
    return _currentUser;
  }

  @override
  Future<UserModel> login(String email, String password) async {
    await Future.delayed(const Duration(milliseconds: 800)); // Simulate network auth delay
    if (email == 'admin@spatialos.com' && password == 'admin123') {
      _currentUser = _currentUser?.copyWith(lastLogin: DateTime.now());
      return _currentUser!;
    }
    throw Exception('Invalid email or password. Please try again.');
  }

  @override
  Future<void> logout() async {
    await Future.delayed(const Duration(milliseconds: 200));
    _currentUser = null;
  }

  @override
  Future<bool> isAuthenticated() async {
    return _currentUser != null;
  }

  @override
  Future<bool> updateProfileName(String userId, String name) async {
    await Future.delayed(const Duration(milliseconds: 300));
    if (_currentUser != null) {
      _currentUser = _currentUser!.copyWith(name: name);
      return true;
    }
    return false;
  }
}
