import 'dart:io';
import 'dart:ui';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/toast_service.dart';
import '../../../shared/widgets/glass_background.dart';
import '../../../shared/widgets/custom_text_field.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/models/qr_location_model.dart';
import '../providers/qr_location_provider.dart';

class GenerateQrScreen extends ConsumerStatefulWidget {
  const GenerateQrScreen({super.key});

  @override
  ConsumerState<GenerateQrScreen> createState() => _GenerateQrScreenState();
}

class _GenerateQrScreenState extends ConsumerState<GenerateQrScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descController = TextEditingController();
  final _buildingController = TextEditingController();
  final _floorController = TextEditingController();
  final _roomController = TextEditingController();
  bool _isGenerating = false;

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    _buildingController.dispose();
    _floorController.dispose();
    _roomController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isGenerating = true);
    final created = await ref.read(qrLocationsProvider.notifier).createLocation(
      locationName: _nameController.text.trim(),
      description: _descController.text.trim(),
      building: _buildingController.text.trim(),
      floor: _floorController.text.trim(),
      room: _roomController.text.trim(),
    );
    setState(() => _isGenerating = false);

    if (created != null && mounted) {
      _showSuccessDownloadModal(created);
    } else if (mounted) {
      ToastService.showError(context, 'Failed to generate QR Anchor. Try again.');
    }
  }

  void _showSuccessDownloadModal(QrLocationModel location) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
            child: Container(
              padding: const EdgeInsets.all(28),
              constraints: const BoxConstraints(maxWidth: 420),
              decoration: BoxDecoration(
                color: AppColors.surface.withValues(alpha: 0.85),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.glassBorder, width: 1.5),
                boxShadow: [
                  BoxShadow(color: AppColors.primary.withValues(alpha: 0.2), blurRadius: 30),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.check_circle, color: AppColors.success, size: 54),
                  const SizedBox(height: 12),
                  const Text(
                    'QR Anchor Generated!',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Print and paste this code onto physical surfaces:',
                    style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 20),
                  // Crisp Scannable QR Graphic Rendered
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.primary, width: 2),
                    ),
                    child: Column(
                      children: [
                        QrImageView(
                          data: location.qrCode, // Scanned by mobile AR cameras to load wall content
                          version: QrVersions.auto,
                          size: 190.0,
                          backgroundColor: Colors.white,
                          eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: Colors.black),
                          dataModuleStyle: const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: Colors.black),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          location.qrCode,
                          style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 1.2),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Download & Print CTA
                  PrimaryButton(
                    text: 'Download & Save PNG',
                    icon: Icons.download_rounded,
                    color: AppColors.accent,
                    onPressed: () async {
                      try {
                        final painter = QrPainter(
                          data: location.qrCode,
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
                        final file = File('${dir.path}/QR_${location.qrCode}.png');
                        await file.writeAsBytes(bytes);
                        
                        if (ctx.mounted) {
                          ToastService.showSuccess(ctx, 'Saved directly to phone Download/QR_${location.qrCode}.png!');
                        }
                      } catch (e) {
                        // Fallback to online generator if local permission issue occurs
                        final String qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${Uri.encodeComponent(location.qrCode)}';
                        final uri = Uri.parse(qrUrl);
                        if (await canLaunchUrl(uri)) {
                          await launchUrl(uri, mode: LaunchMode.externalApplication);
                        } else if (ctx.mounted) {
                          ToastService.showError(ctx, 'Could not save QR file: $e');
                        }
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () {
                      Navigator.of(ctx).pop();
                      context.pop(); // Go back to saved places / profile
                    },
                    child: const Text('Done', style: TextStyle(color: AppColors.textSecondary, fontSize: 15)),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: const Text('Generate Real-World QR Anchor', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: GlassBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 600),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                  child: Container(
                    padding: const EdgeInsets.all(28),
                    decoration: BoxDecoration(
                      color: AppColors.glassBackground,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: AppColors.glassBorder, width: 1.5),
                    ),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Physical Anchor Specification',
                            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Each QR code acts as an exact coordinate root for placing persistent 3D AR content.',
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                          ),
                          const SizedBox(height: 24),

                          CustomTextField(
                            controller: _nameController,
                            hintText: 'Location Title (e.g. IT Dept Notice Board)',
                            prefixIcon: Icons.place_outlined,
                            validator: (val) => val == null || val.isEmpty ? 'Title is required' : null,
                          ),
                          const SizedBox(height: 16),

                          CustomTextField(
                            controller: _descController,
                            hintText: 'Description & Guidance for Scanners',
                            prefixIcon: Icons.description_outlined,
                            maxLines: 3,
                            validator: (val) => val == null || val.isEmpty ? 'Description is required' : null,
                          ),
                          const SizedBox(height: 16),

                          Row(
                            children: [
                              Expanded(
                                child: CustomTextField(
                                  controller: _buildingController,
                                  hintText: 'Building (e.g. Block A)',
                                  prefixIcon: Icons.domain_outlined,
                                  validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: CustomTextField(
                                  controller: _floorController,
                                  hintText: 'Floor (e.g. 0, 1, 2)',
                                  prefixIcon: Icons.layers_outlined,
                                  keyboardType: TextInputType.number,
                                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                                  validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          CustomTextField(
                            controller: _roomController,
                            hintText: 'Room or Zone (e.g. Lobby 101)',
                            prefixIcon: Icons.meeting_room_outlined,
                            validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                          ),
                          const SizedBox(height: 32),

                          PrimaryButton(
                            text: 'Generate Scannable QR Anchor',
                            icon: Icons.qr_code_2,
                            isLoading: _isGenerating,
                            onPressed: _handleSubmit,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
