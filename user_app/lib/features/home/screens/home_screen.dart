import 'dart:io';
import 'dart:ui';
import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../../core/theme/app_colors.dart';
import 'package:user_app/features/mini_apps/notice_board_mini_app.dart';
import 'package:user_app/core/services/api_service.dart';
import 'package:video_player/video_player.dart';
import '../../../core/utils/toast_service.dart';
import '../../../core/config/api_config.dart';
import '../../../shared/models/ar_content_model.dart';
import '../../../repositories/repository_providers.dart';
import '../../../shared/widgets/ar_video_player_widget.dart';
import '../../../shared/widgets/ar_object_manipulator.dart';
import '../../mini_apps/coffee_mini_app.dart';
import 'dart:async';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  late final MobileScannerController _scannerController;
  String? _activeLocationId;
  List<ArContentModel> _wallContents = [];
  bool _permissionsGranted = kIsWeb;
  bool _isScanningActive = false;
  bool _isLoadingContent = false;
  Timer? _pollTimer;

  Offset? _liveQrAnchorCenter;
  double _liveQrScale = 1.0;
  double _liveQrAngle = 0.0;
  double _liveQrPitch = 0.0;
  double _liveQrYaw = 0.0;
  DateTime _lastQrSeenTime = DateTime.fromMillisecondsSinceEpoch(0);

  @override
  void initState() {
    super.initState();
    _scannerController = MobileScannerController(
      detectionSpeed: DetectionSpeed.unrestricted,
      facing: CameraFacing.back,
      torchEnabled: false,
    );
    _requestPermissions();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _scannerController.dispose();
    super.dispose();
  }

  Future<void> _requestPermissions() async {
    if (!kIsWeb) {
      final cameraStatus = await Permission.camera.request();
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

  Future<void> _validateAndLockQr(String code) async {
    if (_isLoadingContent || !_isScanningActive || _activeLocationId != null) return;
    setState(() => _isLoadingContent = true);

    if (!code.startsWith('LOC-') && !code.contains('/experience/')) {
      if (mounted) {
        ToastService.showError(context, 'Unrecognized QR marker! Please scan an official SpatialOS QR code.');
      }
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) setState(() => _isLoadingContent = false);
      return;
    }

    // Extract experience ID if it's a URL
    String targetId = code;
    if (code.contains('/experience/')) {
      targetId = code.split('/experience/').last;
    }

    final repo = ref.read(arContentRepositoryProvider);
    try {
      final contents = await repo.getContentForLocation(targetId);
      if (mounted) {
        setState(() {
          _activeLocationId = targetId;
          _wallContents = contents;
          _isScanningActive = false;
          _isLoadingContent = false;
        });
        
        _pollTimer?.cancel();
        _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) => _pollContent(targetId));

        if (contents.isEmpty) {
          ToastService.show(context, 'Connected to location $code. No AR objects placed yet.');
        } else {
          ToastService.showSuccess(context, 'Locked onto $code! Enjoy the AR experience.');
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingContent = false);
        ToastService.showError(context, 'Failed to load AR environment: $e');
      }
    }
  }

  void _handleCancelOrRescan() {
    _pollTimer?.cancel();
    setState(() {
      _activeLocationId = null;
      _wallContents = [];
      _isScanningActive = false;
      _liveQrAnchorCenter = null;
    });
    ToastService.show(context, 'Exited AR scene.');
  }

  Future<void> _pollContent(String code) async {
    if (!mounted) return;
    try {
      final repo = ref.read(arContentRepositoryProvider);
      final contents = await repo.getContentForLocation(code);
      if (mounted) {
        setState(() {
          _wallContents = contents;
        });
      }
    } catch (e) {
      debugPrint('AR Auto-Update Polling error: $e');
    }
  }

  Widget _buildCameraFallback(BuildContext context, String message) {
    return Container(
      color: Colors.black,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.videocam_off, color: Colors.white54, size: 48),
            const SizedBox(height: 16),
            Text('Camera unavailable', style: GoogleFonts.nunito(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(message, style: const TextStyle(color: Colors.white54), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
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
                child: const Text('Grant Permissions', style: TextStyle(color: Colors.white)),
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
                    
                    // Real-world spatial distance scaling
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

                    // Yaw
                    double calculatedYaw = 0.0;
                    if (maxDim > 0) {
                      final ratioW = (avgW / maxDim).clamp(0.01, 1.0);
                      calculatedYaw = math.acos(ratioW);
                      if (leftH < rightH) calculatedYaw = -calculatedYaw;
                    }

                    // Pitch
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
                        _liveQrAngle = 0.0; // Keep stable
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
            Positioned(
              top: size.height * 0.28,
              left: size.width * 0.1,
              right: size.width * 0.1,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.success.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.success, width: 1.2),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.check_circle_outline, size: 16, color: AppColors.success),
                      SizedBox(width: 8),
                      Text(
                        'VIEW MODE: AR Objects aligned to Anchor',
                        style: TextStyle(color: AppColors.success, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // 2. Interactive Pinned AR Objects overlay
          if (isScanned)
            ..._wallContents.map((item) {
              final isQrActiveInView = true;

              final anchorX = _liveQrAnchorCenter?.dx ?? (size.width / 2);
              final anchorY = _liveQrAnchorCenter?.dy ?? (size.height * 0.55);
              final anchorScale = _liveQrAnchorCenter != null ? _liveQrScale : 1.0;

              final storedX = item.transform?.positionX ?? -160.0;
              final storedY = item.transform?.positionY ?? -280.0;

              final dx = storedX * anchorScale;
              final dy = storedY * anchorScale;
              final sinA = math.sin(_liveQrAngle);
              final cosA = math.cos(_liveQrAngle);
              
              final curX = anchorX + (dx * cosA - dy * sinA);
              final curY = anchorY + (dx * sinA + dy * cosA);

              // Stable spatial matrix scaling and rotation without unwanted distortion
              final matrix3d = Matrix4.diagonal3Values(anchorScale, anchorScale, 1.0)
                ..rotateZ(_liveQrAngle);

              return Positioned(
                top: curY,
                left: curX,
                child: AnimatedOpacity(
                  opacity: 1.0,
                  duration: const Duration(milliseconds: 200),
                  child: IgnorePointer(
                    ignoring: false, // Videos and MiniApps need tap
                    child: Transform(
                      transform: matrix3d,
                      alignment: Alignment.center,
                      child: ArObjectManipulator(
                        item: item,
                        child: _buildContentWidget(item),
                      ),
                    ),
                  ),
                ),
              );
            }),

            // Support rendering children of PLANE objects
            if (isScanned)
              ..._wallContents.where((item) => item.contentType == ArContentType.plane && item.children != null).expand((plane) {
                return plane.children!.map((child) {
                  final anchorX = _liveQrAnchorCenter?.dx ?? (size.width / 2);
                  final anchorY = _liveQrAnchorCenter?.dy ?? (size.height * 0.55);
                  final anchorScale = _liveQrAnchorCenter != null ? _liveQrScale : 1.0;

                  // Plane coordinates relative to anchor
                  final planeX = plane.transform?.positionX ?? 0.0;
                  final planeY = plane.transform?.positionY ?? 0.0;

                  // Child coordinates relative to plane
                  final childX = child.transform?.positionX ?? 0.0;
                  final childY = child.transform?.positionY ?? 0.0;

                  final dx = (planeX + childX) * anchorScale;
                  final dy = (planeY + childY) * anchorScale;

                  final sinA = math.sin(_liveQrAngle);
                  final cosA = math.cos(_liveQrAngle);
                  
                  final curX = anchorX + (dx * cosA - dy * sinA);
                  final curY = anchorY + (dx * sinA + dy * cosA);

                  final matrix3d = Matrix4.diagonal3Values(anchorScale, anchorScale, 1.0)
                    ..rotateZ(_liveQrAngle);

                  return Positioned(
                    key: ValueKey(child.id),
                    top: curY,
                    left: curX,
                    child: AnimatedOpacity(
                      opacity: 1.0,
                      duration: const Duration(milliseconds: 200),
                      child: IgnorePointer(
                        ignoring: false,
                        child: Transform(
                          transform: matrix3d,
                          alignment: Alignment.center,
                          child: ArObjectManipulator(
                            item: child,
                            child: _buildContentWidget(child),
                          ),
                        ),
                      ),
                    ),
                  );
                });
              }),

          // 3. Top Minimalist Status Header
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

          // 4. USER-MANDATED BOTTOM CONTROLS (Clean Center Scan Button)
          Align(
            alignment: Alignment.bottomCenter,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.only(bottom: 24, left: 20, right: 20),
                child: !isScanned
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
                          style: GoogleFonts.nunito(fontSize: 16, fontWeight: FontWeight.w800, letterSpacing: 1.5, color: Colors.white),
                        ),
                      )
                    : Container(
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.glassBorder, width: 1.2),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Expanded(
                              flex: 1,
                              child: OutlinedButton.icon(
                                icon: const Icon(Icons.logout_outlined, size: 18, color: AppColors.error),
                                label: const Text('EXIT SCENE', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.error)),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  side: const BorderSide(color: AppColors.error, width: 1.2),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                                onPressed: _handleCancelOrRescan,
                              ),
                            ),
                          ],
                        ),
                      ),
              ),
            ),
          ),
          
          if (_isLoadingContent)
            Container(
              color: Colors.black87,
              child: const Center(
                child: CircularProgressIndicator(color: AppColors.accent),
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
          color: Colors.white.withOpacity(0.1),
          border: Border.all(color: Colors.white70, width: 2),
          borderRadius: BorderRadius.circular(12),
        ),
      );
    } else if (item.contentType == ArContentType.miniapp) {
      if (item.miniAppContent?.appId == 'COFFEE_MINI_APP') {
        return const CoffeeMiniApp();
      } else if (item.miniAppContent?.appId == 'NOTICE_BOARD') {
        return NoticeBoardMiniApp(state: item.miniAppContent?.state);
      }
      return Container(
        width: 200,
        height: 200,
        color: Colors.red.withOpacity(0.5),
        child: Center(child: Text('Unknown MiniApp ${item.miniAppContent?.appId}', style: const TextStyle(color: Colors.white))),
      );
    }

    return const SizedBox.shrink();
  }
}
