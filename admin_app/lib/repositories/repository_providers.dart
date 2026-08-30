import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/services/api_service.dart';
import 'auth_repository_interface.dart';
import 'qr_location_repository_interface.dart';
import 'ar_content_repository_interface.dart';
import 'mock_auth_repository.dart';
import 'mock_qr_location_repository.dart';
import 'mock_ar_content_repository.dart';
import 'api_auth_repository.dart';
import 'api_qr_location_repository.dart';
import 'api_ar_content_repository.dart';
import 'settings_repository_interface.dart';
import 'api_settings_repository.dart';
import 'mock_settings_repository.dart';

/// ============================================================================
/// ZERO-RIPPLE-EFFECT ENVIRONMENT CONFIGURATION
/// ============================================================================
/// Set [useLiveDatabase] to `false` for standalone Prototype/Offline prototyping.
/// Set [useLiveDatabase] to `true` when your NestJS + PostgreSQL server is running
/// on http://localhost:3000 (or configured target in ApiService).
///
/// Thanks to our strict Dependency Inversion Architecture, toggling this single
/// boolean swaps the entire database persistence engine without modifying a single
/// line of code across your UI screens, buttons, or State Notifier controllers!
/// ============================================================================
const bool useLiveDatabase = true;

final authRepositoryProvider = Provider<IAuthRepository>((ref) {
  if (useLiveDatabase) {
    final apiService = ref.watch(apiServiceProvider);
    return ApiAuthRepository(apiService);
  } else {
    return MockAuthRepository();
  }
});

final qrLocationRepositoryProvider = Provider<IQrLocationRepository>((ref) {
  if (useLiveDatabase) {
    final apiService = ref.watch(apiServiceProvider);
    return ApiQrLocationRepository(apiService);
  } else {
    return MockQrLocationRepository();
  }
});

final arContentRepositoryProvider = Provider<IArContentRepository>((ref) {
  if (useLiveDatabase) {
    final apiService = ref.watch(apiServiceProvider);
    return ApiArContentRepository(apiService);
  } else {
    return MockArContentRepository();
  }
});

final settingsRepositoryProvider = Provider<ISettingsRepository>((ref) {
  if (useLiveDatabase) {
    final apiService = ref.watch(apiServiceProvider);
    return ApiSettingsRepository(apiService);
  } else {
    return MockSettingsRepository();
  }
});
