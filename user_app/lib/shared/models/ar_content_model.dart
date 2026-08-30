import 'media_file_model.dart';
import 'text_content_model.dart';
import 'ar_transform_model.dart';

import 'plane_content_model.dart';
import 'mini_app_content_model.dart';

enum ArContentType {
  image,
  video,
  text,
  plane,
  miniapp,
  model, // Future
  audio, // Future
}

/// Master table entity that connects QR locations with every AR object matching `ar_contents` table.
class ArContentModel {
  final String id;
  final String qrLocationId;
  final ArContentType contentType;
  final String contentReferenceId;
  final String? parentId;
  final int displayOrder;
  final String status;
  final String createdBy;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Polymorphic nested references resolved at runtime
  final MediaFileModel? mediaFile;
  final TextContentModel? textContent;
  final PlaneContentModel? planeContent;
  final MiniAppContentModel? miniAppContent;
  final ArTransformModel? transform;
  final List<ArContentModel>? children;

  const ArContentModel({
    required this.id,
    required this.qrLocationId,
    required this.contentType,
    required this.contentReferenceId,
    this.parentId,
    this.displayOrder = 0,
    this.status = 'ACTIVE',
    required this.createdBy,
    required this.createdAt,
    required this.updatedAt,
    this.mediaFile,
    this.textContent,
    this.planeContent,
    this.miniAppContent,
    this.transform,
    this.children,
  });

  static ArContentType _parseType(String? typeStr) {
    switch ((typeStr ?? 'IMAGE').toUpperCase()) {
      case 'IMAGE':
        return ArContentType.image;
      case 'VIDEO':
        return ArContentType.video;
      case 'TEXT':
        return ArContentType.text;
      case 'PLANE':
        return ArContentType.plane;
      case 'MINIAPP':
        return ArContentType.miniapp;
      default:
        return ArContentType.image;
    }
  }

  static String _typeToString(ArContentType type) {
    return type.name.toUpperCase();
  }

  factory ArContentModel.fromJson(Map<String, dynamic> json) {
    return ArContentModel(
      id: (json['id'] ?? '') as String,
      qrLocationId: (json['qr_location_id'] ?? json['qrLocationId'] ?? '') as String,
      contentType: _parseType((json['content_type'] ?? json['contentType']) as String?),
      contentReferenceId: (json['content_reference_id'] ?? json['contentReferenceId'] ?? '') as String,
      parentId: (json['parent_id'] ?? json['parentId']) as String?,
      displayOrder: (json['display_order'] ?? json['displayOrder']) as int? ?? 0,
      status: (json['status'] ?? 'ACTIVE') as String,
      createdBy: (json['created_by'] ?? json['createdBy'] ?? 'admin') as String,
      createdAt: json['created_at'] != null ? (DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()) : (json['createdAt'] != null ? (DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()) : DateTime.now()),
      updatedAt: json['updated_at'] != null ? (DateTime.tryParse(json['updated_at'].toString()) ?? DateTime.now()) : (json['updatedAt'] != null ? (DateTime.tryParse(json['updatedAt'].toString()) ?? DateTime.now()) : DateTime.now()),
      children: (json['children'] as List?)?.map((e) => ArContentModel.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'qr_location_id': qrLocationId,
      'qrLocationId': qrLocationId,
      'content_type': _typeToString(contentType),
      'contentType': _typeToString(contentType),
      'content_reference_id': contentReferenceId,
      'contentReferenceId': contentReferenceId,
      'parent_id': parentId,
      'parentId': parentId,
      'display_order': displayOrder,
      'displayOrder': displayOrder,
      'status': status,
      'created_by': createdBy,
      'createdBy': createdBy,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'children': children?.map((e) => e.toJson()).toList(),
    };
  }

  ArContentModel copyWith({
    MediaFileModel? mediaFile,
    TextContentModel? textContent,
    PlaneContentModel? planeContent,
    MiniAppContentModel? miniAppContent,
    ArTransformModel? transform,
    List<ArContentModel>? children,
  }) {
    return ArContentModel(
      id: id,
      qrLocationId: qrLocationId,
      contentType: contentType,
      contentReferenceId: contentReferenceId,
      parentId: parentId,
      displayOrder: displayOrder,
      status: status,
      createdBy: createdBy,
      createdAt: createdAt,
      updatedAt: updatedAt,
      mediaFile: mediaFile ?? this.mediaFile,
      textContent: textContent ?? this.textContent,
      planeContent: planeContent ?? this.planeContent,
      miniAppContent: miniAppContent ?? this.miniAppContent,
      transform: transform ?? this.transform,
      children: children ?? this.children,
    );
  }
}
