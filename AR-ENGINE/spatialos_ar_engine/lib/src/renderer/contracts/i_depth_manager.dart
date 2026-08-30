/// Manages LiDAR or vision-based depth maps for the physical world.
abstract class IDepthManager {
  Future<void> enableDepthSensing();
  double? getDepthAtScreenPoint(double x, double y);
}
