import 'dart:async';
import '../scene/contracts/i_scene_manager.dart';
import '../spatial/contracts/i_anchor_contract.dart';
import '../spatial/models/spatial_anchor.dart';
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

    // 5. Attach Image/Text/Video to the Plane (using local coordinates)
    _sceneManager.addNode(ImageNode(
      id: 'demo-image',
      parentId: planeNode.id,
      imageUrl: 'https://example.com/demo.jpg',
      physicalWidth: 0.5, // 50cm
      localTransform: Transform3D(
        position: Vector3(0, 0, 0), // Centered on plane
        rotation: Vector4.identity,
        scale: Vector3(1, 1, 1),
      ),
    ));

    _sceneManager.addNode(TextNode(
      id: 'demo-text',
      parentId: planeNode.id,
      text: 'Anchored to World!',
      fontSize: 24,
      hexColor: '#FFFFFF',
      localTransform: Transform3D(
        position: Vector3(0, 0.6, 0), // 60cm above center
        rotation: Vector4.identity,
        scale: Vector3(1, 1, 1),
      ),
    ));
    
    // 6. QR is no longer needed. World tracking (SLAM) maintains these nodes natively.
  }
}

class _GenericPlaneNode extends SpatialNode {
  final double physicalWidth;

  _GenericPlaneNode({
    required super.id,
    super.parentId,
    required super.localTransform,
    required this.physicalWidth,
  }) : super(nodeType: NodeType.plane);
}
