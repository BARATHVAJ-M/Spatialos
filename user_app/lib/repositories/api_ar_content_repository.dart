import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import '../../core/services/api_service.dart';
import '../../shared/models/ar_content_model.dart';
import '../../shared/models/ar_transform_model.dart';
import '../../shared/models/media_file_model.dart';
import '../../shared/models/text_content_model.dart';
import '../../shared/models/plane_content_model.dart';
import '../../shared/models/mini_app_content_model.dart';
import 'ar_content_repository_interface.dart';

class ApiArContentRepository implements IArContentRepository {
  final ApiService _apiService;

  ApiArContentRepository(this._apiService);

  @override
  Future<List<ArContentModel>> getContentForLocation(String qrCodeOrId) async {
    try {
      final response = await _apiService.get('/placements/preview?qrCode=$qrCodeOrId');
      final res = response.data;
      if (res != null && res['success'] == true && res['data']?['objects'] is List) {
        final rawList = res['data']['objects'] as List;
        return rawList.map((item) {
          final transformJson = item['transform'];
          final transform = transformJson != null 
              ? ArTransformModel(
                  id: transformJson['id'] ?? 'trans-${item['id']}',
                  arContentId: item['id'],
                  positionX: (transformJson['positionX'] as num?)?.toDouble() ?? 0.0,
                  positionY: (transformJson['positionY'] as num?)?.toDouble() ?? 0.0,
                  positionZ: (transformJson['positionZ'] as num?)?.toDouble() ?? 0.0,
                  rotationX: (transformJson['rotationX'] as num?)?.toDouble() ?? 0.0,
                  rotationY: (transformJson['rotationY'] as num?)?.toDouble() ?? 0.0,
                  rotationZ: (transformJson['rotationZ'] as num?)?.toDouble() ?? 0.0,
                  scaleX: (transformJson['scaleX'] as num?)?.toDouble() ?? 1.0,
                  scaleY: (transformJson['scaleY'] as num?)?.toDouble() ?? 1.0,
                  scaleZ: (transformJson['scaleZ'] as num?)?.toDouble() ?? 1.0,
                  anchorType: transformJson['anchorType'] ?? 'PLANE_WALL',
                  updatedAt: DateTime.tryParse(transformJson['updatedAt'] ?? '') ?? DateTime.now(),
                )
              : null;

          final contentData = item['contentData'];
          TextContentModel? textModel;
          MediaFileModel? mediaModel;
          PlaneContentModel? planeModel;
          MiniAppContentModel? miniAppModel;

          if (item['contentType'] == 'TEXT') {
            if (contentData != null) {
              textModel = TextContentModel.fromJson(contentData);
            } else {
              textModel = TextContentModel(
                id: item['contentReferenceId'] ?? 'text-default',
                title: 'Spatial Wall Note',
                paragraph: 'Attached to physical location coordinate',
                textColor: '#FFFFFF',
                backgroundColor: '#1E293B',
                fontFamily: 'Inter',
                createdAt: DateTime.tryParse(item['createdAt'] ?? '') ?? DateTime.now(),
                updatedAt: DateTime.tryParse(item['updatedAt'] ?? '') ?? DateTime.now(),
              );
            }
          } else if (item['contentType'] == 'PLANE') {
            if (contentData != null) {
              planeModel = PlaneContentModel.fromJson(contentData);
            } else {
              planeModel = PlaneContentModel(id: item['contentReferenceId'] ?? 'plane-default');
            }
          } else if (item['contentType'] == 'MINIAPP') {
            if (contentData != null) {
              miniAppModel = MiniAppContentModel.fromJson(contentData);
            } else {
              miniAppModel = MiniAppContentModel(id: item['contentReferenceId'] ?? 'miniapp-default', appId: 'UNKNOWN');
            }
          } else {
            if (contentData != null) {
              mediaModel = MediaFileModel(
                id: contentData['id'] ?? item['contentReferenceId'],
                fileName: contentData['fileName'] ?? 'media',
                originalName: contentData['originalName'] ?? 'media',
                filePath: contentData['filePath'] ?? '',
                mimeType: contentData['mimeType'] ?? 'image/jpeg',
                fileSize: contentData['fileSize'] ?? 1024,
                uploadedBy: contentData['uploadedBy'] ?? 'admin',
                createdAt: DateTime.tryParse(contentData['createdAt'] ?? '') ?? DateTime.now(),
              );
            } else {
              mediaModel = MediaFileModel(
                id: item['contentReferenceId'] ?? 'media-default',
                fileName: 'ar_media.jpg',
                originalName: 'Photo on Wall',
                filePath: '/storage/sample_ar_media.jpg',
                mimeType: item['contentType'] == 'VIDEO' ? 'video/mp4' : 'image/jpeg',
                fileSize: 1048576,
                uploadedBy: item['createdBy'] ?? 'admin',
                createdAt: DateTime.tryParse(item['createdAt'] ?? '') ?? DateTime.now(),
              );
            }
          }

          return ArContentModel(
            id: item['id'],
            qrLocationId: item['qrLocationId'],
            contentType: _parseType(item['contentType']),
            contentReferenceId: item['contentReferenceId'],
            displayOrder: item['displayOrder'] ?? 0,
            status: item['status'] ?? 'ACTIVE',
            createdBy: item['createdBy'] ?? 'admin',
            createdAt: DateTime.tryParse(item['createdAt'] ?? '') ?? DateTime.now(),
            updatedAt: DateTime.tryParse(item['updatedAt'] ?? '') ?? DateTime.now(),
            transform: transform,
            mediaFile: mediaModel,
            textContent: textModel,
            planeContent: planeModel,
            miniAppContent: miniAppModel,
          );
        }).toList();
      }
    } catch (e) {
      throw Exception(ApiService.formatNetworkError(e));
    }
    return [];
  }

  ArContentType _parseType(String? str) {
    if (str == 'VIDEO') return ArContentType.video;
    if (str == 'TEXT') return ArContentType.text;
    if (str == 'MODEL') return ArContentType.model;
    if (str == 'AUDIO') return ArContentType.audio;
    if (str == 'PLANE') return ArContentType.plane;
    if (str == 'MINIAPP') return ArContentType.miniapp;
    return ArContentType.image;
  }

  String _typeToStr(ArContentType type) {
    switch (type) {
      case ArContentType.video: return 'VIDEO';
      case ArContentType.text: return 'TEXT';
      case ArContentType.model: return 'MODEL';
      case ArContentType.audio: return 'AUDIO';
      case ArContentType.plane: return 'PLANE';
      case ArContentType.miniapp: return 'MINIAPP';
      default: return 'IMAGE';
    }
  }

  @override
  Future<ArContentModel> createMediaContent({
    required String qrLocationId,
    required ArContentType type,
    required MediaFileModel mediaFile,
    required ArTransformModel initialTransform,
    int expiryDays = 7,
  }) async {
    final response = await _apiService.post('/placements', data: {
      'qrCode': qrLocationId,
      'contentType': _typeToStr(type),
      'contentReferenceId': mediaFile.id,
      'expiry_days': expiryDays,
      'transform': initialTransform.toJson(),
      'mediaData': mediaFile.toJson(),
    });
    final res = response.data;
    if (res != null && res['success'] == true) {
      final data = res['data'];
      final contentId = data['id'] ?? const Uuid().v4();
      final syncedTransform = (data['transform'] != null)
          ? ArTransformModel.fromJson(data['transform'])
          : initialTransform.copyWith(arContentId: contentId);

      return ArContentModel(
        id: contentId,
        qrLocationId: qrLocationId,
        contentType: type,
        contentReferenceId: mediaFile.id,
        displayOrder: 0,
        status: 'ACTIVE',
        createdBy: 'admin',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        transform: syncedTransform,
        mediaFile: mediaFile,
      );
    }
    throw Exception('Failed to create media placement on server');
  }

  @override
  Future<ArContentModel> createTextContent({
    required String qrLocationId,
    required TextContentModel textModel,
    required ArTransformModel initialTransform,
    int expiryDays = 7,
  }) async {
    final response = await _apiService.post('/placements', data: {
      'qrCode': qrLocationId,
      'contentType': 'TEXT',
      'contentReferenceId': textModel.id,
      'expiry_days': expiryDays,
      'transform': initialTransform.toJson(),
      'textData': textModel.toJson(),
    });
    final res = response.data;
    if (res != null && res['success'] == true) {
      final data = res['data'];
      final contentId = data['id'] ?? const Uuid().v4();
      final syncedTransform = (data['transform'] != null)
          ? ArTransformModel.fromJson(data['transform'])
          : initialTransform.copyWith(arContentId: contentId);

      return ArContentModel(
        id: contentId,
        qrLocationId: qrLocationId,
        contentType: ArContentType.text,
        contentReferenceId: textModel.id,
        displayOrder: 0,
        status: 'ACTIVE',
        createdBy: 'admin',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        transform: syncedTransform,
        textContent: textModel,
      );
    }
    throw Exception('Failed to create text placement on server');
  }

  @override
  Future<void> updateTransform(ArTransformModel updatedTransform) async {
    await _apiService.patch('/placements/${updatedTransform.arContentId}', data: updatedTransform.toJson());
  }

  @override
  Future<void> updateContent(ArContentModel updatedItem) async {
    final payload = <String, dynamic>{};
    if (updatedItem.transform != null) {
      payload.addAll(updatedItem.transform!.toJson());
    }
    if (updatedItem.contentType == ArContentType.text && updatedItem.textContent != null) {
      payload['textData'] = updatedItem.textContent!.toJson();
    } else if (updatedItem.mediaFile != null) {
      payload['mediaData'] = updatedItem.mediaFile!.toJson();
    }
    await _apiService.patch('/placements/${updatedItem.id}', data: payload);
  }

  @override
  Future<void> deleteContent(String contentId) async {
    await _apiService.delete('/placements/$contentId');
  }

  @override
  Future<String?> uploadMediaFile({
    required List<int> bytes,
    required String fileName,
    required String mimeType,
  }) async {
    try {
      final formData = FormData.fromMap({
        'file': MultipartFile.fromBytes(bytes, filename: fileName),
        'fileName': fileName,
        'mimeType': mimeType,
        'serverHost': _apiService.baseUrl,
      });
      final res = await _apiService.postFormData('/placements/upload', data: formData);
      if (res.data != null && res.data['success'] == true) {
        return res.data['filePath']?.toString();
      }
    } catch (e) {
      debugPrint('Media server upload failed via multipart FormData: $e');
    }
    return null;
  }
}
