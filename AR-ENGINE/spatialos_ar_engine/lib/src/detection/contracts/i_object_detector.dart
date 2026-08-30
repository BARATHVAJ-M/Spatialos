import 'dart:async';

/// Detects and classifies 3D physical objects (e.g. Chair, Table, Cup).
abstract class IObjectDetector {
  Stream<Map<String, dynamic>> get onObjectDetected;
}
