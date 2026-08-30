import 'package:flutter/material.dart';
import 'package:spatialos_ar_engine/spatialos_ar_engine.dart';

class ArRenderLayer extends StatefulWidget {
  final String locationId;

  const ArRenderLayer({super.key, required this.locationId});

  @override
  State<ArRenderLayer> createState() => _ArRenderLayerState();
}

class _ArRenderLayerState extends State<ArRenderLayer> {
  final SpatialOSEngine _engine = SpatialOSEngine();
  late ISceneManager _sceneManager;
  bool _isEngineReady = false;

  @override
  void initState() {
    super.initState();
    _initEngine();
  }

  Future<void> _initEngine() async {
    // 1. Initialize Engine
    await _engine.initialize();

    // 2. Register Mock Hardware & Services
    _engine.modules.register<IWorldTracker>(MockWorldTracker());
    _engine.modules.register<IPlaneDetector>(MockPlaneDetector());
    _engine.modules.register<ISceneManager>(SceneManager());

    _sceneManager = _engine.modules.resolve<ISceneManager>();

    // 3. Construct a Mock Scene Graph
    final root = SpatialNode.fromJson({
      'id': 'root_anchor',
      'type': 'plane',
      'localTransform': Transform3D.identity().toJson(),
    });

    final coffeeMenu = MiniAppNode(
      id: 'coffee_app_1',
      parentId: 'root_anchor',
      localTransform: Transform3D.identity(),
      appId: 'com.spatialos.coffee',
      entryRoute: '/main',
      initialPayload: {},
    );

    _sceneManager.setScene(root);
    _sceneManager.addNode(coffeeMenu);

    setState(() {
      _isEngineReady = true;
    });
  }

  @override
  void dispose() {
    _engine.destroy();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[900],
      body: Stack(
        children: [
          // Mock Camera View
          const Center(
            child: Text(
              'SPATIAL OS MOCK TRACKING ENGINE\n(Physical ARCore Disabled for Compile Compatibility)',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white54, fontSize: 18),
            ),
          ),
          SafeArea(
            child: Align(
              alignment: Alignment.topLeft,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'SpatialOS Active\nLocation: ${widget.locationId}',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ),
          ),
          // Example object placement (Driven by Engine State)
          if (_isEngineReady)
            Positioned(
              left: 50,
              top: 200,
              child: Container(
                color: Colors.blue.withOpacity(0.8),
                padding: const EdgeInsets.all(20),
                child: Text(
                  'Engine Root ID: ${_sceneManager.rootNode?.id}\nObject Loaded: ${_sceneManager.getObjectById('coffee_app_1')?.id}', 
                  style: const TextStyle(color: Colors.white, fontSize: 20)
                ),
              ),
            )
        ],
      ),
    );
  }
}
