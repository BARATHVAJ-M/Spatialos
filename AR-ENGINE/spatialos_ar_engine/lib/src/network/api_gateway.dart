import 'dart:async';
import 'contracts/i_network_client.dart';

/// The central HTTP/WebSocket client.
/// This acts as a wrapper around the NetworkClient, ensuring the rest of the Engine 
/// has a specific gateway for fetching SpatialOS specific payloads (e.g. Scenes).
class ApiGateway {
  final INetworkClient _client;

  ApiGateway(this._client);

  /// Fetches a Scene payload by ID. Returns raw JSON map.
  Future<Map<String, dynamic>> fetchScene(String sceneId) async {
    final response = await _client.get('/api/scenes/$sceneId');
    if (response is Map<String, dynamic>) {
      return response;
    }
    throw Exception('Invalid scene format returned from network.');
  }

  /// Sends telemetry or analytics data
  Future<void> sendTelemetry(Map<String, dynamic> data) async {
    await _client.post('/api/telemetry', data);
  }
}
