import 'contracts/i_api_gateway.dart';

/// A pure-Dart simulated backend for testing the core engine offline.
class MockApiGateway implements IApiGateway {
  @override
  Future<Map<String, dynamic>> fetchLocationByQrCode(String qrPayload) async {
    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 500));
    
    return {
      'id': 'loc_123',
      'name': 'Mock Lab',
      'qrPayloadId': qrPayload,
      'origin': {
        'position': {'x': 0, 'y': 0, 'z': 0},
        'rotation': {'x': 0, 'y': 0, 'z': 0, 'w': 1},
        'scale': {'x': 1, 'y': 1, 'z': 1},
      },
      'nodes': []
    };
  }

  @override
  Future<Map<String, dynamic>> fetchMiniAppManifest(String appId) async {
    await Future.delayed(const Duration(milliseconds: 300));
    
    return {
      'appId': appId,
      'version': '1.0.0',
      'name': 'Mock App',
      'entryPoint': '/home'
    };
  }

  @override
  Future<void> sendTelemetry(String eventName, Map<String, dynamic> data) async {
    // Intentionally blackhole the telemetry for the mock.
  }
}
