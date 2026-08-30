class PlaneContentModel {
  final String id;
  final double width;
  final double height;
  final String borderColor;
  final String backgroundColor;

  const PlaneContentModel({
    required this.id,
    this.width = 1.0,
    this.height = 1.0,
    this.borderColor = '#FFFFFF',
    this.backgroundColor = 'transparent',
  });

  factory PlaneContentModel.fromJson(Map<String, dynamic> json) {
    return PlaneContentModel(
      id: json['id'] as String? ?? '',
      width: (json['width'] as num?)?.toDouble() ?? 1.0,
      height: (json['height'] as num?)?.toDouble() ?? 1.0,
      borderColor: json['borderColor'] as String? ?? json['border_color'] as String? ?? '#FFFFFF',
      backgroundColor: json['backgroundColor'] as String? ?? json['background_color'] as String? ?? 'transparent',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'width': width,
      'height': height,
      'borderColor': borderColor,
      'backgroundColor': backgroundColor,
    };
  }
}
