/// The central HTTP/WebSocket client contract for the SpatialOS Backend.
abstract class IApiGateway {
  /// Fetches a Spatial Location definition by its QR Payload ID.
  Future<Map<String, dynamic>> fetchLocationByQrCode(String qrPayload);
  
  /// Resolves the metadata and download URL for a Mini App.
  Future<Map<String, dynamic>> fetchMiniAppManifest(String appId);
  
  /// Sends an analytics or telemetry event to the backend.
  Future<void> sendTelemetry(String eventName, Map<String, dynamic> data);
}
