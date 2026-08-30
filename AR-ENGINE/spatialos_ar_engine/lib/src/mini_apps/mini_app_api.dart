import 'dart:async';
import 'contracts/i_mini_app_api.dart';
import '../interaction/models/interaction_event.dart';
import '../interaction/contracts/i_interaction_system.dart';

class MiniAppAPI implements IMiniAppAPI {
  final String _appId;
  final IInteractionSystem _interactionSystem;
  
  final StreamController<void> _tapController = StreamController.broadcast();
  StreamSubscription? _interactionSub;

  MiniAppAPI(this._appId, this._interactionSystem) {
    _interactionSub = _interactionSystem.onObjectInteracted.listen((payload) {
      if (payload.objectId == _appId && payload.type == InteractionType.tap) {
        _tapController.add(null);
      }
    });
  }

  @override
  Stream<void> get onUserTapped => _tapController.stream;

  @override
  Future<String> requestUserLocation(String requestingAppId) async {
    return "mocked_location";
  }
  
  @override
  Future<bool> requestPayment(String requestingAppId, double amount) async {
    return true;
  }

  void dispose() {
    _interactionSub?.cancel();
    _tapController.close();
  }
}
