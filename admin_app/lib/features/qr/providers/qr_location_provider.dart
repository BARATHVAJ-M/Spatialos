import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/qr_location_model.dart';
import '../../../repositories/repository_providers.dart';
import '../../../repositories/qr_location_repository_interface.dart';

class QrLocationsNotifier extends StateNotifier<AsyncValue<List<QrLocationModel>>> {
  final IQrLocationRepository _repository;

  QrLocationsNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadLocations();
  }

  Future<void> loadLocations() async {
    state = const AsyncValue.loading();
    try {
      final list = await _repository.getAllLocations();
      state = AsyncValue.data(list);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<QrLocationModel?> createLocation({
    required String locationName,
    required String description,
    required String building,
    required String floor,
    required String room,
  }) async {
    try {
      final newLoc = await _repository.createLocation(
        locationName: locationName,
        description: description,
        building: building,
        floor: floor,
        room: room,
      );
      await loadLocations(); // Refresh list
      return newLoc;
    } catch (e) {
      return null;
    }
  }

  Future<void> updateLocation(QrLocationModel location) async {
    await _repository.updateLocation(location);
    await loadLocations();
  }

  Future<void> deleteLocation(String id) async {
    await _repository.deleteLocation(id);
    await loadLocations();
  }

  Future<void> deleteLocationContent(String id) async {
    await _repository.deleteLocationContent(id);
    await loadLocations();
  }

  Future<Map<String, dynamic>> fetchScenePreview(String qrCode) async {
    return _repository.fetchScenePreview(qrCode);
  }
}

final qrLocationsProvider = StateNotifierProvider<QrLocationsNotifier, AsyncValue<List<QrLocationModel>>>((ref) {
  final repo = ref.watch(qrLocationRepositoryProvider);
  return QrLocationsNotifier(repo);
});
