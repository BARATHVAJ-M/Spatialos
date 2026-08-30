import '../../objects/models/transform_3d.dart';

/// Provides access to device hardware sensors (Gyro, Accelerometer, LiDAR).
abstract class ISensorProvider {
  bool get hasLidar;
  bool get hasGyroscope;
  Stream<Vector2> get onRotationChanged;
}
