class MiniAppContentModel {
  final String id;
  final String appId;
  final String appType;
  final String version;
  final Map<String, dynamic>? state;
  final Map<String, dynamic>? apiConfig;

  const MiniAppContentModel({
    required this.id,
    required this.appId,
    this.appType = 'INTERACTIVE',
    this.version = '1.0.0',
    this.state,
    this.apiConfig,
  });

  factory MiniAppContentModel.fromJson(Map<String, dynamic> json) {
    return MiniAppContentModel(
      id: json['id'] as String? ?? '',
      appId: json['appId'] as String? ?? json['app_id'] as String? ?? 'UNKNOWN',
      appType: json['appType'] as String? ?? json['app_type'] as String? ?? 'INTERACTIVE',
      version: json['version'] as String? ?? '1.0.0',
      state: json['state'] as Map<String, dynamic>?,
      apiConfig: json['apiConfig'] as Map<String, dynamic>? ?? json['api_config'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'appId': appId,
      'appType': appType,
      'version': version,
      'state': state,
      'apiConfig': apiConfig,
    };
  }
}
