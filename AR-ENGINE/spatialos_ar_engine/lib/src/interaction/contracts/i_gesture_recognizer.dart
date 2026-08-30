/// Identifies complex user gestures (Pinch, Pan, Rotate) on AR objects.
abstract class IGestureRecognizer {
  Stream<Map<String, dynamic>> get onGestureDetected;
  void enableGesture(String gestureType);
}
