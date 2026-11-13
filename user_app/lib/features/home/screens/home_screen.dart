import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/toast_service.dart';
import '../../../core/config/api_config.dart';
import '../../../shared/models/ar_content_model.dart';
import '../../../repositories/repository_providers.dart';
import '../../../shared/widgets/ar_object_manipulator.dart';
import '../../../shared/widgets/ar_content_widget_factory.dart';
import '../../../shared/widgets/custom_text_field.dart';
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
  bool _isScanningActive = true;
  bool _isLoadingContent = false;
  Timer? _pollTimer;

  Offset? _liveQrAnchorCenter;
  double _liveQrScale = 1.0;
  double _liveQrAngle = 0.0;
  DateTime _lastQrSeenTime = DateTime.fromMillisecondsSinceEpoch(0);

  @override
  void initState() {
    super.initState();
    _scannerController = MobileScannerController(
      detectionSpeed: DetectionSpeed.unrestricted,
      facing: CameraFacing.back,
      torchEnabled: false,
      returnImage: true,
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

  Future<void> _validateAndLockQr(String code, {bool isManual = false}) async {
    if (_isLoadingContent || (!isManual && !_isScanningActive) || _activeLocationId != null) return;
    setState(() => _isLoadingContent = true);

    String targetId = code.trim();
    if (targetId.contains('/experience/')) {
      targetId = targetId.split('/experience/').last;
    } else if (targetId.startsWith('spatialos://')) {
      targetId = targetId.replaceFirst('spatialos://', '');
    }

    if (!isManual && !targetId.startsWith('LOC-') && !code.contains('/experience/') && !code.startsWith('spatialos://') && targetId.length < 5) {
      if (mounted) {
        ToastService.showError(context, 'Unrecognized QR marker! Please scan an official SpatialOS QR code.');
      }
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) setState(() => _isLoadingContent = false);
      return;
    }

    final repo = ref.read(arContentRepositoryProvider);
    try {
      final contents = await repo.getContentForLocation(targetId);
      if (mounted) {
        // App-Side Memory Limit: Only render the 10 closest AR nodes to prevent overheating
        contents.sort((a, b) {
          final distA = math.pow(a.transform?.positionX ?? 0, 2) + math.pow(a.transform?.positionY ?? 0, 2);
          final distB = math.pow(b.transform?.positionX ?? 0, 2) + math.pow(b.transform?.positionY ?? 0, 2);
          return distA.compareTo(distB);
        });
        
        final screen = MediaQuery.of(context).size;
        setState(() {
          _activeLocationId = targetId;
          _wallContents = contents.take(10).toList();
          _isScanningActive = false;
          _isLoadingContent = false;
          _lastQrSeenTime = DateTime.now();
          _liveQrAnchorCenter ??= Offset(screen.width / 2, screen.height * 0.55);
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
        _showErrorDialog(targetId, e.toString());
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

  void _showErrorDialog(String targetId, String errorMessage) {
    final serverUrl = ref.read(apiConfigProvider).serverUrl;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E1F29),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.error, width: 1.2),
        ),
        title: const Row(
          children: [
            Icon(Icons.wifi_off_rounded, color: AppColors.error, size: 24),
            SizedBox(width: 10),
            Text('AR Load Error', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Could not reach backend server to load AR scene.', style: TextStyle(color: Colors.white70, fontSize: 13)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.black38,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.white12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Server URL: $serverUrl', style: const TextStyle(color: AppColors.accent, fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text('Scanned Anchor: $targetId', style: const TextStyle(color: Colors.white60, fontSize: 11)),
                  const SizedBox(height: 4),
                  Text('Details: $errorMessage', style: const TextStyle(color: Colors.white54, fontSize: 11)),
                ],
              ),
            ),
            const SizedBox(height: 12),
            const Text('• Check that your laptop and phone are on the same Wi-Fi.\n• Verify your laptop IP address matches the Server URL.', style: TextStyle(color: Colors.white60, fontSize: 11, height: 1.4)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Dismiss', style: TextStyle(color: Colors.white60)),
          ),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
            icon: const Icon(Icons.settings_ethernet, size: 16, color: Colors.white),
            label: const Text('Change Server IP', style: TextStyle(color: Colors.white)),
            onPressed: () {
              Navigator.pop(ctx);
              _showServerConfigDialog();
            },
          ),
        ],
      ),
    );
  }

  void _showServerConfigDialog() {
    final config = ref.read(apiConfigProvider);
    final controller = TextEditingController(text: config.serverUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E1F29),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: AppColors.glassBorder)),
        title: const Row(
          children: [
            Icon(Icons.dns_rounded, color: AppColors.accent, size: 22),
            SizedBox(width: 10),
            Text('Server Connection', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Enter your Laptop Server Wi-Fi IP and Port 3001:', style: TextStyle(color: Colors.white70, fontSize: 13)),
            const SizedBox(height: 14),
            CustomTextField(
              controller: controller,
              hintText: 'http://192.168.1.4:3001',
              prefixIcon: Icons.lan_outlined,
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF2E2F3A),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white24),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('⚡ Wi-Fi Note:', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                  SizedBox(height: 4),
                  Text('Ensure your laptop server is running and your phone is connected to the same Wi-Fi network.', style: TextStyle(color: Colors.white70, fontSize: 11)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: Colors.white60))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            onPressed: () async {
              final newUrl = controller.text.trim();
              if (newUrl.isNotEmpty) {
                await ref.read(apiConfigProvider.notifier).setServerUrl(newUrl);
                setState(() {});
                if (mounted) ToastService.showSuccess(context, 'Server updated to $newUrl');
              }
              if (ctx.mounted) Navigator.pop(ctx);
            },
            child: const Text('Save & Reconnect', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showManualCodeDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E1F29),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: AppColors.glassBorder)),
        title: const Row(
          children: [
            Icon(Icons.qr_code_2_rounded, color: AppColors.accent, size: 22),
            SizedBox(width: 10),
            Text('Load AR Experience', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Enter Experience ID or Location Code (from Dashboard):', style: TextStyle(color: Colors.white70, fontSize: 13)),
            const SizedBox(height: 14),
            CustomTextField(
              controller: controller,
              hintText: 'e.g. LOC-xxx or Experience UUID',
              prefixIcon: Icons.tag_rounded,
            ),
            const SizedBox(height: 12),
            const Text('💡 Tip: Use this to test your AR scene without pointing your camera at a physical printout.', style: TextStyle(color: Colors.white54, fontSize: 11)),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: Colors.white60))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            onPressed: () {
              final text = controller.text.trim();
              if (text.isNotEmpty) {
                Navigator.pop(ctx);
                _validateAndLockQr(text, isManual: true);
              }
            },
            child: const Text('Load Scene', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Future<void> _pollContent(String code) async {
    if (!mounted) return;
    try {
      final repo = ref.read(arContentRepositoryProvider);
      final contents = await repo.getContentForLocation(code);
      if (mounted) {
        // App-Side Memory Limit: Only render the 10 closest AR nodes
        contents.sort((a, b) {
          final distA = math.pow(a.transform?.positionX ?? 0, 2) + math.pow(a.transform?.positionY ?? 0, 2);
          final distB = math.pow(b.transform?.positionX ?? 0, 2) + math.pow(b.transform?.positionY ?? 0, 2);
          return distA.compareTo(distB);
        });
        setState(() {
          _wallContents = contents.take(10).toList();
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
                  
                  // Keep AR objects alive even if corner detection fails or is unsupported on this platform
                  String targetId = barcode.rawValue!;
                  if (targetId.contains('/experience/')) {
                    targetId = targetId.split('/experience/').last;
                  }
                  if (_activeLocationId == targetId || (_isScanningActive && _activeLocationId == null)) {
                    if (mounted) {
                      setState(() {
                        _lastQrSeenTime = DateTime.now();
                      });
                    }
                  }
                  
                  // TRUE AR PLANE TRACKING: Map physical QR bounding points from camera stream sensor to logical screen display points
                  if (barcode.corners.length == 4) {
                    Offset mapPoint(Offset pt) {
                      return pt;
                    }

                    final p0 = mapPoint(barcode.corners[0]); // Top-left
                    final p1 = mapPoint(barcode.corners[1]); // Top-right
                    final p2 = mapPoint(barcode.corners[2]); // Bottom-right
                    final p3 = mapPoint(barcode.corners[3]); // Bottom-left
                    
                    final center = Offset(
                      (p0.dx + p1.dx + p2.dx + p3.dx) / 4.0,
                      (p0.dy + p1.dy + p2.dy + p3.dy) / 4.0,
                    );
                    
                    // Real-world spatial distance scaling
                    final qrWidth = (p1 - p0).distance;
                    final qrHeight = (p3 - p0).distance;
                    final calculatedScale = ((qrWidth + qrHeight) / 280.0).clamp(0.25, 5.0);

                    if (mounted) {
                      setState(() {
                        // _lastQrSeenTime is already updated above
                        _liveQrAnchorCenter = _liveQrAnchorCenter == null 
                            ? center 
                            : Offset.lerp(_liveQrAnchorCenter!, center, 0.85);
                        _liveQrScale = (_liveQrScale * 0.15) + (calculatedScale * 0.85);
                        _liveQrAngle = 0.0; // Keep stable
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
              final timeSinceLastSeen = DateTime.now().difference(_lastQrSeenTime).inMilliseconds;
              final double fallbackWeight = (timeSinceLastSeen - 500).clamp(0, 1000) / 1000.0; 

              final defaultCenterX = size.width / 2;
              final defaultCenterY = size.height * 0.55;

              final rawAnchorX = _liveQrAnchorCenter?.dx ?? defaultCenterX;
              final rawAnchorY = _liveQrAnchorCenter?.dy ?? defaultCenterY;

              final anchorX = rawAnchorX + (defaultCenterX - rawAnchorX) * fallbackWeight;
              final anchorY = rawAnchorY + (defaultCenterY - rawAnchorY) * fallbackWeight;

              final rawAnchorScale = _liveQrAnchorCenter != null ? _liveQrScale : 1.0;
              final anchorScale = rawAnchorScale + (1.0 - rawAnchorScale) * fallbackWeight;

              final storedX = item.transform?.positionX ?? 0.0;
              final storedY = -(item.transform?.positionY ?? 0.0);

              final dx = storedX * 80.0 * anchorScale;
              final dy = storedY * 80.0 * anchorScale;
              final sinA = math.sin(_liveQrAngle);
              final cosA = math.cos(_liveQrAngle);
              
              final curX = anchorX + (dx * cosA - dy * sinA);
              final curY = anchorY + (dx * sinA + dy * cosA);

              // Stable spatial matrix scaling and rotation without unwanted distortion
              final matrix3d = Matrix4.diagonal3Values(anchorScale, anchorScale, 1.0)
                ..rotateZ(_liveQrAngle);

              return Positioned(
                key: ValueKey(item.id),
                top: curY,
                left: curX,
                child: AnimatedOpacity(
                  opacity: 1.0,
                  duration: const Duration(milliseconds: 200),
                  child: IgnorePointer(
                    ignoring: false, // Videos and MiniApps need tap
                    child: FractionalTranslation(
                      translation: const Offset(-0.5, -0.5),
                      child: OverflowBox(
                        maxWidth: double.infinity,
                        maxHeight: double.infinity,
                        child: Transform(
                          transform: matrix3d,
                          alignment: Alignment.center,
                          child: ArObjectManipulator(
                            item: item,
                            child: ArContentWidgetFactory(item: item),
                          ),
                        ),
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
                  final timeSinceLastSeen = DateTime.now().difference(_lastQrSeenTime).inMilliseconds;
                  final double fallbackWeight = (timeSinceLastSeen - 500).clamp(0, 1000) / 1000.0; 
                  
                  final defaultCenterX = size.width / 2;
                  final defaultCenterY = size.height * 0.55;

                  final rawAnchorX = _liveQrAnchorCenter?.dx ?? defaultCenterX;
                  final rawAnchorY = _liveQrAnchorCenter?.dy ?? defaultCenterY;

                  final anchorX = rawAnchorX + (defaultCenterX - rawAnchorX) * fallbackWeight;
                  final anchorY = rawAnchorY + (defaultCenterY - rawAnchorY) * fallbackWeight;

                  final rawAnchorScale = _liveQrAnchorCenter != null ? _liveQrScale : 1.0;
                  final anchorScale = rawAnchorScale + (1.0 - rawAnchorScale) * fallbackWeight;

                  // Plane coordinates relative to anchor
                  final planeX = plane.transform?.positionX ?? 0.0;
                  final planeY = -(plane.transform?.positionY ?? 0.0);

                  // Child coordinates relative to plane
                  final childX = child.transform?.positionX ?? 0.0;
                  final childY = -(child.transform?.positionY ?? 0.0);

                  final dx = (planeX + childX) * 80.0 * anchorScale;
                  final dy = (planeY + childY) * 80.0 * anchorScale;

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
                        child: FractionalTranslation(
                          translation: const Offset(-0.5, -0.5),
                          child: OverflowBox(
                            maxWidth: double.infinity,
                            maxHeight: double.infinity,
                            child: Transform(
                              transform: matrix3d,
                              alignment: Alignment.center,
                              child: ArObjectManipulator(
                                item: child,
                                child: ArContentWidgetFactory(item: child),
                              ),
                            ),
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
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.qr_code_2_outlined, size: 24, color: Colors.white70),
                        tooltip: 'Enter Experience Code',
                        onPressed: _showManualCodeDialog,
                      ),
                      IconButton(
                        icon: const Icon(Icons.dns_outlined, size: 24, color: AppColors.accent),
                        tooltip: 'Server Connection',
                        onPressed: _showServerConfigDialog,
                      ),
                      IconButton(
                        icon: const Icon(Icons.account_circle_outlined, size: 28, color: Colors.white),
                        tooltip: 'Profile Hub',
                        onPressed: () => context.push('/profile'),
                      ),
                    ],
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
}
