import '../../core/services/api_service.dart';
import 'settings_repository_interface.dart';
import '../shared/models/settings_model.dart';

class ApiSettingsRepository implements ISettingsRepository {
  final ApiService _apiService;

  ApiSettingsRepository(this._apiService);

  @override
  Future<SettingsModel> getSettings() async {
    try {
      final response = await _apiService.get('/settings');
      final data = response.data;
      if (data != null && data['success'] == true && data['data'] != null) {
        return SettingsModel.fromJson(data['data']);
      }
    } catch (e) {
      throw Exception(ApiService.formatNetworkError(e));
    }
    throw Exception('Failed to load settings');
  }

  @override
  Future<void> updateSettings(SettingsModel settings) async {
    await _apiService.patch('/settings', data: settings.toJson());
  }
}
