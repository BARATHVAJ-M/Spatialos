import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:spatialos_ar_engine/spatialos_ar_engine.dart';
import 'package:vector_math/vector_math_64.dart' show Vector3;
import 'flutter_ar_renderer.dart';

class FlutterArView extends ConsumerWidget {
  const FlutterArView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final spatialObjects = ref.watch(flutterRendererStateProvider);

    return Container(
      color: Colors.black, // Mock Camera Background
      child: Stack(
        children: [
          // Mock Camera Feed Text
          const Center(
            child: Text(
              'Camera Feed',
              style: TextStyle(color: Colors.white38, fontSize: 24, fontWeight: FontWeight.bold),
            ),
          ),
          
          // Render Spatial Objects
          ...spatialObjects.map((obj) => _buildSpatialWidget(obj)),
        ],
      ),
    );
  }

  Widget _buildSpatialWidget(SpatialObject obj) {
    // We map 3D Transform to 2D Screen Space for this Mock Editor.
    // In a real AR plugin, the plugin handles this.
    final matrix = obj.worldTransform;
    
    // Extract translation (X, Y)
    final dx = matrix.getColumn(3).x;
    final dy = matrix.getColumn(3).y;
    final scale = matrix.getColumn(0).x; // basic scale approximation

    // Offset based on some logical center
    final left = 200.0 + (dx * 100); 
    final top = 300.0 + (dy * 100);

    Widget content = const SizedBox();

    if (obj is TextObject) {
      final textObj = obj as TextObject;
      content = Text(
        textObj.text,
        style: TextStyle(
          color: Colors.white, // In real app use hex color parsing
          fontSize: (24 * scale).toDouble(),
        ),
      );
    } else if (obj is ImageObject) {
      content = Icon(Icons.image, color: Colors.blue, size: (50 * scale).toDouble());
    } else if (obj is MiniAppObject) {
      content = Container(
        width: (150 * scale).toDouble(),
        height: (100 * scale).toDouble(),
        color: Colors.brown,
        child: const Center(
          child: Text('Coffee App', style: TextStyle(color: Colors.white)),
        ),
      );
    } else if (obj is PlaneObject) {
      content = Container(
        width: (200 * scale).toDouble(),
        height: (200 * scale).toDouble(),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.green, width: 2),
          color: Colors.green.withOpacity(0.1),
        ),
      );
    }

    return Positioned(
      left: left,
      top: top,
      child: GestureDetector(
        onPanUpdate: (details) {
          // Simulate AR dragging (editing transform)
          // Convert screen delta back to "world" coordinates
          final newDx = details.delta.dx / 100.0;
          final newDy = details.delta.dy / 100.0;
          
          final local = obj.localTransform;
          obj.localTransform = SpatialTransform(
            position: Vector3(
              local.position.x + newDx,
              local.position.y + newDy,
              local.position.z,
            ),
            rotation: local.rotation,
            scale: local.scale,
          );
          
          // Trigger update manually for the mock
          obj.updateWorldTransform();
        },
        child: content,
      ),
    );
  }
}
