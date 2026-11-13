import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/config/api_config.dart';
import '../../core/services/api_service.dart';
import '../../core/theme/app_colors.dart';
import '../models/ar_content_model.dart';
import 'ar_video_player_widget.dart';
import '../../features/mini_apps/classroom_mini_app.dart';
import '../../features/mini_apps/coffee_mini_app.dart';
import '../../features/mini_apps/complaint_box_mini_app.dart';
import '../../features/mini_apps/notice_board_mini_app.dart';
import '../../features/mini_apps/staff_details_mini_app.dart';

/// Factory Widget that resolves and renders individual AR nodes (Text, Image, Video, Plane, Mini-App)
class ArContentWidgetFactory extends ConsumerWidget {
  final ArContentModel item;

  const ArContentWidgetFactory({super.key, required this.item});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (item.contentType == ArContentType.text && item.textContent != null) {
      final text = item.textContent!;
      return Container(
        width: 320,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: text.parsedBackgroundColor,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white24, width: 1.5),
          boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 18, offset: Offset(0, 8))],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(text.title, style: TextStyle(color: text.parsedTextColor, fontSize: 20, fontWeight: FontWeight.bold, fontFamily: text.fontFamily)),
            if (text.paragraph.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(text.paragraph, style: TextStyle(color: text.parsedTextColor.withValues(alpha: 0.85), fontSize: 14, fontFamily: text.fontFamily)),
            ]
          ],
        ),
      );
    } else if (item.mediaFile != null) {
      var rawPath = item.mediaFile!.filePath;
      if (rawPath.startsWith('/storage/')) {
        rawPath = '${ref.read(apiConfigProvider).serverUrl.replaceFirst(RegExp(r'/$'), '')}$rawPath';
      }
      final isValidUrl = rawPath.startsWith('http://') || rawPath.startsWith('https://') || rawPath.startsWith('blob:') || rawPath.startsWith('data:');
      final isLocalFile = !isValidUrl && !kIsWeb;
      final isVideo = item.contentType == ArContentType.video || item.mediaFile!.mimeType.toLowerCase().contains('video');

      if (isVideo) {
        return Container(
          width: 320,
          height: 240,
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white24, width: 1.5),
            boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 18, offset: Offset(0, 8))],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: ArVideoPlayerWidget(key: ValueKey(rawPath), videoUrl: rawPath, isLocalFile: isLocalFile),
          ),
        );
      }

      return Container(
        constraints: const BoxConstraints(maxWidth: 320, maxHeight: 380),
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Colors.white24, width: 2),
          boxShadow: const [BoxShadow(color: Colors.black54, blurRadius: 20, offset: Offset(0, 10))],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: isValidUrl
              ? Image.network(
                  rawPath,
                  key: ValueKey(rawPath),
                  headers: ApiService.syncToken != null ? {'Authorization': 'Bearer ${ApiService.syncToken}'} : null,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) => Container(
                    padding: const EdgeInsets.all(12),
                    alignment: Alignment.center,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.broken_image_rounded, size: 40, color: AppColors.warning),
                        const SizedBox(height: 6),
                        Text('Image path not reachable:\n${rawPath.split('/').last}', textAlign: TextAlign.center, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                      ],
                    ),
                  ),
                )
              : (isLocalFile
                  ? Image.file(
                      File(item.mediaFile!.filePath),
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => const Center(child: Icon(Icons.broken_image, size: 40, color: Colors.orange)),
                    )
                  : const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add_photo_alternate_rounded, size: 48, color: AppColors.accent),
                          SizedBox(height: 8),
                          Text('Offline Media', style: TextStyle(color: Colors.white, fontSize: 12)),
                        ],
                      ),
                    )),
        ),
      );
    } else if (item.contentType == ArContentType.plane) {
      final width = item.planeContent?.width ?? 1.0;
      final height = item.planeContent?.height ?? 1.0;
      return Container(
        width: 300 * width,
        height: 300 * height,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.1),
          border: Border.all(color: Colors.white70, width: 2),
          borderRadius: BorderRadius.circular(12),
        ),
      );
    } else if (item.contentType == ArContentType.miniapp) {
      switch (item.miniAppContent?.appId) {
        case 'COFFEE_MINI_APP':
          return const CoffeeMiniApp();
        case 'NOTICE_BOARD':
          return NoticeBoardMiniApp(item: item);
        case 'CLASSROOM':
          return ClassroomMiniApp(item: item);
        case 'COMPLAINT_BOX':
          return ComplaintBoxMiniApp(item: item);
        case 'STAFF_DETAILS':
          return StaffDetailsMiniApp(item: item);
        default:
          return Container(
            width: 320,
            padding: const EdgeInsets.all(16),
            color: Colors.red.withValues(alpha: 0.8),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('MiniApp Failed to Load', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 8),
                Text('Experience ID: ${item.qrLocationId}', style: const TextStyle(color: Colors.white, fontSize: 12)),
                Text('Service ID: ${item.contentReferenceId}', style: const TextStyle(color: Colors.white, fontSize: 12)),
                Text('Service Type: ${item.miniAppContent?.appId}', style: const TextStyle(color: Colors.white, fontSize: 12)),
                const Text('Operation: Service Resolver', style: TextStyle(color: Colors.white, fontSize: 12)),
                const Text('Error: Unknown MiniApp Type', style: TextStyle(color: Colors.white, fontSize: 12)),
              ],
            ),
          );
      }
    }

    return Container(
      width: 320,
      padding: const EdgeInsets.all(16),
      color: Colors.red.withValues(alpha: 0.8),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('AR Content Failed to Load', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          Text('Experience ID: ${item.qrLocationId}', style: const TextStyle(color: Colors.white, fontSize: 12)),
          Text('Content ID: ${item.id}', style: const TextStyle(color: Colors.white, fontSize: 12)),
          Text('Content Type: ${item.contentType.toString()}', style: const TextStyle(color: Colors.white, fontSize: 12)),
          const Text('Operation: Render Content', style: TextStyle(color: Colors.white, fontSize: 12)),
          const Text('Error: Unhandled Content Type', style: TextStyle(color: Colors.white, fontSize: 12)),
        ],
      ),
    );
  }
}
