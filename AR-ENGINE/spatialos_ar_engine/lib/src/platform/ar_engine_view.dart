import 'package:flutter/material.dart';
import 'package:ar_flutter_plugin_flutterflow/ar_flutter_plugin.dart';
import 'package:ar_flutter_plugin_flutterflow/datatypes/config_planedetection.dart';
import 'package:ar_flutter_plugin_flutterflow/managers/ar_anchor_manager.dart';
import 'package:ar_flutter_plugin_flutterflow/managers/ar_object_manager.dart';
import 'package:ar_flutter_plugin_flutterflow/managers/ar_session_manager.dart';
import 'package:ar_flutter_plugin_flutterflow/models/ar_node.dart';
import 'package:ar_flutter_plugin_flutterflow/models/ar_hittest_result.dart';
import 'package:ar_flutter_plugin_flutterflow/datatypes/node_types.dart' as ar_node_type;
import 'package:vector_math/vector_math_64.dart' as vector_math;

import 'package:ar_flutter_plugin_flutterflow/managers/ar_location_manager.dart';

import 'ar_session_manager_adapter.dart';
import 'ar_anchor_manager_adapter.dart';
import 'ar_plane_detector_adapter.dart';
import '../core/bootstrap_pipeline.dart';
import '../objects/models/transform_3d.dart';
import '../scene/contracts/i_scene_manager.dart';

class AREngineView extends StatefulWidget {
  final ISceneManager sceneManager;
  final ARAnchorManagerAdapter anchorAdapter;
  final ARPlaneDetectorAdapter planeAdapter;
  final BootstrapPipeline pipeline;

  const AREngineView({
    super.key,
    required this.sceneManager,
    required this.anchorAdapter,
    required this.planeAdapter,
    required this.pipeline,
  });

  @override
  State<AREngineView> createState() => _AREngineViewState();
}

class _AREngineViewState extends State<AREngineView> {
  ARSessionManager? _arSessionManager;
  ARObjectManager? _arObjectManager;

  late final BootstrapPipeline _pipeline;

  @override
  void initState() {
    super.initState();
    _pipeline = widget.pipeline;
  }

  @override
  void dispose() {
    _arSessionManager?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          ARView(
            onARViewCreated: _onARViewCreated,
            planeDetectionConfig: PlaneDetectionConfig.horizontalAndVertical,
          ),
          Positioned(
            bottom: 50,
            left: 20,
            right: 20,
            child: ElevatedButton(
              onPressed: _triggerQrBootstrap,
              child: const Text('Simulate QR Scan (Origin)'),
            ),
          )
        ],
      ),
    );
  }

  void _onARViewCreated(
      ARSessionManager arSessionManager,
      ARObjectManager arObjectManager,
      ARAnchorManager arAnchorManager,
      ARLocationManager arLocationManager) {
    _arSessionManager = arSessionManager;
    _arObjectManager = arObjectManager;

    // Attach native managers to our adapters
    widget.planeAdapter.attachObjectManager(arObjectManager);
    widget.anchorAdapter.attachAnchorManager(arAnchorManager);

    _arSessionManager!.onInitialize(
      showFeaturePoints: false,
      showPlanes: true, // Show planes for debugging
      customPlaneTexturePath: "Images/triangle.png",
      showWorldOrigin: false,
      handleTaps: true,
    );
    _arObjectManager!.onInitialize();
    
    // Listen to plane taps to simulate the QR bootstrap localization
    _arSessionManager!.onPlaneOrPointTap = _onPlaneOrPointTapped;
  }

  void _onPlaneOrPointTapped(List<ARHitTestResult> hitTestResults) {
    if (hitTestResults.isEmpty) return;

    // 1. Simulate QR Detection finding a physical coordinate
    final hit = hitTestResults.first;
    
    // 2. Trigger Bootstrap Pipeline
    // Transform ARCore hit translation to our Vector3
    final translation = hit.distance; // Approximation for demo without full matrix math
    
    _pipeline.executeQrBootstrap(
      Vector3(0, 0, translation), 
      Vector3(0, 0, 0)
    ).then((_) {
      // 3. Render 3D Object at the hit location natively
      final newNode = ARNode(
        type: ar_node_type.NodeType.localGLTF2,
        uri: "Models/Chicken_01/Chicken_01.gltf", // Requires model in assets
        scale: vector_math.Vector3(0.2, 0.2, 0.2),
        position: vector_math.Vector3(0, 0, translation),
      );
      _arObjectManager?.addNode(newNode);
    });
  }

  void _triggerQrBootstrap() {
    _pipeline.executeQrBootstrap(
      Vector3(0, 0, 1), 
      Vector3(0, 0, 0)
    );
  }
}
