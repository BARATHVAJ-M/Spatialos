import 'dart:io';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/toast_service.dart';
import '../../../shared/models/qr_location_model.dart';
import '../providers/qr_location_provider.dart';

class SavedPlacesScreen extends ConsumerWidget {
  const SavedPlacesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locationsAsync = ref.watch(qrLocationsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text('QR Spots', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: const Color(0xFF0F172A),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline, size: 26, color: AppColors.accent),
            tooltip: 'Generate New QR Anchor',
            onPressed: () => context.push('/generate-qr'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: locationsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (err, _) => Center(child: Text('Error loading locations: $err', style: const TextStyle(color: AppColors.error))),
        data: (locations) {
          if (locations.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.location_off_outlined, size: 64, color: AppColors.textSecondary.withValues(alpha: 0.5)),
                  const SizedBox(height: 16),
                  const Text('No QR Anchors placed yet.', style: TextStyle(fontSize: 18, color: Colors.white)),
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.add_location_alt_outlined),
                    label: const Text('Create First Anchor'),
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
                    onPressed: () => context.push('/generate-qr'),
                  )
                ],
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
            itemCount: locations.length,
            separatorBuilder: (_, _) => const SizedBox(height: 16),
            itemBuilder: (context, index) {
              final item = locations[index];
              return _LocationGlassCard(item: item);
            },
          );
        },
      ),
    );
  }
}

class _LocationGlassCard extends ConsumerWidget {
  final QrLocationModel item;
  const _LocationGlassCard({required this.item});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GestureDetector(
      onTap: () => _showContentSummary(context, ref, item.qrCode),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.glassBorder, width: 1.2),
          boxShadow: const [BoxShadow(color: Colors.black54, blurRadius: 12, offset: Offset(0, 5))],
        ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.5)),
                ),
                child: Text(
                  item.qrCode,
                  style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 0.8),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  item.status,
                  style: const TextStyle(color: AppColors.success, fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(item.locationName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white)),
          const SizedBox(height: 4),
          Text(
            '${item.building} • ${item.floor} • ${item.room}',
            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 8),
          Text(item.description, style: const TextStyle(fontSize: 13, color: Colors.white70, fontStyle: FontStyle.italic)),
          const SizedBox(height: 16),
          const Divider(color: Colors.white12, height: 1),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton.icon(
                icon: const Icon(Icons.download_rounded, size: 18, color: AppColors.accent),
                label: const Text('Download QR', style: TextStyle(color: AppColors.accent, fontSize: 13, fontWeight: FontWeight.w600)),
                onPressed: () => _downloadQrCode(context, item.qrCode),
              ),
              const SizedBox(width: 8),
              TextButton.icon(
                icon: const Icon(Icons.view_in_ar, size: 18, color: Colors.blue),
                label: const Text('2D Plane Editor', style: TextStyle(color: Colors.blue, fontSize: 13)),
                onPressed: () => context.push('/plane-editor/${item.qrCode}'),
              ),
              const SizedBox(width: 8),
              TextButton.icon(
                icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.warning),
                label: const Text('Edit', style: TextStyle(color: AppColors.warning, fontSize: 13)),
                onPressed: () => _showEditDialog(context, ref, item),
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline, size: 20, color: AppColors.error),
                tooltip: 'Delete Anchor',
                onPressed: () => _showDeleteConfirmation(context, ref, item),
              ),
            ],
          ),
        ],
      ),
      ),
    );
  }

  void _showContentSummary(BuildContext context, WidgetRef ref, String qrCode) async {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E293B),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return FutureBuilder(
          future: ref.read(qrLocationsProvider.notifier).fetchScenePreview(qrCode),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const SizedBox(
                height: 200,
                child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
              );
            }
            if (snapshot.hasError || !snapshot.hasData) {
              return const SizedBox(
                height: 200,
                child: Center(child: Text('Failed to load content summary.', style: TextStyle(color: AppColors.error))),
              );
            }

            final data = snapshot.data as Map<String, dynamic>;
            final objects = data['objects'] as List<dynamic>? ?? [];
            int images = 0;
            int videos = 0;
            int texts = 0;
            List<String> fileNames = [];

            for (var obj in objects) {
              final type = obj['contentType'];
              final contentData = obj['contentData'] ?? {};
              if (type == 'IMAGE') {
                images++;
                fileNames.add(contentData['originalName'] ?? contentData['fileName'] ?? 'Image');
              } else if (type == 'VIDEO') {
                videos++;
                fileNames.add(contentData['originalName'] ?? contentData['fileName'] ?? 'Video');
              } else if (type == 'TEXT') {
                texts++;
                fileNames.add(contentData['title'] ?? 'Text Note');
              }
            }

            return Container(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Content Summary for $qrCode', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 16),
                  Text('Images: $images | Videos: $videos | Text Notes: $texts', style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  const Text('Attached Files:', style: TextStyle(color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  if (fileNames.isEmpty)
                    const Text('No content attached yet.', style: TextStyle(color: Colors.white54, fontStyle: FontStyle.italic))
                  else
                    ...fileNames.map((name) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            children: [
                              const Icon(Icons.insert_drive_file, size: 16, color: Colors.white54),
                              const SizedBox(width: 8),
                              Expanded(child: Text(name, style: const TextStyle(color: Colors.white))),
                            ],
                          ),
                        )),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _downloadQrCode(BuildContext context, String qrCode) async {
    try {
      final painter = QrPainter(
        data: qrCode,
        version: QrVersions.auto,
        color: const Color(0xFF000000),
        emptyColor: const Color(0xFFFFFFFF),
        gapless: true,
      );
      final image = await painter.toImage(600);
      final byteData = await image.toByteData(format: ImageByteFormat.png);
      final bytes = byteData!.buffer.asUint8List();
      
      final dir = Directory('/storage/emulated/0/Download');
      if (!await dir.exists()) {
        await dir.create(recursive: true);
      }
      final file = File('${dir.path}/QR_$qrCode.png');
      await file.writeAsBytes(bytes);
      
      if (context.mounted) {
        ToastService.showSuccess(context, 'Saved directly to phone Download/QR_$qrCode.png!');
      }
    } catch (e) {
      final String qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${Uri.encodeComponent(qrCode)}';
      final uri = Uri.parse(qrUrl);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else if (context.mounted) {
        ToastService.showError(context, 'Could not save QR file: $e');
      }
    }
  }

  void _showEditDialog(BuildContext context, WidgetRef ref, QrLocationModel item) {
    final nameCtrl = TextEditingController(text: item.locationName);
    final buildCtrl = TextEditingController(text: item.building);
    final floorCtrl = TextEditingController(text: item.floor);
    final roomCtrl = TextEditingController(text: item.room);
    final descCtrl = TextEditingController(text: item.description);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: AppColors.glassBorder)),
        title: Text('Edit ${item.qrCode} Details', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDialogField('Location Name', nameCtrl, Icons.place_outlined),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: _buildDialogField('Building', buildCtrl, Icons.domain_outlined)),
                  const SizedBox(width: 8),
                  Expanded(child: _buildDialogField('Floor', floorCtrl, Icons.layers_outlined)),
                ],
              ),
              const SizedBox(height: 12),
              _buildDialogField('Room / Area', roomCtrl, Icons.meeting_room_outlined),
              const SizedBox(height: 12),
              _buildDialogField('Description', descCtrl, Icons.notes_outlined, maxLines: 2),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.white70)),
          ),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            icon: const Icon(Icons.save_outlined, size: 18),
            label: const Text('Save Changes'),
            onPressed: () {
              final updated = item.copyWith(
                locationName: nameCtrl.text.trim(),
                building: buildCtrl.text.trim(),
                floor: floorCtrl.text.trim(),
                room: roomCtrl.text.trim(),
                description: descCtrl.text.trim(),
              );
              ref.read(qrLocationsProvider.notifier).updateLocation(updated);
              Navigator.pop(ctx);
              ToastService.showSuccess(context, 'Successfully updated location details!');
            },
          ),
        ],
      ),
    );
  }

  Widget _buildDialogField(String label, TextEditingController ctrl, IconData icon, {int maxLines = 1}) {
    return TextField(
      controller: ctrl,
      maxLines: maxLines,
      style: const TextStyle(color: Colors.white, fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: AppColors.textSecondary),
        prefixIcon: Icon(icon, size: 18, color: AppColors.primary),
        filled: true,
        fillColor: const Color(0xFF0F172A),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.white12)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.white12)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primary)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      ),
    );
  }

  void _showDeleteConfirmation(BuildContext context, WidgetRef ref, QrLocationModel item) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.error, width: 1.5),
        ),
        title: Row(
          children: [
            const Icon(Icons.warning_amber_rounded, color: AppColors.error, size: 28),
            const SizedBox(width: 10),
            const Expanded(
              child: Text(
                'Delete QR Location & Data?',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Are you completely sure you want to delete "${item.locationName}" (${item.qrCode})?',
              style: const TextStyle(color: Colors.white70, fontSize: 15),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.error.withValues(alpha: 0.4)),
              ),
              child: const Text(
                '⚠️ WARNING: Deleting this location will permanently wipe out the QR code, all placed AR photos, videos, text notes, and physical media files from both your laptop storage and the database. This action cannot be undone!',
                style: TextStyle(color: Color(0xFFFFB4AB), fontSize: 13, height: 1.4, fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
        actionsAlignment: MainAxisAlignment.end,
        actionsOverflowDirection: VerticalDirection.down,
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.white70)),
          ),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.warning,
              foregroundColor: const Color(0xFF1E293B),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            icon: const Icon(Icons.clear_all_rounded, size: 18),
            label: const Text('Delete Content Only', style: TextStyle(fontWeight: FontWeight.bold)),
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(qrLocationsProvider.notifier).deleteLocationContent(item.id);
              ToastService.showSuccess(context, 'Wiped all AR photos, videos & notes from storage & DB for ${item.locationName}!');
            },
          ),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            icon: const Icon(Icons.delete_forever, size: 18),
            label: const Text('Delete QR & Content'),
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(qrLocationsProvider.notifier).deleteLocation(item.id);
              ToastService.showSuccess(context, 'Successfully removed ${item.locationName} and wiped all associated AR media files.');
            },
          ),
        ],
      ),
    );
  }
}
