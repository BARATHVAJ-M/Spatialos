/// Provides access to the device camera stream and intrinsic properties.
abstract class ICameraProvider {
  Future<void> requestPermission();
  Future<void> startCamera();
  Future<void> stopCamera();
  bool get isCameraAvailable;
  Stream<dynamic> get onFrameCaptured;
}
