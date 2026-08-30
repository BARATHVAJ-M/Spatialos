import 'contracts/i_module_manager.dart';

/// Thrown when a requested dependency cannot be resolved.
class DependencyException implements Exception {
  final String message;
  DependencyException(this.message);
  @override
  String toString() => 'DependencyException: $message';
}

/// A lightweight, map-based Service Locator.
class ModuleManager implements IModuleManager {
  final Map<Type, dynamic> _registry = {};

  @override
  void register<T>(T instance) {
    _registry[T] = instance;
  }

  @override
  T resolve<T>() {
    if (!_registry.containsKey(T)) {
      throw DependencyException('Type $T is not registered in the ModuleManager.');
    }
    return _registry[T] as T;
  }

  @override
  bool isRegistered<T>() {
    return _registry.containsKey(T);
  }

  @override
  void clear() {
    _registry.clear();
  }
}
