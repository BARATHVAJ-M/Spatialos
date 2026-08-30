import 'dart:async';

/// Abstracts REST/WebSocket calls to decouple the Engine from the specific HTTP library.
abstract class INetworkClient {
  Future<dynamic> get(String path);
  Future<dynamic> post(String path, dynamic body);
  Stream<dynamic> connectWebSocket(String path);
}
