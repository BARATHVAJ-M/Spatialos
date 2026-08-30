import '../../core/services/api_service.dart';
import '../../shared/models/qr_location_model.dart';
import 'qr_location_repository_interface.dart';

class ApiQrLocationRepository implements IQrLocationRepository {
  final ApiService _apiService;

  ApiQrLocationRepository(this._apiService);

  @override
  Future<List<QrLocationModel>> getAllLocations() async {
    try {
      final response = await _apiService.get('/locations');
      final data = response.data;
      if (data != null && data['success'] == true && data['data'] is List) {
        return (data['data'] as List)
            .map((json) => QrLocationModel.fromJson(json))
            .toList();
      }
    } catch (e) {
      throw Exception(ApiService.formatNetworkError(e));
    }
    return [];
  }

  @override
  Future<QrLocationModel?> getLocationById(String id) async {
    try {
      final response = await _apiService.get('/qr/$id');
      final data = response.data;
      if (data != null && data['success'] == true && data['data'] != null) {
        return QrLocationModel.fromJson(data['data']);
      }
    } catch (e) {
      throw Exception(ApiService.formatNetworkError(e));
    }
    return null;
  }

  @override
  Future<QrLocationModel> createLocation({
    required String locationName,
    required String description,
    required String building,
    required String floor,
    required String room,
    double? latitude,
    double? longitude,
  }) async {
    final response = await _apiService.post('/qr', data: {
      'locationName': locationName,
      'description': description,
      'building': building,
      'floor': floor,
      'room': room,
      'latitude': latitude,
      'longitude': longitude,
    });
    final res = response.data;
    if (res != null && res['success'] == true && res['data'] != null) {
      final locJson = res['data']['location'] ?? res['data'];
      return QrLocationModel.fromJson(locJson);
    }
    throw Exception(res?['message'] ?? 'Failed to generate QR anchor on server');
  }

  @override
  Future<void> updateLocation(QrLocationModel location) async {
    await _apiService.put('/locations/${location.id}', data: location.toJson());
  }

  @override
  Future<void> deleteLocation(String id) async {
    await _apiService.delete('/locations/$id');
  }

  @override
  Future<void> deleteLocationContent(String id) async {
    await _apiService.delete('/locations/$id/content');
  }

  @override
  Future<Map<String, dynamic>> fetchScenePreview(String qrCode) async {
    try {
      final response = await _apiService.get('/placements/preview?qrCode=$qrCode');
      final data = response.data;
      if (data != null && data['success'] == true) {
        return data['data'];
      }
    } catch (e) {
      throw Exception(ApiService.formatNetworkError(e));
    }
    return {};
  }
}
