import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:user_app/core/config/api_config.dart';
import 'package:user_app/core/services/api_service.dart';
import 'package:video_player/video_player.dart';

class NoticeBoardMiniApp extends ConsumerStatefulWidget {
  final Map<String, dynamic>? state;

  const NoticeBoardMiniApp({super.key, this.state});

  @override
  ConsumerState<NoticeBoardMiniApp> createState() => _NoticeBoardMiniAppState();
}

class _NoticeBoardMiniAppState extends ConsumerState<NoticeBoardMiniApp> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Color _parseColor(String? hex, [Color defaultColor = const Color(0xFF1E293B)]) {
    if (hex == null || hex.isEmpty) return defaultColor;
    try {
      String clean = hex.replaceAll('#', '');
      if (clean.length == 6) clean = 'FF$clean';
      return Color(int.parse(clean, radix: 16));
    } catch (_) {
      return defaultColor;
    }
  }

  Widget buildMediaContent(Map<String, dynamic> item) {
    final type = item['type'] as String?;
    final url = item['url'] as String?;
    
    // For Text
    if (type == 'text') {
      final title = item['title'] as String? ?? '';
      final description = item['description'] as String? ?? '';
      final color = _parseColor(item['color'], Colors.white);
      
      return Container(
        padding: const EdgeInsets.all(12.0),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  color: color,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Inter',
                ),
              ),
              const SizedBox(height: 8),
              Text(
                description,
                style: TextStyle(
                  color: color.withValues(alpha: 0.9),
                  fontSize: 14,
                  fontFamily: 'Inter',
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      );
    }

    String? fullUrl;
    if (url != null && url.isNotEmpty) {
      if (url.startsWith('http')) {
        fullUrl = url;
      } else if (url.startsWith('/storage/')) {
        fullUrl = '${ref.read(apiConfigProvider).serverUrl.replaceFirst(RegExp(r'/$'), '')}$url';
      }
    }

    if (fullUrl == null) return const SizedBox();

    if (type == 'video') {
      return NoticeVideoItem(key: ValueKey(fullUrl), url: fullUrl);
    }

    final token = ApiService.syncToken;

    return ClipRRect(
      key: ValueKey(fullUrl),
      child: Image.network(
        fullUrl,
        headers: token != null ? {'Authorization': 'Bearer $token'} : null,
        fit: BoxFit.cover,
        errorBuilder: (ctx, err, stack) => const Padding(
          padding: EdgeInsets.all(16.0),
          child: Icon(Icons.broken_image, color: Colors.white54, size: 40),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.state?['title'] as String? ?? 'Notice Board';
    final borderColorHex = widget.state?['borderColor'] as String? ?? '#6366F1';
    final borderColor = _parseColor(borderColorHex);

    final pages = widget.state?['pages'] as List<dynamic>? ?? [];

    return Container(
      width: 480,
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor, width: 1.5),
        boxShadow: [
          BoxShadow(color: borderColor.withValues(alpha: 0.3), blurRadius: 20, spreadRadius: 2)
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
            decoration: BoxDecoration(
              color: borderColor.withValues(alpha: 0.2),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(14.5)),
            ),
            child: Row(
              children: [
                Icon(Icons.campaign_rounded, color: borderColor, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Inter',
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Page View Content Area
          SizedBox(
            height: 720, // Taller fixed height for AR container to match 500x750 dashboard ratio
            child: pages.isEmpty 
              ? const Center(child: Text("No content", style: TextStyle(color: Colors.white54)))
              : PageView.builder(
                  controller: _pageController,
                  onPageChanged: (idx) => setState(() => _currentPage = idx),
                  itemCount: pages.length,
                  itemBuilder: (context, pageIndex) {
                    final pageData = pages[pageIndex] as Map<String, dynamic>;
                    final items = pageData['mediaItems'] as List<dynamic>? ?? [];
                    
                    return ClipRect(
                      child: Stack(
                        children: items.map<Widget>((itemObj) {
                          final item = itemObj as Map<String, dynamic>;
                          final x = (item['x'] as num?)?.toDouble() ?? 0.0;
                          final y = (item['y'] as num?)?.toDouble() ?? 0.0;
                          final w = (item['width'] as num?)?.toDouble() ?? 0.3;
                          final h = (item['height'] as num?)?.toDouble() ?? 0.3;
                          final rotation = (item['rotation'] as num?)?.toDouble() ?? 0.0;
                          final type = item['type'] as String?;
                          final bgColor = type == 'text' ? _parseColor(item['bgColor'], Colors.transparent) : Colors.transparent;

                          return Positioned(
                            left: x * 480,
                            top: y * 720,
                            width: w * 480,
                            height: h * 720,
                            child: Transform.rotate(
                              angle: rotation * 3.14159 / 180,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: bgColor,
                                  borderRadius: type == 'text' ? BorderRadius.circular(8) : null,
                                ),
                                child: buildMediaContent(item),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    );
                  },
              ),
          ),

          // Pagination Controls
          if (pages.length > 1)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              color: Colors.black26,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_left, color: Colors.white),
                    onPressed: _currentPage > 0 
                      ? () => _pageController.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut)
                      : null,
                  ),
                  Text(
                    '${_currentPage + 1} / ${pages.length}',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.chevron_right, color: Colors.white),
                    onPressed: _currentPage < pages.length - 1
                      ? () => _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut)
                      : null,
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class NoticeVideoItem extends StatefulWidget {
  final String url;
  const NoticeVideoItem({super.key, required this.url});

  @override
  State<NoticeVideoItem> createState() => _NoticeVideoItemState();
}

class _NoticeVideoItemState extends State<NoticeVideoItem> {
  late VideoPlayerController _controller;
  bool _initialized = false;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    final token = ApiService.syncToken;
    _controller = VideoPlayerController.networkUrl(
      Uri.parse(widget.url),
      httpHeaders: token != null ? {'Authorization': 'Bearer $token'} : {},
    )
      ..initialize().then((_) {
        if (mounted) {
          setState(() {
            _initialized = true;
          });
        }
      }).catchError((err) {
        if (mounted) {
          setState(() {
            _hasError = true;
          });
        }
      });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_hasError) {
      return Container(
        color: Colors.black26,
        child: const Center(child: Icon(Icons.error, color: Colors.redAccent)),
      );
    }
    
    if (!_initialized) {
      return Container(
        color: Colors.black26,
        child: const Center(child: CircularProgressIndicator(color: Colors.white54)),
      );
    }

    return GestureDetector(
      onTap: () {
        setState(() {
          _controller.value.isPlaying ? _controller.pause() : _controller.play();
        });
      },
      child: Stack(
        alignment: Alignment.center,
        children: [
          VideoPlayer(_controller),
          if (!_controller.value.isPlaying)
            Container(
              decoration: BoxDecoration(
                color: Colors.black45,
                shape: BoxShape.circle,
              ),
              padding: const EdgeInsets.all(8),
              child: const Icon(Icons.play_arrow, color: Colors.white, size: 30),
            ),
        ],
      ),
    );
  }
}
