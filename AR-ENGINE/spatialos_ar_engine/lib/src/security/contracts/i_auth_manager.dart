import 'dart:async';

/// Authenticates the user and authorizes permissions for specific Scene/App access.
abstract class IAuthManager {
  Future<bool> login(String credentials);
  Future<void> logout();
  bool get isAuthenticated;
  Future<bool> hasPermission(String permissionNode);
}
