/// Translates raw OS touch inputs into generic Engine Input events.
abstract class IInputManager {
  Stream<Map<String, dynamic>> get onInputEvent;
  void registerInputSource(String sourceId);
}
