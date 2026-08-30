import 'dart:io';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:user_app/core/services/api_service.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../../core/theme/app_colors.dart';

class ArVideoPlayerWidget extends StatefulWidget {
  final String videoUrl;
  final bool isLocalFile;

  const ArVideoPlayerWidget({
    super.key,
    required this.videoUrl,
    required this.isLocalFile,
  });

  @override
  State<ArVideoPlayerWidget> createState() => _ArVideoPlayerWidgetState();
}

class _ArVideoPlayerWidgetState extends State<ArVideoPlayerWidget> {
  late VideoPlayerController _controller;
  bool _initialized = false;
  bool _hasError = false;
  bool _isMuted = true;

  @override
  void initState() {
    super.initState();
    _initPlayer();
  }

  Future<void> _initPlayer() async {
    try {
      if (widget.isLocalFile) {
        _controller = VideoPlayerController.file(File(widget.videoUrl));
      } else {
        final token = ApiService.syncToken;
        _controller = VideoPlayerController.networkUrl(
          Uri.parse(widget.videoUrl),
          httpHeaders: token != null ? {'Authorization': 'Bearer $token'} : {},
        );
      }

      await _controller.initialize();
      await _controller.setLooping(true);
      await _controller.setVolume(0.0); // Muted by default in AR view
      await _controller.play();

      if (mounted) {
        setState(() => _initialized = true);
      }
    } catch (e) {
      debugPrint('Error loading AR video: $e');
      if (mounted) {
        setState(() => _hasError = true);
      }
    }
  }

  @override
  void didUpdateWidget(covariant ArVideoPlayerWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.videoUrl != widget.videoUrl || oldWidget.isLocalFile != widget.isLocalFile) {
      _controller.dispose();
      _initialized = false;
      _hasError = false;
      _initPlayer();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _toggleMute() {
    if (!_initialized) return;
    setState(() {
      _isMuted = !_isMuted;
      _controller.setVolume(_isMuted ? 0.0 : 1.0);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_hasError) {
      return Container(
        width: 260,
        height: 180,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white24, width: 2),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.videocam_off_rounded, color: AppColors.warning, size: 40),
            const SizedBox(height: 8),
            const Text(
              'Unable to stream AR video.\nCheck network or path.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70, fontSize: 12),
            ),
          ],
        ),
      );
    }

    if (!_initialized) {
      return Container(
        width: 260,
        height: 180,
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white24, width: 2),
        ),
        child: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: AppColors.info),
              SizedBox(height: 12),
              Text(
                'Loading AR Video...',
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
        ),
      );
    }

    return Container(
      constraints: const BoxConstraints(maxWidth: 340, maxHeight: 400),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white24, width: 2),
        boxShadow: const [
          BoxShadow(color: Colors.black54, blurRadius: 20, offset: Offset(0, 10)),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: Stack(
          alignment: Alignment.bottomRight,
          children: [
            AspectRatio(
              aspectRatio: _controller.value.aspectRatio.clamp(0.5, 2.5),
              child: VideoPlayer(_controller),
            ),
            // Floating Audio Mute/Unmute toggle button
            Padding(
              padding: const EdgeInsets.all(10.0),
              child: InkWell(
                onTap: _toggleMute,
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.65),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white38),
                  ),
                  child: Icon(
                    _isMuted ? Icons.volume_off_rounded : Icons.volume_up_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
