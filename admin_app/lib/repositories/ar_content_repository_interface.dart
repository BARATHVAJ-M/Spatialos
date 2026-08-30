import '../shared/models/ar_content_model.dart';
import '../shared/models/media_file_model.dart';
import '../shared/models/text_content_model.dart';
import '../shared/models/ar_transform_model.dart';

/// Abstract repository for creating and managing AR objects and transformations.
abstract class IArContentRepository {
  Future<List<ArContentModel>> getContentForLocation(String qrLocationId);
  Future<ArContentModel> createMediaContent({
    required String qrLocationId,
    required ArContentType type,
    required MediaFileModel mediaFile,
    required ArTransformModel initialTransform,
    int expiryDays = 7,
  });
  Future<ArContentModel> createTextContent({
    required String qrLocationId,
    required TextContentModel textModel,
    required ArTransformModel initialTransform,
    int expiryDays = 7,
  });
  Future<void> updateTransform(ArTransformModel updatedTransform);
  Future<void> updateContent(ArContentModel updatedItem);
  Future<String?> uploadMediaFile({
    required List<int> bytes,
    required String fileName,
    required String mimeType,
  });
  Future<void> deleteContent(String contentId);
}

