/// Provides diagnostic visual overlays for QA and debugging.
abstract class IDebugOverlay {
  void showTrackingPoints(bool show);
  void showDetectedPlanes(bool show);
  void showAnchorBounds(bool show);
  void showPerformanceMetrics(bool show);
}
