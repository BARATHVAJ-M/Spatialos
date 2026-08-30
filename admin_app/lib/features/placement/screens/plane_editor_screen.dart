import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';
import 'package:spatialos_ar_engine/spatialos_ar_engine.dart';
import 'package:vector_math/vector_math_64.dart' as vector_math;
import '../../../core/theme/app_colors.dart';

class PlaneEditorScreen extends ConsumerStatefulWidget {
  final String locationId;
  const PlaneEditorScreen({super.key, required this.locationId});

  @override
  ConsumerState<PlaneEditorScreen> createState() => _PlaneEditorScreenState();
}

class _NativeRenderPipeline implements IRenderPipeline {
  @override
  void onSceneSnapshotUpdated(List<ISpatialNodeData> nodes) {}
  @override
  void clearRenderer() {}
}

class _PlaneEditorScreenState extends ConsumerState<PlaneEditorScreen> {
  late EngineCore _engineCore;
  late ISceneManager _sceneManager;
  late ARAnchorManagerAdapter _anchorAdapter;
  late ARPlaneDetectorAdapter _planeAdapter;
  late BootstrapPipeline _pipeline;
  
  bool _isReady = false;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _initializeAR();
  }

  Future<void> _initializeAR() async {
    _engineCore = EngineCore();
    await _engineCore.initialize(_NativeRenderPipeline());

    _sceneManager = _engineCore.moduleManager.resolve<ISceneManager>();
    
    // Create Adapters
    _anchorAdapter = ARAnchorManagerAdapter();
    _planeAdapter = ARPlaneDetectorAdapter();
    
    // Create Pipeline
    _pipeline = BootstrapPipeline(_sceneManager, _anchorAdapter);
    
    setState(() {
      _isReady = true;
    });
  }

  void _addChild(NodeType type) {
    if (!_isReady) return;
    
    final childId = const Uuid().v4();
    ISpatialNodeData obj;

    if (type == NodeType.text) {
      obj = TextNode(
        id: childId,
        localTransform: Transform3D(),
        text: 'New Text',
        fontSize: 24,
        hexColor: '#FFFFFF',
      );
    } else if (type == NodeType.image) {
      obj = ImageNode(
        id: childId,
        localTransform: Transform3D(),
        imageUrl: 'https://via.placeholder.com/150',
        physicalWidth: 0.5,
      );
    } else {
      obj = MiniAppNode(
        id: childId,
        localTransform: Transform3D(),
        appId: 'COFFEE_MINI_APP',
        entryRoute: '/',
        initialPayload: {},
      );
    }

    _sceneManager.addNode(obj);
  }

  Future<void> _saveHierarchy() async {
    setState(() => _isSaving = true);
    // In a real implementation we would map spatialObjects back to ArContentModel
    // and send to backend via ApiArContentRepository.
    await Future.delayed(const Duration(seconds: 1)); // Mock save delay
    setState(() => _isSaving = false);
    if (mounted) context.pop();
  }

  @override
  void dispose() {
    _engineCore.destroy();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text('Real-World AR Editor'),
        backgroundColor: const Color(0xFF0F172A),
        actions: [
          if (_isSaving)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
            )
          else
            TextButton.icon(
              icon: const Icon(Icons.save, color: AppColors.accent),
              label: const Text('Save Scene', style: TextStyle(color: AppColors.accent)),
              onPressed: _saveHierarchy,
            ),
        ],
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            color: const Color(0xFF1E293B),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _ToolButton(
                  icon: Icons.text_fields, 
                  label: 'Add Text', 
                  onTap: () => _addChild(NodeType.text)
                ),
                _ToolButton(
                  icon: Icons.image, 
                  label: 'Add Image', 
                  onTap: () => _addChild(NodeType.image)
                ),
                _ToolButton(
                  icon: Icons.apps, 
                  label: 'Mini App', 
                  onTap: () => _addChild(NodeType.miniApp)
                ),
              ],
            ),
          ),
          Expanded(
            child: _isReady 
                ? AREngineView(
                    sceneManager: _sceneManager,
                    anchorAdapter: _anchorAdapter,
                    planeAdapter: _planeAdapter,
                    pipeline: _pipeline,
                  )
                : const Center(child: CircularProgressIndicator()),
          ),
        ],
      ),
    );
  }
}

class _ToolButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ToolButton({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Column(
        children: [
          Icon(icon, color: Colors.white),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 12)),
        ],
      ),
    );
  }
}
