import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/toast_service.dart';
import '../../../shared/models/ar_content_model.dart';
import '../../../shared/models/ar_transform_model.dart';

/// Clean sticker-style AR Object studio with corner handles, 1-finger move, and 2-finger pinch/twist scaling.
class ArObjectManipulator extends StatefulWidget {
  final ArContentModel item;
  final Widget child;
  final bool isSelected;
  final ValueChanged<ArTransformModel> onTransformChanged;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onReset;
  final VoidCallback onToggleSelect;
  final GestureDragUpdateCallback? onPanUpdate;
  final GestureDragEndCallback? onPanEnd;

  const ArObjectManipulator({
    super.key,
    required this.item,
    required this.child,
    required this.isSelected,
    required this.onTransformChanged,
    required this.onEdit,
    required this.onDelete,
    required this.onReset,
    required this.onToggleSelect,
    this.onPanUpdate,
    this.onPanEnd,
  });

  @override
  State<ArObjectManipulator> createState() => _ArObjectManipulatorState();
}

class _ArObjectManipulatorState extends State<ArObjectManipulator> {
  late double _scale;
  late double _rotation;
  double _startScale = 1.0;
  double _startRotation = 0.0;
  Offset _lastPanDelta = Offset.zero;

  @override
  void initState() {
    super.initState();
    _scale = widget.item.transform?.scaleX != 0.0 ? (widget.item.transform?.scaleX ?? 1.0) : 1.0;
    _rotation = widget.item.transform?.rotationZ ?? 0.0;
  }

  @override
  void didUpdateWidget(covariant ArObjectManipulator oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.item.transform != null) {
      if (widget.item.transform!.scaleX != 0.0) {
        _scale = widget.item.transform!.scaleX;
      }
      _rotation = widget.item.transform!.rotationZ;
    }
  }

  void _syncTransform() {
    final old = widget.item.transform ?? ArTransformModel(id: 'trans-${widget.item.id}', arContentId: widget.item.id, updatedAt: DateTime.now());
    widget.onTransformChanged(old.copyWith(scaleX: _scale, scaleY: _scale, scaleZ: _scale, rotationZ: _rotation));
  }

  void _stepScale(double delta) {
    setState(() {
      _scale = (_scale + delta).clamp(0.3, 3.5);
    });
    _syncTransform();
  }

  void _stepRotation(double deltaAngle) {
    setState(() {
      _rotation += deltaAngle;
    });
    _syncTransform();
  }

  @override
  Widget build(BuildContext context) {
    return Transform.scale(
      scale: _scale,
      child: Transform.rotate(
        angle: _rotation,
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
            // Extra padding container to give clear space for corner handle buttons
            Padding(
              padding: const EdgeInsets.all(22.0),
              child: GestureDetector(
                onTap: widget.onToggleSelect,
                onScaleStart: (details) {
                  _startScale = _scale;
                  _startRotation = _rotation;
                  _lastPanDelta = Offset.zero;
                },
                onScaleUpdate: (details) {
                  if (!widget.isSelected) return;

                  // 1-finger panning / translation across the wall
                  if (details.pointerCount == 1 && details.scale == 1.0) {
                    if (details.focalPointDelta.distance > 0) {
                      widget.onPanUpdate?.call(
                        DragUpdateDetails(
                          globalPosition: details.focalPoint,
                          delta: details.focalPointDelta,
                        ),
                      );
                    }
                  } else {
                    // 2-finger pinch-to-zoom and twist rotation
                    setState(() {
                      _scale = (_startScale * details.scale).clamp(0.3, 3.5);
                      _rotation = _startRotation + details.rotation;
                    });
                    _syncTransform();
                  }
                },
                onScaleEnd: (details) {
                  if (widget.isSelected && widget.onPanEnd != null) {
                    widget.onPanEnd!(DragEndDetails(velocity: details.velocity));
                  }
                },
                child: Container(
                  decoration: widget.isSelected
                      ? BoxDecoration(
                          border: Border.all(color: AppColors.accent, width: 2.5),
                          borderRadius: BorderRadius.circular(18),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.accent.withValues(alpha: 0.3),
                              blurRadius: 15,
                              spreadRadius: 2,
                            ),
                          ],
                        )
                      : null,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      widget.child,
                      if (widget.isSelected)
                        IgnorePointer(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.45),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.touch_app, color: Colors.white, size: 16),
                                SizedBox(width: 5),
                                Text(
                                  '1-finger move | 2-finger zoom & spin',
                                  style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),

            // ==========================================
            // 1st Edit Mode Look: Clean Corner Controls
            // ==========================================
            if (widget.isSelected) ...[
              // TOP-LEFT CORNER: CANCEL / DELETE (Remove from wall)
              Positioned(
                top: 4,
                left: 4,
                child: _buildCornerButton(
                  icon: Icons.close,
                  color: AppColors.error,
                  tooltip: 'Remove / Cancel',
                  onTap: () {
                    widget.onDelete();
                  },
                ),
              ),

              // TOP-RIGHT CORNER: ROTATE HANDLE
              Positioned(
                top: 4,
                right: 4,
                child: GestureDetector(
                  onPanUpdate: (details) {
                    // Dragging right/down increases angle, left/up decreases angle
                    final delta = (details.delta.dx + details.delta.dy) * 0.02;
                    _stepRotation(delta);
                  },
                  child: _buildCornerButton(
                    icon: Icons.rotate_right,
                    color: AppColors.primary,
                    tooltip: 'Rotate (Drag or Tap)',
                    onTap: () {
                      _stepRotation(math.pi / 4);
                      ToastService.show(context, 'Rotated 45°', icon: Icons.rotate_right);
                    },
                  ),
                ),
              ),

              // BOTTOM-LEFT CORNER: SIZE / SCALE HANDLE
              Positioned(
                bottom: 4,
                left: 4,
                child: GestureDetector(
                  onPanUpdate: (details) {
                    // Dragging outward (down/left) grows size; moving inward shrinks
                    final delta = (-details.delta.dx + details.delta.dy) * 0.01;
                    _stepScale(delta);
                  },
                  child: _buildCornerButton(
                    icon: Icons.open_in_full,
                    color: AppColors.success,
                    tooltip: 'Adjust Size (Drag or Tap)',
                    onTap: () {
                      // Toggle size cleanly for simple tap users
                      if (_scale < 1.0) {
                        _stepScale(1.0 - _scale);
                      } else if (_scale < 1.5) {
                        _stepScale(0.5);
                      } else if (_scale < 2.0) {
                        _stepScale(0.5);
                      } else {
                        setState(() => _scale = 0.8);
                        _syncTransform();
                      }
                      ToastService.show(context, 'Scaled object', icon: Icons.open_in_full);
                    },
                  ),
                ),
              ),

              // BOTTOM-RIGHT CORNER: EDIT (Modify content / Reset)
              Positioned(
                bottom: 4,
                right: 4,
                child: _buildCornerButton(
                  icon: Icons.edit_rounded,
                  color: AppColors.warning,
                  tooltip: 'Edit / Reset',
                  onTap: () {
                    widget.onEdit();
                  },
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildCornerButton({
    required IconData icon,
    required Color color,
    required String tooltip,
    required VoidCallback onTap,
  }) {
    return Material(
      color: color,
      shape: const CircleBorder(),
      elevation: 6,
      shadowColor: Colors.black,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Container(
          width: 38,
          height: 38,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2),
          ),
          child: Icon(icon, color: Colors.white, size: 20),
        ),
      ),
    );
  }
}
