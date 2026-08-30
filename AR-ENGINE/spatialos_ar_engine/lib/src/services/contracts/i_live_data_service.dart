import 'dart:async';

/// Streams real-time updates (e.g. IoT sensor data overlay on a machine).
abstract class ILiveDataService {
  Stream<dynamic> subscribeToStream(String streamId);
  void unsubscribe(String streamId);
}
