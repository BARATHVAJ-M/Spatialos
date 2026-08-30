/// Immutable entity representing an Administrator Account matching `DATABASE-STRUCTURE-README.md` `users` table.
class UserModel {
  final String id;
  final String name;
  final String email;
  final String role;
  final String? profileImage;
  final String status;
  final DateTime? lastLogin;
  final DateTime createdAt;
  final DateTime updatedAt;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.profileImage,
    required this.status,
    this.lastLogin,
    required this.createdAt,
    required this.updatedAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      role: json['role'] as String? ?? 'ADMIN',
      profileImage: json['profile_image'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      lastLogin: json['last_login'] != null ? DateTime.parse(json['last_login'] as String) : null,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'profile_image': profileImage,
      'status': status,
      'last_login': lastLogin?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  UserModel copyWith({
    String? name,
    String? email,
    String? profileImage,
    String? status,
    DateTime? lastLogin,
  }) {
    return UserModel(
      id: id,
      name: name ?? this.name,
      email: email ?? this.email,
      role: role,
      profileImage: profileImage ?? this.profileImage,
      status: status ?? this.status,
      lastLogin: lastLogin ?? this.lastLogin,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }
}
