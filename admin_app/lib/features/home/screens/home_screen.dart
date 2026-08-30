import 'dart:io';
import 'dart:ui';
import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:uuid/uuid.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/toast_service.dart';
import '../../../core/config/api_config.dart';
import '../../../shared/models/ar_content_model.dart';
import '../../../shared/models/ar_transform_model.dart';
import '../../../shared/models/media_file_model.dart';
import '../../../shared/models/text_content_model.dart';
import '../../../repositories/repository_providers.dart';
import '../../text/widgets/ar_text_editor_dialog.dart';
import '../../placement/widgets/ar_object_manipulator.dart';
import '../../qr/providers/qr_location_provider.dart';
import '../../placement/widgets/ar_video_player_widget.dart';
import 'dart:async';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  late final MobileScannerController _scannerController;
  String? _activeLocationId; // null initially until scanned or selected
  String? _selectedContentId;
  List<ArContentModel> _wallContents = [];
  bool _permissionsGranted = kIsWeb;
  bool _isScanningActive = false;
  bool _isValidatingQr = false;
  bool _isProcessingMedia = false;
  Offset? _liveQrAnchorCenter; // Tracked physical center of the real-world QR marker on camera view
  double _liveQrScale = 1.0;
  double _liveQrAngle = 0.0;
  double _liveQrPitch = 0.0; // Vertical 3D perspective tilt
  double _liveQrYaw = 0.0;   // Horizontal sideways 3D plane tilt
  DateTime _lastQrSeenTime = DateTime.fromMillisecondsSinceEpoch(0);

  @override
  void initState() {
    super.initState();
    // Unrestricted speed enables real-time 30-60 FPS AR plane coordinate tracking
    _scannerController = MobileScannerController(
      detectionSpeed: DetectionSpeed.unrestricted,
      facing: CameraFacing.back,
      torchEnabled: false,
    );
    _requestPermissions();
  }

  @override
  void dispose() {
    _scannerController.dispose();
    super.dispose();
  }

  Future<void> _requestPermissions() async {
    if (!kIsWeb) {
      final cameraStatus = await Permission.camera.request();
      final storageStatus = await Permission.storage.request();
      setState(() {
        _permissionsGranted = cameraStatus.isGranted || cameraStatus.isLimited;
      });
      if (!_permissionsGranted && mounted) {
        ToastService.showError(context, 'Camera permission is required to scan AR QR anchors.');
      }
    } else {
      setState(() {
        _permissionsGranted = true;
      });
    }
  }

  Future<void> _loadLocationContents() async {
    if (_activeLocationId == null) return;
    final repo = ref.read(arContentRepositoryProvider);
    try {
      final list = await repo.getContentForLocation(_activeLocationId!);
      if (mounted) {
        setState(() {
          _wallContents = List.from(list);
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _wallContents = [];
        });
      }
    }
  }

  Future<void> _validateAndLockQr(String code) async {
    if (_isValidatingQr || !_isScanningActive || _activeLocationId != null) return;
    setState(() => _isValidatingQr = true);

    // Strict validation: Must match SpatialOS format and exist in DB
    if (!code.startsWith('LOC-')) {
      if (mounted) {
        ToastService.showError(context, 'QR code not recognized! Not an official database QR location.');
      }
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) setState(() => _isValidatingQr = false);
      return;
    }

    final repo = ref.read(qrLocationRepositoryProvider);
    try {
      final loc = await repo.getLocationById(code);
      if (loc != null) {
        if (mounted) {
          setState(() {
            _activeLocationId = code;
            _isScanningActive = false;
            _isValidatingQr = false;
          });
          _loadLocationContents();
          ToastService.showSuccess(context, 'Locked onto verified DB QR: $code');
        }
        return;
      }
    } catch (e) {
      debugPrint('QR DB verification failed: $e');
    }

    if (mounted) {
      ToastService.showError(context, 'QR not recognized or deleted! You cannot upload content to an unverified location.');
    }
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) setState(() => _isValidatingQr = false);
  }

  void _showManualAnchorSelectionModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Consumer(
        builder: (ctx, ref, _) {
          final locationsAsync = ref.watch(qrLocationsProvider);
          return Container(
            padding: const EdgeInsets.all(28),
            constraints: BoxConstraints(maxHeight: MediaQuery.of(ctx).size.height * 0.75),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
              border: Border.all(color: AppColors.glassBorder, width: 1.5),
              boxShadow: const [
                BoxShadow(color: Colors.black87, blurRadius: 30, offset: Offset(0, -5)),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Select Spatial QR Anchor', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
                        SizedBox(height: 4),
                        Text('Choose a real database location anchor to attach or view AR content', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: AppColors.textSecondary),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                const Divider(color: Colors.white12),
                const SizedBox(height: 12),
                Expanded(
                  child: locationsAsync.when(
                    loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
                    error: (e, _) => Center(child: Text('Error loading anchors: $e', style: const TextStyle(color: AppColors.error))),
                    data: (locations) {
                      if (locations.isEmpty) {
                        return Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.qr_code_2_outlined, size: 54, color: AppColors.textSecondary),
                              const SizedBox(height: 16),
                              const Text('No QR Anchors in Database Yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                              const SizedBox(height: 6),
                              const Text('Generate your first spatial location marker from Profile -> Saved Places!', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                              const SizedBox(height: 20),
                              ElevatedButton.icon(
                                icon: const Icon(Icons.add_location_alt_outlined),
                                label: const Text('Go to Saved Places'),
                                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                                onPressed: () {
                                  Navigator.pop(ctx);
                                  context.push('/profile');
                                },
                              ),
                            ],
                          ),
                        );
                      }
                      return ListView.separated(
                        itemCount: locations.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 14),
                        itemBuilder: (context, index) {
                          final loc = locations[index];
                          return InkWell(
                            onTap: () {
                              Navigator.pop(ctx);
                              try {
                                _scannerController.stop();
                              } catch (_) {}
                              setState(() {
                                _activeLocationId = loc.qrCode;
                                _isScanningActive = false;
                              });
                              _loadLocationContents();
                              ToastService.showSuccess(context, 'Locked onto Anchor: ${loc.locationName} (${loc.qrCode})');
                            },
                            borderRadius: BorderRadius.circular(18),
                            child: Container(
                              padding: const EdgeInsets.all(18),
                              decoration: BoxDecoration(
                                color: const Color(0xFF1E293B),
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(color: AppColors.primary.withValues(alpha: 0.35), width: 1.5),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary.withValues(alpha: 0.2),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.qr_code_2, color: AppColors.accent, size: 26),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(loc.locationName, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 17)),
                                        const SizedBox(height: 4),
                                        Text('${loc.qrCode} • ${loc.building} (${loc.room})', style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                                      ],
                                    ),
                                  ),
                                  const Icon(Icons.arrow_forward_ios_rounded, color: AppColors.textSecondary, size: 18),
                                ],
                              ),
                            ),
                          );
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildCameraFallback(BuildContext context, String errorReason) {
    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF1E293B), Color(0xFF090D16)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(28),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 460),
            child: Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.glassBorder, width: 1.5),
                boxShadow: const [
                  BoxShadow(color: Colors.black87, blurRadius: 30),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: AppColors.warning.withValues(alpha: 0.2), shape: BoxShape.circle),
                    child: const Icon(Icons.videocam_off_outlined, color: AppColors.warning, size: 48),
                  ),
                  const SizedBox(height: 18),
                  const Text(
                    'Browser Camera Security Notice',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Live Video Streaming is restricted by mobile web browsers over unsecure local HTTP connections. To seamlessly place and test AR content over Wi-Fi without SSL setup, choose an anchor below:',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.list_alt_rounded, size: 22),
                      label: const Text('SELECT ANCHOR FROM DATABASE', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 8,
                      ),
                      onPressed: _showManualAnchorSelectionModal,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Tip: All created QR locations from your database appear instantly in this list.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 11, color: AppColors.textSecondary.withValues(alpha: 0.7), fontStyle: FontStyle.italic),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showEditActionModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
          border: Border.all(color: AppColors.glassBorder, width: 1.5),
          boxShadow: const [
            BoxShadow(color: Colors.black87, blurRadius: 30, offset: Offset(0, -5)),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Add or Update Wall Object', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
                    SizedBox(height: 4),
                    Text('Select content to attach onto this physical wall anchor', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: AppColors.textSecondary),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: _UploadOptionCard(
                    icon: Icons.photo_library_rounded,
                    title: 'Upload Photo',
                    subtitle: 'Image from gallery',
                    color: AppColors.primary,
                    onTap: () {
                      Navigator.pop(ctx);
                      _addMediaOverlay(false);
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _UploadOptionCard(
                    icon: Icons.videocam_rounded,
                    title: 'Upload Video',
                    subtitle: 'Video clip from device',
                    color: AppColors.info,
                    onTap: () {
                      Navigator.pop(ctx);
                      _addMediaOverlay(true);
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _UploadOptionCard(
                    icon: Icons.text_fields_rounded,
                    title: 'Add Text',
                    subtitle: 'Type note on wall',
                    color: AppColors.accent,
                    onTap: () {
                      Navigator.pop(ctx);
                      _addTextOverlay();
                    },
                  ),
                ),
              ],
            ),
            if (_wallContents.isNotEmpty) ...[
              const SizedBox(height: 20),
              const Divider(color: Colors.white12),
              const SizedBox(height: 12),
              const Text('Objects Assigned to this Anchor:', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
              const SizedBox(height: 8),
              SizedBox(
                height: 60,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: _wallContents.length,
                  itemBuilder: (context, index) {
                    final item = _wallContents[index];
                    return Container(
                      margin: const EdgeInsets.only(right: 12),
                      child: ActionChip(
                        avatar: Icon(
                          item.contentType == ArContentType.text ? Icons.text_snippet : Icons.image,
                          color: AppColors.accent,
                          size: 18,
                        ),
                        label: Text(
                          item.contentType == ArContentType.text ? (item.textContent?.title ?? 'Text Box') : (item.mediaFile?.originalName ?? 'Photo'),
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                        backgroundColor: const Color(0xFF1E293B),
                        side: BorderSide(color: AppColors.glassBorder),
                        onPressed: () {
                          Navigator.pop(ctx);
                          setState(() {
                            _selectedContentId = item.id;
                          });
                          ToastService.show(context, 'Entered transform adjustments for object.');
                        },
                      ),
                    );
                  },
                ),
              ),
            ],
            const SizedBox(height: 14),
          ],
        ),
      ),
    );
  }

  Future<int?> _promptForExpiryDays() async {
    int selectedDays = 7;
    return showDialog<int>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            backgroundColor: AppColors.surface,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: AppColors.glassBorder)),
            title: const Row(
              children: [
                Icon(Icons.timer_outlined, color: AppColors.primary, size: 22),
                SizedBox(width: 10),
                Text('Set Content Expiry', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Choose how many days this AR object will stay active on the physical wall before automatic cleanup (1 - 30 days):',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Duration:', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(8), border: Border.all(color: AppColors.primary)),
                      child: Text('$selectedDays ${selectedDays == 1 ? 'Day' : 'Days'}', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 15)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SliderTheme(
                  data: SliderThemeData(activeTrackColor: AppColors.primary, thumbColor: Colors.white, inactiveTrackColor: AppColors.glassBorder),
                  child: Slider(
                    value: selectedDays.toDouble(),
                    min: 1,
                    max: 30,
                    divisions: 29,
                    label: '$selectedDays days',
                    onChanged: (val) => setDialogState(() => selectedDays = val.toInt()),
                  ),
                ),
                const SizedBox(height: 8),
                const Center(child: Text('Required by System Security Policy', style: TextStyle(fontSize: 11, color: AppColors.textDisabled, fontStyle: FontStyle.italic))),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, null),
                child: const Text('CANCEL', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                onPressed: () => Navigator.pop(ctx, selectedDays),
                child: const Text('PROCEED', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _addTextOverlay() async {
    if (_isProcessingMedia) {
      if (mounted) ToastService.showError(context, 'An operation is currently processing. Please wait!');
      return;
    }
    final expiryDays = await _promptForExpiryDays();
    if (expiryDays == null || !mounted) return; // User canceled expiry selection or widget unmounted

    final newText = await showDialog<TextContentModel>(
      context: context,
      builder: (_) => const ArTextEditorDialog(),
    );

    if (newText != null && _activeLocationId != null) {
      setState(() => _isProcessingMedia = true);
      try {
        final repo = ref.read(arContentRepositoryProvider);
        final initialTrans = ArTransformModel(id: 'trans-${const Uuid().v4()}', arContentId: newText.id, positionX: -160.0, positionY: -280.0, updatedAt: DateTime.now());
        final item = await repo.createTextContent(
          qrLocationId: _activeLocationId!,
          textModel: newText,
          initialTransform: initialTrans,
          expiryDays: expiryDays,
        ).timeout(const Duration(seconds: 20), onTimeout: () => throw TimeoutException('Saving text placement timed out.'));
        if (mounted) {
          setState(() {
            _wallContents.add(item);
            _selectedContentId = item.id;
          });
          ToastService.showSuccess(context, 'Text placed! Adjust location & rotate, then click DONE.');
        }
      } catch (e) {
        if (mounted) ToastService.showError(context, 'Error saving text: ${e.toString().replaceAll("Exception: ", "")}');
      } finally {
        if (mounted) setState(() => _isProcessingMedia = false);
      }
    }
  }

  Future<void> _addMediaOverlay(bool isVideo) async {
    if (_isProcessingMedia) {
      if (mounted) ToastService.showError(context, 'An upload is currently in progress. Please wait until it completes!');
      return;
    }
    final expiryDays = await _promptForExpiryDays();
    if (expiryDays == null) return; // User canceled expiry selection

    setState(() => _isProcessingMedia = true);
    try {
      final picker = ImagePicker();
      final xFile = isVideo 
          ? await picker.pickVideo(source: ImageSource.gallery)
          : await picker.pickImage(source: ImageSource.gallery);

      if (xFile == null) {
        setState(() => _isProcessingMedia = false);
        return;
      }

      if (_activeLocationId != null) {
        if (mounted) ToastService.show(context, isVideo ? 'Uploading video to server storage...' : 'Uploading media file to server storage...');
        
        final repo = ref.read(arContentRepositoryProvider);
        final bytes = await xFile.readAsBytes().timeout(
          const Duration(seconds: 45),
          onTimeout: () => throw TimeoutException('Reading file from disk timed out.'),
        );
        
        String? serverUrl = await repo.uploadMediaFile(
          bytes: bytes,
          fileName: xFile.name,
          mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
        ).timeout(
          const Duration(seconds: 60),
          onTimeout: () => throw TimeoutException('Server upload timed out.'),
        );

        if (serverUrl != null && mounted) {
          ToastService.showSuccess(context, isVideo ? 'Saved video into /storage/video/ folder!' : 'Saved photo into /storage/image/ folder!');
        }

        final media = MediaFileModel(
          id: const Uuid().v4(),
          fileName: xFile.name,
          originalName: xFile.name,
          filePath: serverUrl ?? xFile.path,
          mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
          fileSize: bytes.length,
          uploadedBy: 'admin',
          createdAt: DateTime.now(),
        );
        final initialTrans = ArTransformModel(id: 'trans-${media.id}', arContentId: media.id, positionX: -160.0, positionY: -300.0, updatedAt: DateTime.now());
        final item = await repo.createMediaContent(
          qrLocationId: _activeLocationId!,
          type: isVideo ? ArContentType.video : ArContentType.image,
          mediaFile: media,
          initialTransform: initialTrans,
          expiryDays: expiryDays,
        ).timeout(
          const Duration(seconds: 30),
          onTimeout: () => throw TimeoutException('Saving AR placement timed out.'),
        );
        if (mounted) {
          setState(() {
            _wallContents.add(item);
            _selectedContentId = item.id;
          });
          ToastService.showSuccess(context, isVideo ? 'Video placed & stored! Adjust position, then click DONE.' : 'Photo placed & stored on laptop! Adjust position, then click DONE.');
        }
      }
    } catch (e) {
      if (mounted) {
        ToastService.showError(context, 'Upload error or timeout: ${e.toString().replaceAll("Exception: ", "")}');
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessingMedia = false);
      }
    }
  }

  void _editSelectedItem() async {
    if (_selectedContentId == null || _isProcessingMedia) {
      if (_isProcessingMedia && mounted) {
        ToastService.showError(context, 'An upload or modification is currently processing. Please wait!');
      }
      return;
    }
    final index = _wallContents.indexWhere((c) => c.id == _selectedContentId);
    if (index == -1) return;
    final item = _wallContents[index];

    if (item.contentType == ArContentType.text && item.textContent != null) {
      final updated = await showDialog<TextContentModel>(
        context: context,
        builder: (_) => ArTextEditorDialog(existingText: item.textContent),
      );
      if (updated != null && mounted) {
        setState(() => _isProcessingMedia = true);
        try {
          final updatedItem = item.copyWith(textContent: updated);
          await ref.read(arContentRepositoryProvider).updateContent(updatedItem).timeout(const Duration(seconds: 20));
          if (mounted) {
            setState(() => _wallContents[index] = updatedItem);
            ToastService.showSuccess(context, 'Updated & saved text styling in DB!');
          }
        } catch (e) {
          if (mounted) ToastService.showError(context, 'Update error: $e');
        } finally {
          if (mounted) setState(() => _isProcessingMedia = false);
        }
      }
    } else {
      final isVideo = item.contentType == ArContentType.video;
      final picker = ImagePicker();
      final xFile = isVideo 
          ? await picker.pickVideo(source: ImageSource.gallery)
          : await picker.pickImage(source: ImageSource.gallery);

      if (xFile != null && mounted) {
        setState(() => _isProcessingMedia = true);
        try {
          ToastService.show(context, 'Uploading replacement file to server storage...');
          final repo = ref.read(arContentRepositoryProvider);
          final bytes = await xFile.readAsBytes().timeout(const Duration(seconds: 45));
          
          String? serverUrl = await repo.uploadMediaFile(
            bytes: bytes,
            fileName: xFile.name,
            mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
          ).timeout(const Duration(seconds: 60), onTimeout: () => throw TimeoutException('File upload timed out.'));
          if (serverUrl != null && mounted) {
            ToastService.showSuccess(context, 'Updated physical file on server!');
          }

          final oldMedia = item.mediaFile;
          if (oldMedia != null) {
            final newMedia = MediaFileModel(
              id: oldMedia.id,
              fileName: xFile.name,
              originalName: xFile.name,
              filePath: serverUrl ?? xFile.path,
              mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
              fileSize: bytes.length,
              uploadedBy: 'admin',
              createdAt: DateTime.now(),
            );
            final updatedItem = item.copyWith(mediaFile: newMedia);
            await repo.updateContent(updatedItem).timeout(const Duration(seconds: 20));
            if (mounted) {
              setState(() => _wallContents[index] = updatedItem);
              ToastService.showSuccess(context, 'Successfully replaced physical media & saved to DB!');
            }
          }
        } catch (e) {
          if (mounted) ToastService.showError(context, 'Replacement upload error: ${e.toString().replaceAll("Exception: ", "")}');
        } finally {
          if (mounted) setState(() => _isProcessingMedia = false);
        }
      }
    }
  }

  void _deleteSelectedItem() async {
    if (_selectedContentId == null || _isProcessingMedia) return;
    final idToDelete = _selectedContentId!;
    setState(() => _isProcessingMedia = true);
    try {
      await ref.read(arContentRepositoryProvider).deleteContent(idToDelete).timeout(const Duration(seconds: 25));
      if (mounted) {
        setState(() {
          _wallContents.removeWhere((c) => c.id == idToDelete);
          _selectedContentId = null;
        });
        ToastService.show(context, 'Deleted object & physical storage file cleanly.', color: AppColors.error, icon: Icons.delete_forever);
      }
    } catch (e) {
      if (mounted) ToastService.showError(context, 'Deletion error: $e');
    } finally {
      if (mounted) setState(() => _isProcessingMedia = false);
    }
  }

  void _handleCancelOrRescan() {
    setState(() {
      _selectedContentId = null;
      _activeLocationId = null;
      _wallContents.clear();
      _isScanningActive = false;
    });
    try {
      _scannerController.start();
    } catch (_) {}
    ToastService.show(context, 'Returned to scanner view. Tap Scan to activate camera detection.', icon: Icons.qr_code_scanner);
  }

  void _handleDoneSaving() {
    setState(() {
      _selectedContentId = null;
    });
    ToastService.showSuccess(context, 'Object locked on wall! You can continue editing or cancel.');
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isEditingObject = _selectedContentId != null;
    final isScanned = _activeLocationId != null;

    if (!_permissionsGranted) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.camera_alt_outlined, size: 64, color: AppColors.primary),
              const SizedBox(height: 20),
              const Text('Camera Permission Required', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(height: 8),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 40),
                child: Text('To scan physical QR anchors and view AR layers, please grant camera access.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textSecondary)),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _requestPermissions,
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14)),
                child: const Text('Grant Permissions'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      body: Stack(
        children: [
          // 1. Live Camera Viewfinder always active for real-world spatial AR backdrop
          MobileScanner(
            controller: _scannerController,
            onDetect: (capture) {
              final List<Barcode> barcodes = capture.barcodes;
              for (final barcode in barcodes) {
                if (barcode.rawValue != null && barcode.rawValue!.isNotEmpty) {
                  if (_isScanningActive && _activeLocationId == null) {
                    _validateAndLockQr(barcode.rawValue!);
                  }
                  
                  // TRUE AR PLANE TRACKING: Map physical QR bounding points from camera stream sensor to logical screen display points
                  if (barcode.corners != null && barcode.corners!.length == 4) {
                    final screenSize = MediaQuery.of(context).size;
                    final imgSize = capture.size;
                    
                    Offset mapPoint(Offset pt) {
                      if (imgSize.width == 0 || imgSize.height == 0) return pt;
                      final isOrientationMismatched = (screenSize.height > screenSize.width) != (imgSize.height > imgSize.width);
                      final imgW = isOrientationMismatched ? imgSize.height : imgSize.width;
                      final imgH = isOrientationMismatched ? imgSize.width : imgSize.height;
                      
                      final scaleX = screenSize.width / imgW;
                      final scaleY = screenSize.height / imgH;
                      final ratio = math.max(scaleX, scaleY);
                      
                      final cropX = (imgW * ratio - screenSize.width) / 2.0;
                      final cropY = (imgH * ratio - screenSize.height) / 2.0;
                      
                      double rawX = isOrientationMismatched ? pt.dy : pt.dx;
                      double rawY = isOrientationMismatched ? pt.dx : pt.dy;
                      return Offset(rawX * ratio - cropX, rawY * ratio - cropY);
                    }

                    final p0 = mapPoint(barcode.corners![0]); // Top-left
                    final p1 = mapPoint(barcode.corners![1]); // Top-right
                    final p2 = mapPoint(barcode.corners![2]); // Bottom-right
                    final p3 = mapPoint(barcode.corners![3]); // Bottom-left
                    
                    final center = Offset(
                      (p0.dx + p1.dx + p2.dx + p3.dx) / 4.0,
                      (p0.dy + p1.dy + p2.dy + p3.dy) / 4.0,
                    );
                    
                    // Real-world spatial distance scaling (object expands/shrinks as user steps closer/further)
                    final qrWidth = (p1 - p0).distance;
                    final qrHeight = (p3 - p0).distance;
                    final calculatedScale = ((qrWidth + qrHeight) / 280.0).clamp(0.25, 5.0);
                    
                    // 3D Spatial Tilt Estimation (Pitch & Yaw perspective foreshortening)
                    final topW = (p1 - p0).distance;
                    final botW = (p2 - p3).distance;
                    final leftH = (p3 - p0).distance;
                    final rightH = (p2 - p1).distance;
                    final avgW = (topW + botW) / 2.0;
                    final avgH = (leftH + rightH) / 2.0;
                    final maxDim = math.max(avgW, avgH);

                    // Yaw (Sideways tilt: approaching 90 deg compresses horizontal plane into a thin 3D line structure)
                    double calculatedYaw = 0.0;
                    if (maxDim > 0) {
                      final ratioW = (avgW / maxDim).clamp(0.01, 1.0);
                      calculatedYaw = math.acos(ratioW);
                      if (leftH < rightH) calculatedYaw = -calculatedYaw; // Viewed from left vs right side
                    }

                    // Pitch (Up/Down tilt)
                    double calculatedPitch = 0.0;
                    if (maxDim > 0) {
                      final ratioH = (avgH / maxDim).clamp(0.01, 1.0);
                      calculatedPitch = math.acos(ratioH);
                      if (topW < botW) calculatedPitch = -calculatedPitch;
                    }

                    // Real-world surface orientation angle (roll)
                    final calculatedAngle = math.atan2(p1.dy - p0.dy, p1.dx - p0.dx);

                    if (mounted) {
                      setState(() {
                        _lastQrSeenTime = DateTime.now();
                        _liveQrAnchorCenter = _liveQrAnchorCenter == null 
                            ? center 
                            : Offset.lerp(_liveQrAnchorCenter!, center, 0.85);
                        _liveQrScale = (_liveQrScale * 0.15) + (calculatedScale * 0.85);
                        _liveQrAngle = 0.0; // Decoupled from camera rotation to keep object planted stably in one spot on the wall
                        _liveQrPitch = 0.0;
                        _liveQrYaw = 0.0;
                      });
                    }
                  }
                  break;
                }
              }
            },
            errorBuilder: (context, error) {
              return _buildCameraFallback(context, error.errorDetails?.message ?? error.toString());
            },
          ),

          if (isScanned)
            GestureDetector(
              onTap: () {
                if (_selectedContentId != null) {
                  setState(() => _selectedContentId = null);
                }
              },
              child: Container(
                width: size.width,
                height: size.height,
                color: Colors.transparent,
              ),
            ),

          if (isScanned)
            Positioned(
              top: size.height * 0.28,
              left: size.width * 0.1,
              right: size.width * 0.1,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: isEditingObject ? AppColors.warning.withValues(alpha: 0.2) : AppColors.success.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: isEditingObject ? AppColors.warning : AppColors.success, width: 1.2),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isEditingObject ? Icons.open_with : Icons.check_circle_outline,
                        size: 16,
                        color: isEditingObject ? AppColors.warning : AppColors.success,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        isEditingObject ? 'EDITING OBJECT: Drag handles to Move & Rotate, then click DONE' : 'VIEW MODE: AR Objects aligned to Anchor',
                        style: TextStyle(
                          color: isEditingObject ? AppColors.warning : AppColors.success,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // 2. Interactive Pinned AR Objects overlay
          if (isScanned)
            ..._wallContents.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              final isSelected = _selectedContentId == item.id;
              final isQrActiveInView = true; // Decoupled from live QR timer: spatial plane persists stably once anchored!

              final anchorX = _liveQrAnchorCenter?.dx ?? (size.width / 2);
              final anchorY = _liveQrAnchorCenter?.dy ?? (size.height * 0.55);
              final anchorScale = _liveQrAnchorCenter != null ? _liveQrScale : 1.0;

              // Retrieve offset relative to physical QR Anchor plane
              final storedX = item.transform?.positionX ?? -160.0;
              final storedY = item.transform?.positionY ?? -280.0;

              // Apply world-space roll orientation so when user rotates camera horizontally, content remains level to physical anchor
              final dx = storedX * anchorScale;
              final dy = storedY * anchorScale;
              final cosA = math.cos(_liveQrAngle);
              final sinA = math.sin(_liveQrAngle);
              final curX = anchorX + (dx * cosA - dy * sinA);
              final curY = anchorY + (dx * sinA + dy * cosA);

              // Stable spatial matrix scaling and rotation without unwanted distortion
              final matrix3d = Matrix4.diagonal3Values(anchorScale, anchorScale, 1.0)
                ..rotateZ(_liveQrAngle);

              return Positioned(
                top: curY,
                left: curX,
                child: AnimatedOpacity(
                  opacity: (isQrActiveInView || isEditingObject || _isScanningActive) ? 1.0 : 0.0,
                  duration: const Duration(milliseconds: 200),
                  child: IgnorePointer(
                    ignoring: !(isQrActiveInView || isEditingObject),
                    child: Transform(
                      transform: matrix3d,
                      alignment: Alignment.center,
                      child: ArObjectManipulator(
                  item: item,
                  isSelected: isSelected,
                  onToggleSelect: () => setState(() => _selectedContentId = item.id),
                  onPanUpdate: isSelected ? (details) {
                    final newX = curX + details.delta.dx;
                    final newY = curY + details.delta.dy;
                    final diffX = (newX - anchorX) / anchorScale;
                    final diffY = (newY - anchorY) / anchorScale;
                    // Direct conversion back to unscaled relative coordinates accounting for orientation
                    final relX = diffX * cosA + diffY * sinA;
                    final relY = -diffX * sinA + diffY * cosA;
                    
                    final trans = item.transform ?? ArTransformModel(id: 'trans-${item.id}', arContentId: item.id, updatedAt: DateTime.now());
                    final updatedTrans = trans.copyWith(positionX: relX, positionY: relY);
                    setState(() {
                      _wallContents[index] = item.copyWith(transform: updatedTrans);
                    });
                  } : null,
                  onPanEnd: isSelected ? (_) {
                    if (item.transform != null) {
                      ref.read(arContentRepositoryProvider).updateTransform(item.transform!);
                      ToastService.showSuccess(context, 'Saved new coordinates on wall!');
                    }
                  } : null,
                  onTransformChanged: (newTrans) {
                    setState(() {
                      _wallContents[index] = item.copyWith(transform: newTrans);
                    });
                    ref.read(arContentRepositoryProvider).updateTransform(newTrans);
                  },
                    onEdit: () async {
                      if (item.contentType == ArContentType.text && item.textContent != null) {
                        final updated = await showDialog<TextContentModel>(
                          context: context,
                          builder: (_) => ArTextEditorDialog(existingText: item.textContent),
                        );
                        if (updated != null && context.mounted) {
                          final updatedItem = item.copyWith(textContent: updated);
                          setState(() {
                            _wallContents[index] = updatedItem;
                          });
                          ref.read(arContentRepositoryProvider).updateContent(updatedItem);
                          ToastService.showSuccess(context, 'Updated & saved text styling in DB!');
                        }
                      } else {
                        ToastService.show(context, 'Replacing media...');
                        _addMediaOverlay(item.contentType == ArContentType.video);
                      }
                    },
                    onReset: () {
                      final trans = item.transform ?? ArTransformModel(id: 'trans-${item.id}', arContentId: item.id, updatedAt: DateTime.now());
                      final resetTrans = trans.copyWith(positionX: (size.width - 320) / 2, positionY: 220.0 + (index * 140.0), scaleX: 1.0, scaleY: 1.0, scaleZ: 1.0, rotationZ: 0.0);
                      setState(() {
                        _wallContents[index] = item.copyWith(transform: resetTrans);
                      });
                      ref.read(arContentRepositoryProvider).updateTransform(resetTrans);
                      ToastService.show(context, 'Reset alignment to default coordinates.', icon: Icons.refresh);
                    },
                     onDelete: () {
                       ref.read(arContentRepositoryProvider).deleteContent(item.id);
                       setState(() {
                         _wallContents.removeWhere((c) => c.id == item.id);
                         if (_selectedContentId == item.id) _selectedContentId = null;
                       });
                       ToastService.show(context, 'Removed object from wall.', color: AppColors.error, icon: Icons.delete);
                     },
                     child: _buildContentWidget(item),
                   ),
                 ),
               )));
             }),

          // 3. Top Minimalist Status Header (No Box, clean Nunito text)
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    isScanned ? _activeLocationId! : 'SpatialOS',
                    style: GoogleFonts.nunito(fontSize: 24, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: 0.5),
                  ),
                  IconButton(
                    icon: const Icon(Icons.account_circle_outlined, size: 30, color: Colors.white),
                    tooltip: 'Profile Hub',
                    onPressed: () => context.push('/profile'),
                  ),
                ],
              ),
            ),
          ),

          // 4. USER-MANDATED BOTTOM CONTROLS (Clean Center Scan Button without background container box)
          Align(
            alignment: Alignment.bottomCenter,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.only(bottom: 24, left: 20, right: 20),
                child: !isScanned
                    // STATE 0: WAITING FOR USER TO CLICK SCAN CAMERA
                    ? ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _isScanningActive ? AppColors.surface : AppColors.primary,
                          foregroundColor: Colors.white,
                          minimumSize: const Size(180, 52),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(color: _isScanningActive ? AppColors.primary : Colors.transparent, width: 1.5),
                          ),
                          elevation: 0,
                        ),
                        onPressed: () {
                          setState(() {
                            _isScanningActive = !_isScanningActive;
                          });
                          ToastService.show(context, _isScanningActive ? 'Scanning active! Point camera directly at a QR code.' : 'Scanning paused.', icon: Icons.radar);
                        },
                        child: Text(
                          _isScanningActive ? 'AIM AT QR' : 'SCAN',
                          style: GoogleFonts.nunito(fontSize: 16, fontWeight: FontWeight.w800, letterSpacing: 1.5),
                        ),
                      )
                    : Container(
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.glassBorder, width: 1.2),
                        ),
                        child: isEditingObject
                            // STATE B: OBJECT PLACED/SELECTED ON WALL -> SAVE, MODIFY, OR DELETE
                            ? Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Expanded(
                                    flex: 10,
                                    child: ElevatedButton.icon(
                                      icon: const Icon(Icons.check, size: 18),
                                      label: const Text('DONE', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppColors.success,
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(vertical: 14),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                        elevation: 0,
                                      ),
                                      onPressed: _handleDoneSaving,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    flex: 8,
                                    child: OutlinedButton.icon(
                                      icon: const Icon(Icons.edit_outlined, size: 16, color: Colors.white),
                                      label: const Text('EDIT', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
                                      style: OutlinedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(vertical: 14),
                                        side: BorderSide(color: AppColors.glassBorder, width: 1.2),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                      ),
                                      onPressed: _editSelectedItem,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    flex: 6,
                                    child: ElevatedButton.icon(
                                      icon: const Icon(Icons.delete_outline, size: 16, color: Colors.white),
                                      label: const Text('DEL', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppColors.error,
                                        padding: const EdgeInsets.symmetric(vertical: 14),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                        elevation: 0,
                                      ),
                                      onPressed: _deleteSelectedItem,
                                    ),
                                  ),
                                ],
                              )
                            // STATE A: STANDARD SCANNED LOCATION VIEW -> ADD NEW AR OBJECT OR EXIT ROOM
                            : Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Expanded(
                                    flex: 11,
                                    child: ElevatedButton.icon(
                                      icon: const Icon(Icons.add, size: 18),
                                      label: const Text('ADD OBJECT', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppColors.primary,
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(vertical: 14),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                        elevation: 0,
                                      ),
                                      onPressed: _showEditActionModal,
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    flex: 7,
                                    child: OutlinedButton.icon(
                                      icon: const Icon(Icons.logout_outlined, size: 18, color: AppColors.error),
                                      label: const Text('EXIT', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.error)),
                                      style: OutlinedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(vertical: 14),
                                        side: const BorderSide(color: AppColors.error, width: 1.2),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                      ),
                                      onPressed: _handleCancelOrRescan,
                                    ),
                                  ),
                                ],
                              )),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContentWidget(ArContentModel item) {
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
        return ArVideoPlayerWidget(videoUrl: rawPath, isLocalFile: isLocalFile);
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
                          Text('Tap Modify below to upload physical photo', style: TextStyle(color: Colors.white, fontSize: 12)),
                        ],
                      ),
                    )),
        ),
      );
    }
    return const SizedBox.shrink();
  }
}

class _UploadOptionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _UploadOptionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: color.withValues(alpha: 0.5), width: 1.5),
          boxShadow: [
            BoxShadow(color: color.withValues(alpha: 0.15), blurRadius: 16),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.2),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 30),
            ),
            const SizedBox(height: 14),
            Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white)),
            const SizedBox(height: 4),
            Text(subtitle, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
          ],
        ),
      ),
    );
  }
}
