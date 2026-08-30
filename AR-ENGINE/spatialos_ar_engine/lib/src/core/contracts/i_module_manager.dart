/// The Service Locator & Dependency Injector for the engine.
///
/// Ensures modules depend purely on abstractions and never directly 
/// instantiate concrete implementations of other modules.
abstract class IModuleManager {
  /// Registers a concrete instance [instance] against a type [T].
  void register<T>(T instance);

  /// Resolves the concrete instance bound to type [T].
  /// Throws if the type is not registered.
  T resolve<T>();

  /// Checks if a type [T] is currently registered.
  bool isRegistered<T>();

  /// Clears all registered instances (used during destruction/reset).
  void clear();
}
