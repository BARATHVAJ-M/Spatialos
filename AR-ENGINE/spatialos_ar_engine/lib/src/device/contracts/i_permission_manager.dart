/// Manages OS-level permissions (Camera, Location, Storage).
abstract class IPermissionManager {
  Future<bool> requestCameraPermission();
  Future<bool> requestLocationPermission();
  Future<bool> hasAllRequiredPermissions();
}
