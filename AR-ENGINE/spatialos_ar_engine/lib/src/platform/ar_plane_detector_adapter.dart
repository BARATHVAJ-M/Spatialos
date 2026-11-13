import 'dart:async';
import 'package:ar_flutter_plugin/managers/ar_object_manager.dart';
import '../detection/contracts/i_plane_detector.dart';
import '../detection/models/plane_anchor.dart';
import '../objects/models/transform_3d.dart';

class ARPlaneDetectorAdapter implements IPlaneDetector {
  ARObjectManager? objectManager;
  
  final _planesUpdatedController = StreamController<List<PlaneAnchor>>.broadcast();

  void attachObjectManager(ARObjectManager manager) {
    objectManager = manager;
    // ar_flutter_plugin currently manages planes natively via ARSessionManager config.
  }

  @override
  Stream<List<PlaneAnchor>> get onPlanesUpdated => _planesUpdatedController.stream;

  @override
  Future<List<PlaneAnchor>> hitTest(Vector2 screenPoint) async {
    // ar_flutter_plugin currently handles hit tests internally via tap events (onPlaneOrPointTapped).
    return [];
  }
}
