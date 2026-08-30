import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:spatialos_ar_engine/spatialos_ar_engine.dart';
import 'package:vector_math/vector_math_64.dart' show Matrix4;

/// State notifier that holds the list of SpatialObjects to be rendered by Flutter.
class FlutterRendererState extends StateNotifier<List<SpatialObject>> {
  FlutterRendererState() : super([]);

  void add(SpatialObject obj) {
    state = [...state, obj];
  }

  void update(SpatialObject obj) {
    // In a real app we'd trigger a rebuild of just the changed node.
    // For this prototype, we rebuild the list to force Flutter to draw new transforms.
    state = [...state]; 
  }

  void remove(String objectId) {
    state = state.where((e) => e.id != objectId).toList();
  }
}

final flutterRendererStateProvider = StateNotifierProvider<FlutterRendererState, List<SpatialObject>>((ref) {
  return FlutterRendererState();
});

class FlutterArRenderer implements IRenderer {
  final ProviderRef ref;
  
  FlutterArRenderer(this.ref);

  @override
  Future<void> initialize() async {
    // For Flutter mock, no async init needed
  }

  @override
  Future<void> addNode(SpatialObject object) async {
    ref.read(flutterRendererStateProvider.notifier).add(object);
  }

  @override
  void updateNode(SpatialObject object) {
    ref.read(flutterRendererStateProvider.notifier).update(object);
  }

  @override
  Future<void> removeNode(String objectId) async {
    ref.read(flutterRendererStateProvider.notifier).remove(objectId);
  }

  @override
  void renderFrame() {
    // Reactive via Riverpod
  }
  
  @override
  void updateTransform(String objectId, Matrix4 newTransform) {
    // In a real renderer, this updates the 3D node transform.
    // Here we let Riverpod handle it if state mutates.
  }

  @override
  void updateVisibility(String objectId, bool isVisible) {
    // Not fully implemented for mock
  }

  @override
  void dispose() {
    // Cleanup
  }
}
