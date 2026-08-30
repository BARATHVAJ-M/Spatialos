/// Immutable entity representing a real-world QR code location anchor matching `qr_locations` database table.
class QrLocationModel {
  final String id;
  final String qrCode;
  final String locationName;
  final String description;
  final String building;
  final String floor;
  final String room;
  final double? latitude;
  final double? longitude;
  final String createdBy;
  final String status;
  final DateTime createdAt;
  final DateTime updatedAt;

  const QrLocationModel({
    required this.id,
    required this.qrCode,
    required this.locationName,
    required this.description,
    required this.building,
    required this.floor,
    required this.room,
    this.latitude,
    this.longitude,
    required this.createdBy,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory QrLocationModel.fromJson(Map<String, dynamic> json) {
    return QrLocationModel(
      id: (json['id'] ?? '') as String,
      qrCode: (json['qr_code'] ?? json['qrCode'] ?? '') as String,
      locationName: (json['location_name'] ?? json['locationName'] ?? 'Unnamed Location') as String,
      description: (json['description'] ?? '') as String,
      building: (json['building'] ?? '') as String,
      floor: (json['floor'] ?? '') as String,
      room: (json['room'] ?? '') as String,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      createdBy: (json['created_by'] ?? json['createdBy'] ?? 'admin-uuid') as String,
      status: (json['status'] ?? 'ACTIVE') as String,
      createdAt: json['created_at'] != null ? (DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()) : (json['createdAt'] != null ? (DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()) : DateTime.now()),
      updatedAt: json['updated_at'] != null ? (DateTime.tryParse(json['updated_at'].toString()) ?? DateTime.now()) : (json['updatedAt'] != null ? (DateTime.tryParse(json['updatedAt'].toString()) ?? DateTime.now()) : DateTime.now()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'qr_code': qrCode,
      'qrCode': qrCode,
      'location_name': locationName,
      'locationName': locationName,
      'description': description,
      'building': building,
      'floor': floor,
      'room': room,
      'latitude': latitude,
      'longitude': longitude,
      'created_by': createdBy,
      'createdBy': createdBy,
      'status': status,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  QrLocationModel copyWith({
    String? locationName,
    String? description,
    String? building,
    String? floor,
    String? room,
    double? latitude,
    double? longitude,
    String? status,
  }) {
    return QrLocationModel(
      id: id,
      qrCode: qrCode,
      locationName: locationName ?? this.locationName,
      description: description ?? this.description,
      building: building ?? this.building,
      floor: floor ?? this.floor,
      room: room ?? this.room,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      createdBy: createdBy,
      status: status ?? this.status,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }
}
