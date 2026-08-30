import 'package:uuid/uuid.dart';
import 'ar_content_repository_interface.dart';
import '../shared/models/ar_content_model.dart';
import '../shared/models/media_file_model.dart';
import '../shared/models/text_content_model.dart';
import '../shared/models/ar_transform_model.dart';

/// Mock in-memory AR content repository managing 2D/3D placements on walls.
class MockArContentRepository implements IArContentRepository {
  final List<ArContentModel> _contents = [];

  @override
  Future<List<ArContentModel>> getContentForLocation(String qrLocationId) async {
    await Future.delayed(const Duration(milliseconds: 200));
    return _contents.where((c) => c.qrLocationId == qrLocationId).toList();
  }

  @override
  Future<ArContentModel> createMediaContent({
    required String qrLocationId,
    required ArContentType type,
    required MediaFileModel mediaFile,
    required ArTransformModel initialTransform,
    int expiryDays = 7,
  }) async {
    final uuid = const Uuid().v4();
    final newContent = ArContentModel(
      id: uuid,
      qrLocationId: qrLocationId,
      contentType: type,
      contentReferenceId: mediaFile.id,
      createdBy: 'admin-uuid-001',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      mediaFile: mediaFile,
      transform: initialTransform.copyWith(),
    );
    _contents.add(newContent);
    return newContent;
  }

  @override
  Future<ArContentModel> createTextContent({
    required String qrLocationId,
    required TextContentModel textModel,
    required ArTransformModel initialTransform,
    int expiryDays = 7,
  }) async {
    final uuid = const Uuid().v4();
    final newContent = ArContentModel(
      id: uuid,
      qrLocationId: qrLocationId,
      contentType: ArContentType.text,
      contentReferenceId: textModel.id,
      createdBy: 'admin-uuid-001',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      textContent: textModel,
      transform: initialTransform.copyWith(),
    );
    _contents.add(newContent);
    return newContent;
  }

  @override
  Future<void> updateTransform(ArTransformModel updatedTransform) async {
    final index = _contents.indexWhere((c) => c.transform?.id == updatedTransform.id || c.id == updatedTransform.arContentId);
    if (index != -1) {
      _contents[index] = _contents[index].copyWith(transform: updatedTransform);
    }
  }

  @override
  Future<void> updateContent(ArContentModel updatedItem) async {
    final index = _contents.indexWhere((c) => c.id == updatedItem.id);
    if (index != -1) {
      _contents[index] = updatedItem;
    }
  }

  @override
  Future<void> deleteContent(String contentId) async {
    _contents.removeWhere((c) => c.id == contentId);
  }

  @override
  Future<String?> uploadMediaFile({
    required List<int> bytes,
    required String fileName,
    required String mimeType,
  }) async {
    return '/storage/mock_$fileName';
  }
}

