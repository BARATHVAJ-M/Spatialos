import 'dart:async';
import 'contracts/i_event_bus.dart';

/// A Stream-based Pub/Sub implementation of IEventBus.
class EventBus implements IEventBus {
  final StreamController<dynamic> _streamController;

  EventBus({bool sync = false}) 
      : _streamController = StreamController<dynamic>.broadcast(sync: sync);

  @override
  void publish<T>(T event) {
    _streamController.add(event);
  }

  @override
  Stream<T> on<T>() {
    return _streamController.stream.where((event) => event is T).cast<T>();
  }

  @override
  void dispose() {
    _streamController.close();
  }
}
