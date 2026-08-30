import 'package:flutter/material.dart';
import '../../shared/models/ar_content_model.dart';

/// Clean AR Object viewer that applies the precise transform coordinates (scale and rotation)
/// matching the Admin App's spatial logic, but strictly read-only for User App consumers.
class ArObjectManipulator extends StatelessWidget {
  final ArContentModel item;
  final Widget child;

  const ArObjectManipulator({
    super.key,
    required this.item,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    // Extract precise transform properties saved by the Admin
    final double scale = item.transform?.scaleX != 0.0 ? (item.transform?.scaleX ?? 1.0) : 1.0;
    final double rotation = item.transform?.rotationZ ?? 0.0;

    return Transform.scale(
      scale: scale,
      child: Transform.rotate(
        angle: rotation,
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
            // Extra padding container to match Admin App bounding box dimensions exactly
            Padding(
              padding: const EdgeInsets.all(22.0),
              child: child,
            ),
          ],
        ),
      ),
    );
  }
}
