import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/services/api_service.dart';
import 'auth_repository_interface.dart';
import 'ar_content_repository_interface.dart';
import 'api_auth_repository.dart';
import 'api_ar_content_repository.dart';

final authRepositoryProvider = Provider<IAuthRepository>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return ApiAuthRepository(apiService);
});

final arContentRepositoryProvider = Provider<IArContentRepository>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return ApiArContentRepository(apiService);
});
