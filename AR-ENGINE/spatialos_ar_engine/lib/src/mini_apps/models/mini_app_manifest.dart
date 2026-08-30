/// The registry data defining a SpatialOS Mini App.
class MiniAppManifest {
  final String appId;
  final String version;
  final String name;
  final List<String> permissionsRequired;
  final String entryPoint;

  MiniAppManifest({
    required this.appId,
    required this.version,
    required this.name,
    this.permissionsRequired = const [],
    required this.entryPoint,
  });

  Map<String, dynamic> toJson() {
    return {
      'appId': appId,
      'version': version,
      'name': name,
      'permissionsRequired': permissionsRequired,
      'entryPoint': entryPoint,
    };
  }
}
