import 'dart:async';

/// Detects specific 2D image targets in the physical world.
abstract class IImageDetector {
  Future<void> registerTargetImage(String imageId, List<int> imageBytes);
  Stream<String> get onImageDetected;
}
