import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:spatialos_ar_engine/spatialos_ar_engine.dart';
import '../widgets/flutter_ar_renderer.dart';

// Provides a singleton instance of the AR Engine Controller for the session
final arEngineProvider = Provider.autoDispose<ArEngineController>((ref) {
  // 1. Mock Tracking Provider for Windows Desktop Testing
  final trackingProvider = MockTrackingProvider();
  
  // 2. Anchor Provider
  final anchorProvider = MockAnchorProvider();
  
  // 3. Renderer (We pass ref to allow Flutter to hook into state)
  final renderer = FlutterArRenderer(ref);
  
  final controller = ArEngineController(
    trackingProvider: trackingProvider,
    anchorProvider: anchorProvider,
    renderer: renderer,
  );
  
  ref.onDispose(() {
    controller.dispose();
  });
  
  return controller;
});
