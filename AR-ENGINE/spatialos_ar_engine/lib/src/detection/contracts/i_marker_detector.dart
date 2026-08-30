import 'dart:async';

/// Detects specific fiducial markers (like ArUco).
abstract class IMarkerDetector {
  Stream<String> get onMarkerDetected;
}
