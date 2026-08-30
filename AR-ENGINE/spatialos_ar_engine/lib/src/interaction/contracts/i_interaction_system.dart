import '../models/interaction_event.dart';
import '../../objects/models/transform_3d.dart';

/// Handles user input directed at spatial objects.
abstract class IInteractionSystem {
  void onPointerDown(Vector2 screenPoint);
  void onPointerUp(Vector2 screenPoint);
  void onPointerMove(Vector2 screenPoint);

  /// Fires when a spatial object is successfully interacted with.
  Stream<InteractionEvent> get onObjectInteracted;
}
