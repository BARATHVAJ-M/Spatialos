import 'dart:async';

/// Enables WebRTC or WebSocket communication between multiple AR users.
abstract class ICommunicationService {
  Future<void> joinChannel(String channelId);
  Future<void> leaveChannel(String channelId);
  Stream<Map<String, dynamic>> get onMessageReceived;
}
