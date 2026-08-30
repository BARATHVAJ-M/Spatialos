import '../shared/models/qr_location_model.dart';

/// Abstract contract for managing real-world QR location anchors.
abstract class IQrLocationRepository {
  Future<List<QrLocationModel>> getAllLocations();
  Future<QrLocationModel?> getLocationById(String id);
  Future<QrLocationModel> createLocation({
    required String locationName,
    required String description,
    required String building,
    required String floor,
    required String room,
    double? latitude,
    double? longitude,
  });
  Future<void> updateLocation(QrLocationModel location);
  Future<void> deleteLocation(String id);
  Future<void> deleteLocationContent(String id);
  Future<Map<String, dynamic>> fetchScenePreview(String qrCode);
}
