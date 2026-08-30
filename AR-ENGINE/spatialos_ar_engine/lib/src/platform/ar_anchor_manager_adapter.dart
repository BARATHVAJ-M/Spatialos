import 'dart:async';
import 'package:ar_flutter_plugin_flutterflow/managers/ar_anchor_manager.dart';
import 'package:ar_flutter_plugin_flutterflow/models/ar_anchor.dart';
import 'package:vector_math/vector_math_64.dart' as vector_math;
import '../spatial/contracts/i_anchor_contract.dart';
import '../spatial/models/spatial_anchor.dart';
import '../objects/models/transform_3d.dart';

class ARAnchorManagerAdapter implements IAnchorContract {
  ARAnchorManager? _anchorManager;
  final Map<String, ARPlaneAnchor> _nativeAnchors = {};
  
  final _anchorUpdatedController = StreamController<SpatialAnchor>.broadcast();

  void attachAnchorManager(ARAnchorManager manager) {
    _anchorManager = manager;
  }

  @override
  Stream<SpatialAnchor> get onAnchorUpdated => _anchorUpdatedController.stream;

  @override
  Future<SpatialAnchor> createAnchor(String id, Transform3D transform) async {
    // Without physical plane hits from ARCore, creating anchors blindly is tough,
    // but we simulate creating an ARPlaneAnchor at the identity origin for now.
    final nativeAnchor = ARPlaneAnchor(transformation: vector_math.Matrix4.identity());

    final success = await _anchorManager?.addAnchor(nativeAnchor);
    if (success == true) {
      _nativeAnchors[nativeAnchor.name] = nativeAnchor;
      return SpatialAnchor(
        id: id,
        transform: transform,
      );
    } else {
      throw Exception('Failed to add native AR Anchor');
    }
  }

  @override
  SpatialAnchor? getAnchor(String id) {
    final nativeAnchor = _nativeAnchors[id];
    if (nativeAnchor != null) {
      return SpatialAnchor(
        id: id,
        transform: Transform3D(),
      );
    }
    return null;
  }

  @override
  Future<void> removeAnchor(String anchorId) async {
    final nativeAnchor = _nativeAnchors[anchorId];
    if (nativeAnchor != null) {
      await _anchorManager?.removeAnchor(nativeAnchor);
      _nativeAnchors.remove(anchorId);
    }
  }
}
