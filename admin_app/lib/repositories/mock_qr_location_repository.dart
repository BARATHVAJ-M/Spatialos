import 'package:uuid/uuid.dart';
import 'qr_location_repository_interface.dart';
import '../shared/models/qr_location_model.dart';

/// Mock in-memory implementation of QR Location Repository preloaded with initial real-world examples.
class MockQrLocationRepository implements IQrLocationRepository {
  final List<QrLocationModel> _locations = [
    QrLocationModel(
      id: const Uuid().v4(),
      qrCode: 'LOC-BLOCK-A-101',
      locationName: 'IT Notice Board',
      description: 'Main notification bulletin in IT Dept lobby',
      building: 'Block A',
      floor: 'Ground Floor',
      room: 'Lobby 101',
      latitude: 12.9716,
      longitude: 77.5946,
      createdBy: 'admin-uuid-001',
      status: 'ACTIVE',
      createdAt: DateTime.now().subtract(const Duration(days: 5)),
      updatedAt: DateTime.now().subtract(const Duration(days: 1)),
    ),
    QrLocationModel(
      id: const Uuid().v4(),
      qrCode: 'LOC-LIBRARY-402',
      locationName: 'Central Library Hall',
      description: 'Interactive AR floor plan and catalog guide',
      building: 'Library Block',
      floor: '4th Floor',
      room: 'Hall 402',
      createdBy: 'admin-uuid-001',
      status: 'ACTIVE',
      createdAt: DateTime.now().subtract(const Duration(days: 3)),
      updatedAt: DateTime.now(),
    ),
  ];

  @override
  Future<List<QrLocationModel>> getAllLocations() async {
    await Future.delayed(const Duration(milliseconds: 200));
    return List.unmodifiable(_locations);
  }

  @override
  Future<QrLocationModel?> getLocationById(String id) async {
    await Future.delayed(const Duration(milliseconds: 100));
    try {
      return _locations.firstWhere((l) => l.id == id || l.qrCode == id);
    } catch (_) {
      return null;
    }
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
    await Future.delayed(const Duration(milliseconds: 500));
    final uuid = const Uuid().v4();
    final cleanBuilding = building.trim().toUpperCase().replaceAll(' ', '-');
    final cleanRoom = room.trim().toUpperCase().replaceAll(' ', '-');
    
    final newLoc = QrLocationModel(
      id: uuid,
      qrCode: 'LOC-$cleanBuilding-$cleanRoom',
      locationName: locationName,
      description: description,
      building: building,
      floor: floor,
      room: room,
      latitude: latitude,
      longitude: longitude,
      createdBy: 'admin-uuid-001',
      status: 'ACTIVE',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
    _locations.insert(0, newLoc);
    return newLoc;
  }

  @override
  Future<void> updateLocation(QrLocationModel location) async {
    final index = _locations.indexWhere((l) => l.id == location.id);
    if (index != -1) {
      _locations[index] = location.copyWith();
    }
  }

  @override
  Future<void> deleteLocation(String id) async {
    _locations.removeWhere((l) => l.id == id);
  }

  @override
  Future<void> deleteLocationContent(String id) async {
    // Mock no-op for content-only deletion
  }

  @override
  Future<Map<String, dynamic>> fetchScenePreview(String qrCode) async {
    return {
      'hasImages': true,
      'hasVideos': false,
      'hasText': true,
      'textContent': 'Sample mock scene preview data.',
    };
  }
}
