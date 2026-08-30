class SettingsModel {
  final String themeMode;
  final String cameraQuality;
  final bool showPlaneDetection;
  final bool showAnchorGizmo;
  final bool autoSaveCoordinates;

  const SettingsModel({
    required this.themeMode,
    required this.cameraQuality,
    required this.showPlaneDetection,
    required this.showAnchorGizmo,
    required this.autoSaveCoordinates,
  });

  factory SettingsModel.fromJson(Map<String, dynamic> json) {
    return SettingsModel(
      themeMode: json['theme'] ?? 'DARK',
      cameraQuality: json['cameraQuality'] ?? '1080p Full-HD',
      showPlaneDetection: json['showPlaneDetection'] ?? true,
      showAnchorGizmo: json['showAnchorGizmo'] ?? true,
      autoSaveCoordinates: json['autoSaveCoordinates'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'theme': themeMode,
      'cameraQuality': cameraQuality,
      'showPlaneDetection': showPlaneDetection,
      'showAnchorGizmo': showAnchorGizmo,
      'autoSaveCoordinates': autoSaveCoordinates,
    };
  }

  SettingsModel copyWith({
    String? themeMode,
    String? cameraQuality,
    bool? showPlaneDetection,
    bool? showAnchorGizmo,
    bool? autoSaveCoordinates,
  }) {
    return SettingsModel(
      themeMode: themeMode ?? this.themeMode,
      cameraQuality: cameraQuality ?? this.cameraQuality,
      showPlaneDetection: showPlaneDetection ?? this.showPlaneDetection,
      showAnchorGizmo: showAnchorGizmo ?? this.showAnchorGizmo,
      autoSaveCoordinates: autoSaveCoordinates ?? this.autoSaveCoordinates,
    );
  }
}
