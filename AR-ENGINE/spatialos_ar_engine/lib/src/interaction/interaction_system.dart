import 'dart:async';
import 'contracts/i_interaction_system.dart';
import 'contracts/i_hit_tester.dart';
import 'models/interaction_event.dart';
import '../core/contracts/i_event_bus.dart';
import '../objects/models/transform_3d.dart';

class InteractionSystem implements IInteractionSystem {
  final IEventBus _eventBus;
  final IHitTester _hitTester;
  final StreamController<InteractionEvent> _controller = StreamController.broadcast();

  InteractionSystem(this._eventBus, this._hitTester);

  @override
  Stream<InteractionEvent> get onObjectInteracted => _controller.stream;

  @override
  void onPointerDown(Vector2 screenPoint) {
    _processHit(screenPoint, InteractionType.tap);
  }

  @override
  void onPointerUp(Vector2 screenPoint) {}

  @override
  void onPointerMove(Vector2 screenPoint) {
    _processHit(screenPoint, InteractionType.swipe);
  }

  void _processHit(Vector2 screenPoint, InteractionType type) {
    final hitNode = _hitTester.hitTestLogicalObject(screenPoint);
    if (hitNode == null) return;

    final payload = InteractionEvent(
      objectId: hitNode.id,
      type: type,
      impactPoint: Vector3.zero,
      timestamp: DateTime.now(),
    );

    _controller.add(payload);
    _eventBus.publish(payload);
  }

  void dispose() {
    _controller.close();
  }
}
