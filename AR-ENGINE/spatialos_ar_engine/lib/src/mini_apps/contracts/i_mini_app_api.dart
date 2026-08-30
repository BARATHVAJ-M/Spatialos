/// The bridge that allows a Mini-App to request data from the host engine securely.
abstract class IMiniAppAPI {
  /// Example: The Mini-App requests the user's current spatial location.
  Future<String> requestUserLocation(String requestingAppId);
  
  /// Example: The Mini-App requests to process a financial transaction.
  Future<bool> requestPayment(String requestingAppId, double amount);
  
  /// Emits when the user physical taps the specific Mini-App Node in 3D space.
  Stream<void> get onUserTapped;
}
