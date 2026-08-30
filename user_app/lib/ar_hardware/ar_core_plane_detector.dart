import 'dart:async';
import 'package:vector_math/vector_math_64.dart';
import 'package:spatialos_ar_engine/spatialos_ar_engine.dart';

class ArCorePlaneDetector implements IPhysicalPlaneDetector {
  final StreamController<List<PhysicalPlane>> _planesController = StreamController<List<PhysicalPlane>>.broadcast();

  @override
  Stream<List<PhysicalPlane>> get onPlanesUpdated => _planesController.stream;

  @override
  Future<void> startDetecting() async {}

  @override
  Future<void> stopDetecting() async {}

  @override
  Future<List<PhysicalPlane>> hitTest(Vector2 screenPoint) async {
    return [];
  }
}
