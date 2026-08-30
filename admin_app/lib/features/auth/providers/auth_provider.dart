import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/api_service.dart';
import '../../../shared/models/user_model.dart';
import '../../../repositories/repository_providers.dart';
import '../../../repositories/auth_repository_interface.dart';

class AuthState {
  final UserModel? user;
  final bool isLoading;
  final String? errorMessage;

  const AuthState({this.user, this.isLoading = false, this.errorMessage});

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    UserModel? user,
    bool? isLoading,
    String? errorMessage,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final IAuthRepository _repository;

  AuthNotifier(this._repository) : super(const AuthState()) {
    _checkInitialAuth();
  }

  Future<void> _checkInitialAuth() async {
    state = state.copyWith(isLoading: true);
    final user = await _repository.getCurrentUser();
    state = AuthState(user: user, isLoading: false);
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final user = await _repository.login(email, password);
      state = AuthState(user: user, isLoading: false);
      return true;
    } catch (e) {
      state = AuthState(user: null, isLoading: false, errorMessage: ApiService.formatNetworkError(e));
      return false;
    }
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    await _repository.logout();
    state = const AuthState(user: null, isLoading: false);
  }

  Future<bool> updateProfileName(String name) async {
    if (state.user == null) return false;
    final success = await _repository.updateProfileName(state.user!.id, name);
    if (success) {
      state = state.copyWith(user: state.user!.copyWith(name: name));
    }
    return success;
  }
}

final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authRepo = ref.watch(authRepositoryProvider);
  return AuthNotifier(authRepo);
});
