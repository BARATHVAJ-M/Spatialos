/// Defines the permissions a specific Mini-App holds.
class MiniAppPermissions {
  final bool canAccessCamera;
  final bool canAccessLocation;
  final bool canMakeNetworkCalls;
  final bool canInvokePayments;

  const MiniAppPermissions({
    this.canAccessCamera = false,
    this.canAccessLocation = false,
    this.canMakeNetworkCalls = false,
    this.canInvokePayments = false,
  });
}
