/// Immutable model representing real-world 3D coordinates matching `ar_transform` table.
class ArTransformModel {
  final String id;
  final String arContentId;
  final double positionX;
  final double positionY;
  final double positionZ;
  final double rotationX;
  final double rotationY;
  final double rotationZ;
  final double scaleX;
  final double scaleY;
  final double scaleZ;
  final String anchorType; // e.g. 'VERTICAL_WALL', 'HORIZONTAL_FLOOR', 'QR_RELATIVE'
  final DateTime updatedAt;

  const ArTransformModel({
    required this.id,
    required this.arContentId,
    this.positionX = 0.0,
    this.positionY = 0.0,
    this.positionZ = 0.0,
    this.rotationX = 0.0,
    this.rotationY = 0.0,
    this.rotationZ = 0.0,
    this.scaleX = 1.0,
    this.scaleY = 1.0,
    this.scaleZ = 1.0,
    this.anchorType = 'VERTICAL_WALL',
    required this.updatedAt,
  });

  factory ArTransformModel.fromJson(Map<String, dynamic> json) {
    return ArTransformModel(
      id: (json['id'] ?? '') as String,
      arContentId: (json['ar_content_id'] ?? json['arContentId'] ?? '') as String,
      positionX: ((json['position_x'] ?? json['positionX']) as num?)?.toDouble() ?? 0.0,
      positionY: ((json['position_y'] ?? json['positionY']) as num?)?.toDouble() ?? 0.0,
      positionZ: ((json['position_z'] ?? json['positionZ']) as num?)?.toDouble() ?? 0.0,
      rotationX: ((json['rotation_x'] ?? json['rotationX']) as num?)?.toDouble() ?? 0.0,
      rotationY: ((json['rotation_y'] ?? json['rotationY']) as num?)?.toDouble() ?? 0.0,
      rotationZ: ((json['rotation_z'] ?? json['rotationZ']) as num?)?.toDouble() ?? 0.0,
      scaleX: ((json['scale_x'] ?? json['scaleX']) as num?)?.toDouble() ?? 1.0,
      scaleY: ((json['scale_y'] ?? json['scaleY']) as num?)?.toDouble() ?? 1.0,
      scaleZ: ((json['scale_z'] ?? json['scaleZ']) as num?)?.toDouble() ?? 1.0,
      anchorType: (json['anchor_type'] ?? json['anchorType'] ?? 'VERTICAL_WALL') as String,
      updatedAt: json['updated_at'] != null ? (DateTime.tryParse(json['updated_at'].toString()) ?? DateTime.now()) : (json['updatedAt'] != null ? (DateTime.tryParse(json['updatedAt'].toString()) ?? DateTime.now()) : DateTime.now()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'ar_content_id': arContentId,
      'arContentId': arContentId,
      'position_x': positionX,
      'positionX': positionX,
      'position_y': positionY,
      'positionY': positionY,
      'position_z': positionZ,
      'positionZ': positionZ,
      'rotation_x': rotationX,
      'rotationX': rotationX,
      'rotation_y': rotationY,
      'rotationY': rotationY,
      'rotation_z': rotationZ,
      'rotationZ': rotationZ,
      'scale_x': scaleX,
      'scaleX': scaleX,
      'scale_y': scaleY,
      'scaleY': scaleY,
      'scale_z': scaleZ,
      'scaleZ': scaleZ,
      'anchor_type': anchorType,
      'anchorType': anchorType,
      'updated_at': updatedAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  ArTransformModel copyWith({
    String? arContentId,
    double? positionX,
    double? positionY,
    double? positionZ,
    double? rotationZ,
    double? scaleX,
    double? scaleY,
    double? scaleZ,
  }) {
    return ArTransformModel(
      id: id,
      arContentId: arContentId ?? this.arContentId,
      positionX: positionX ?? this.positionX,
      positionY: positionY ?? this.positionY,
      positionZ: positionZ ?? this.positionZ,
      rotationX: rotationX,
      rotationY: rotationY,
      rotationZ: rotationZ ?? this.rotationZ,
      scaleX: scaleX ?? this.scaleX,
      scaleY: scaleY ?? this.scaleY,
      scaleZ: scaleZ ?? this.scaleZ,
      anchorType: anchorType,
      updatedAt: DateTime.now(),
    );
  }
}
