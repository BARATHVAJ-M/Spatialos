import '../shared/models/ar_content_model.dart';

/// Abstract repository for querying placed AR scenes by QR code.
abstract class IArContentRepository {
  Future<List<ArContentModel>> getContentForLocation(String qrCodeOrId);
}
