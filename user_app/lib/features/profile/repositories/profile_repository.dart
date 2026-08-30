import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/api_service.dart';
import '../../../shared/models/user_model.dart';

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  final apiService = ref.read(apiServiceProvider);
  return ProfileRepository(apiService);
});

class ProfileRepository {
  final ApiService _apiService;

  ProfileRepository(this._apiService);

  Future<UserModel> updateProfileName(String userId, String newName) async {
    try {
      final response = await _apiService.patch('/auth/profile', data: {
        'userId': userId,
        'name': newName,
      });

      if (response.data['success'] == true) {
        return UserModel.fromJson(response.data['data']);
      } else {
        throw Exception('Failed to update profile');
      }
    } on DioException catch (e) {
      final errorMsg = e.response?.data['message'] ?? e.message ?? 'Network error';
      throw Exception(errorMsg);
    } catch (e) {
      throw Exception('Unexpected error: $e');
    }
  }
}
