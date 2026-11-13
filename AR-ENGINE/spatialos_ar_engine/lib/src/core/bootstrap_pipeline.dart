import 'dart:async';
import '../scene/contracts/i_scene_manager.dart';
import '../spatial/contracts/i_anchor_contract.dart';
import '../objects/models/spatial_node.dart';
import '../objects/models/transform_3d.dart';

/// Implements the exact flow: QR -> Localization -> Anchor -> Plane -> Objects
class BootstrapPipeline {
  final ISceneManager _sceneManager;
  final IAnchorContract _anchorManager;

  BootstrapPipeline(this._sceneManager, this._anchorManager);

  /// Triggered when a QR code is detected or (in this case) a physical point is tapped to simulate the QR origin.
  Future<void> executeQrBootstrap(Vector3 qrWorldPosition, Vector3 qrWorldRotation) async {
    // 1. Establish initial spatial reference (Transform QR to World)
    final worldTransform = Transform3D(
      position: qrWorldPosition,
      rotation: Vector4(qrWorldRotation.x, qrWorldRotation.y, qrWorldRotation.z, 1.0),
      scale: Vector3(1, 1, 1),
    );

    // 2. Create a World Anchor at this physical coordinate
    final anchor = await _anchorManager.createAnchor('qr-identity', worldTransform);

    final planeNode = _GenericPlaneNode(
      id: 'plane-${anchor.id}',
      physicalWidth: 1.0, // 1 meter wide default
      localTransform: Transform3D(),
    );

    // 4. Attach Plane to Scene
    _sceneManager.addNode(planeNode);

    // Note for Production V1: 
    // Actual nodes (images, video, 3D models) should be fetched from the Backend API 
    // (via api_gateway) passing the `anchor.id` and then added to the _sceneManager dynamically.
    // We removed the hardcoded demo-image and demo-text to optimize engine memory.
    
    // 5. QR is no longer needed. World tracking (SLAM) maintains these nodes natively.
  }
}

class _GenericPlaneNode extends SpatialNode {
  final double physicalWidth;

  _GenericPlaneNode({
    required super.id,
    required super.localTransform,
    required this.physicalWidth,
  }) : super(nodeType: NodeType.plane);
}
