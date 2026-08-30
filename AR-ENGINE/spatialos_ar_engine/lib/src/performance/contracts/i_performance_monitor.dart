import 'dart:async';

/// Monitors system resources (FPS, Memory, CPU) and throttles quality if needed.
abstract class IPerformanceMonitor {
  Stream<double> get onFpsUpdated;
  Stream<double> get onMemoryUsageUpdated; // In MB
  Future<void> startMonitoring();
  Future<void> stopMonitoring();
}
