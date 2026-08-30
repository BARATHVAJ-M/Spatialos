import '../shared/models/user_model.dart';

/// Abstract contract for Authentication operations.
/// Enforces Dependency Inversion so UI controllers never depend on specific backend network clients.
abstract class IAuthRepository {
  Future<UserModel?> getCurrentUser();
  Future<UserModel> login(String email, String password);
  Future<void> logout();
  Future<bool> isAuthenticated();
  Future<bool> updateProfileName(String userId, String name);
}
