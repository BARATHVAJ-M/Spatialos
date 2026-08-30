/// Immutable model representing uploaded media metadata matching `media_files` table.
class MediaFileModel {
  final String id;
  final String fileName;
  final String originalName;
  final String filePath;
  final String? thumbnailPath;
  final String mimeType;
  final int fileSize;
  final String uploadedBy;
  final DateTime createdAt;

  const MediaFileModel({
    required this.id,
    required this.fileName,
    required this.originalName,
    required this.filePath,
    this.thumbnailPath,
    required this.mimeType,
    required this.fileSize,
    required this.uploadedBy,
    required this.createdAt,
  });

  factory MediaFileModel.fromJson(Map<String, dynamic> json) {
    return MediaFileModel(
      id: (json['id'] ?? 'default-media-id').toString(),
      fileName: (json['file_name'] ?? json['fileName'] ?? 'media.jpg').toString(),
      originalName: (json['original_name'] ?? json['originalName'] ?? 'file').toString(),
      filePath: (json['file_path'] ?? json['filePath'] ?? '/storage/sample_ar_media.jpg').toString(),
      thumbnailPath: (json['thumbnail_path'] ?? json['thumbnailPath']) as String?,
      mimeType: (json['mime_type'] ?? json['mimeType'] ?? 'image/jpeg').toString(),
      fileSize: ((json['file_size'] ?? json['fileSize'] ?? 1024) as num).toInt(),
      uploadedBy: (json['uploaded_by'] ?? json['uploadedBy'] ?? 'admin-uuid').toString(),
      createdAt: DateTime.tryParse((json['created_at'] ?? json['createdAt'] ?? '').toString()) ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fileName': fileName,
      'file_name': fileName,
      'originalName': originalName,
      'original_name': originalName,
      'filePath': filePath,
      'file_path': filePath,
      'thumbnailPath': thumbnailPath,
      'thumbnail_path': thumbnailPath,
      'mimeType': mimeType,
      'mime_type': mimeType,
      'fileSize': fileSize,
      'file_size': fileSize,
      'uploadedBy': uploadedBy,
      'uploaded_by': uploadedBy,
      'createdAt': createdAt.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
    };
  }
}
