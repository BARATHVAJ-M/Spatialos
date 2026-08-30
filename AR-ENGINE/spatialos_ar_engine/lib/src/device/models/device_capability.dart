/// Represents the hardware capabilities of the current device.
class DeviceCapability {
  final bool supportsARCore;
  final bool supportsARKit;
  final bool hasDepthSensor;
  final int maxMemoryMB;

  const DeviceCapability({
    required this.supportsARCore,
    required this.supportsARKit,
    required this.hasDepthSensor,
    required this.maxMemoryMB,
  });
}
