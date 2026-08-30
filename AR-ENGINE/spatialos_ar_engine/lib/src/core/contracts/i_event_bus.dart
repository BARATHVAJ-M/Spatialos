import 'dart:async';

/// The central decoupled communication channel for the engine.
///
/// Prevents horizontal coupling between modules by allowing them to 
/// publish and subscribe to strongly-typed events instead of calling 
/// each other directly.
abstract class IEventBus {
  /// Publishes a new [event] to all active subscribers.
  void publish<T>(T event);

  /// Returns a stream of events matching type [T].
  Stream<T> on<T>();

  /// Cleans up resources.
  void dispose();
}
