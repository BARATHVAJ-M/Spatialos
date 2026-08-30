/// Represents a point in 2D space (e.g., a screen coordinate).
class Vector2 {
  final double x;
  final double y;

  const Vector2(this.x, this.y);

  static const Vector2 zero = Vector2(0, 0);

  Map<String, dynamic> toJson() => {'x': x, 'y': y};
  
  factory Vector2.fromJson(Map<String, dynamic> json) {
    return Vector2(
      (json['x'] as num).toDouble(),
      (json['y'] as num).toDouble(),
    );
  }
}

/// Represents a point or scale in 3D space.
class Vector3 {
  final double x;
  final double y;
  final double z;

  const Vector3(this.x, this.y, this.z);

  static const Vector3 zero = Vector3(0, 0, 0);
  static const Vector3 one = Vector3(1, 1, 1);

  Map<String, dynamic> toJson() => {'x': x, 'y': y, 'z': z};
  
  factory Vector3.fromJson(Map<String, dynamic> json) {
    return Vector3(
      (json['x'] as num).toDouble(),
      (json['y'] as num).toDouble(),
      (json['z'] as num).toDouble(),
    );
  }
}

/// Represents a quaternion rotation in 3D space.
class Vector4 {
  final double x;
  final double y;
  final double z;
  final double w;

  const Vector4(this.x, this.y, this.z, this.w);
  
  static const Vector4 identity = Vector4(0, 0, 0, 1);

  Map<String, dynamic> toJson() => {'x': x, 'y': y, 'z': z, 'w': w};

  factory Vector4.fromJson(Map<String, dynamic> json) {
    return Vector4(
      (json['x'] as num).toDouble(),
      (json['y'] as num).toDouble(),
      (json['z'] as num).toDouble(),
      (json['w'] as num).toDouble(),
    );
  }
}

/// Represents the physical transform (Position, Rotation, Scale) of a Spatial Node.
class Transform3D {
  final Vector3 position;
  final Vector4 rotation;
  final Vector3 scale;

  const Transform3D({
    this.position = Vector3.zero,
    this.rotation = Vector4.identity,
    this.scale = Vector3.one,
  });

  Map<String, dynamic> toJson() {
    return {
      'position': position.toJson(),
      'rotation': rotation.toJson(),
      'scale': scale.toJson(),
    };
  }

  factory Transform3D.fromJson(Map<String, dynamic> json) {
    return Transform3D(
      position: Vector3.fromJson(json['position']),
      rotation: Vector4.fromJson(json['rotation']),
      scale: Vector3.fromJson(json['scale']),
    );
  }
}
