import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../repositories/profile_repository.dart';

final profileProvider = StateNotifierProvider<ProfileNotifier, AsyncValue<void>>((ref) {
  return ProfileNotifier(ref);
});

class ProfileNotifier extends StateNotifier<AsyncValue<void>> {
  final Ref _ref;
  
  ProfileNotifier(this._ref) : super(const AsyncValue.data(null));

  Future<bool> updateName(String newName) async {
    final user = _ref.read(authStateProvider).user;
    if (user == null) return false;

    state = const AsyncValue.loading();
    try {
      final updatedUser = await _ref.read(profileRepositoryProvider).updateProfileName(user.id, newName);
      
      // Update the global auth state with the new user model so UI reflects everywhere
      _ref.read(authStateProvider.notifier).updateUser(updatedUser);
      
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }
}
