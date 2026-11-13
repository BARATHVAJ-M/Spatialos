import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:user_app/core/config/api_config.dart';
import 'package:user_app/core/services/api_service.dart';
import 'package:video_player/video_player.dart';
import 'package:user_app/shared/models/ar_content_model.dart';

class NoticeBoardMiniApp extends ConsumerStatefulWidget {
  final ArContentModel item;

  const NoticeBoardMiniApp({super.key, required this.item});

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
        child: LayoutBuilder(
          builder: (context, constraints) {
            return FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.topLeft,
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: constraints.maxWidth,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
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
                        fontSize: (item['fontSize'] as num?)?.toDouble() ?? 14,
                        fontFamily: 'Inter',
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      );
    }

    String? fullUrl;
    if (url != null && url.isNotEmpty) {
      if (url.startsWith('http')) {
        fullUrl = url;
      } else if (url.startsWith('/')) {
        fullUrl = '${ref.read(apiConfigProvider).serverUrl.replaceFirst(RegExp(r'/$'), '')}$url';
      }
    }

    if (fullUrl == null) return const SizedBox();

    if (type == 'video') {
      return NoticeVideoItem(key: ValueKey(fullUrl), url: fullUrl, item: widget.item);
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
    final state = widget.item.miniAppContent?.state ?? {};
    final title = state['title'] as String? ?? 'Notice Board';
    final borderColorHex = state['borderColor'] as String? ?? '#6366F1';
    final borderColor = _parseColor(borderColorHex);

    final pages = state['pages'] as List<dynamic>? ?? [];

    return LayoutBuilder(
      builder: (context, constraints) {
        final hasBoundedHeight = constraints.maxHeight.isFinite;
        final double boardWidth = constraints.maxWidth.isFinite ? constraints.maxWidth : 480.0;

        Widget pageViewContent = pages.isEmpty 
          ? const Center(child: Text("No content", style: TextStyle(color: Colors.white54)))
          : PageView.builder(
              controller: _pageController,
              onPageChanged: (idx) => setState(() => _currentPage = idx),
              itemCount: pages.length,
              itemBuilder: (context, pageIndex) {
                final pageData = pages[pageIndex] as Map<String, dynamic>;
                final items = pageData['mediaItems'] as List<dynamic>? ?? [];
                
                return LayoutBuilder(
                  builder: (context, canvasConstraints) {
                    final canvasWidth = canvasConstraints.maxWidth;
                    final canvasHeight = canvasConstraints.maxHeight;

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
                            left: x * canvasWidth,
                            top: y * canvasHeight,
                            width: (w * canvasWidth).clamp(10.0, canvasWidth),
                            height: (h * canvasHeight).clamp(10.0, canvasHeight),
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
                );
              },
            );

        return Container(
          width: boardWidth,
          height: hasBoundedHeight ? constraints.maxHeight : null,
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B), // Slate 800 (Card background)
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: borderColor, width: 3.0), // Thicker border to match Dashboard
            boxShadow: [
              BoxShadow(color: borderColor.withValues(alpha: 0.4), blurRadius: 20, spreadRadius: 2)
            ],
          ),
          child: Column(
            mainAxisSize: hasBoundedHeight ? MainAxisSize.max : MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: borderColor, // Solid border color like dashboard
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(13)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.campaign_rounded, color: Colors.white, size: 16),
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
              if (hasBoundedHeight)
                Expanded(child: pageViewContent)
              else
                SizedBox(
                  height: boardWidth * (720.0 / 480.0),
                  child: pageViewContent,
                ),

              // Pagination Controls
              if (pages.length > 1)
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 4),
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
      },
    );
  }
}

class NoticeVideoItem extends StatefulWidget {
  final String url;
  final ArContentModel item;
  const NoticeVideoItem({super.key, required this.url, required this.item});

  @override
  State<NoticeVideoItem> createState() => _NoticeVideoItemState();
}

class _NoticeVideoItemState extends State<NoticeVideoItem> {
  late VideoPlayerController _controller;
  bool _initialized = false;
  bool _hasError = false;
  String _errorMsg = '';

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
            _errorMsg = err.toString().replaceAll('Exception: ', '');
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
        color: Colors.red.withValues(alpha: 0.8),
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            const Row(
              children: [
                Icon(Icons.error_outline, color: Colors.white, size: 24),
                SizedBox(width: 8),
                Text('Video Failed to Load', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
              ],
            ),
            const SizedBox(height: 8),
            Text('Experience ID: ${widget.item.qrLocationId}', style: const TextStyle(color: Colors.white, fontSize: 10)),
            Text('Service ID: ${widget.item.contentReferenceId}', style: const TextStyle(color: Colors.white, fontSize: 10)),
            const Text('Operation: Video Load', style: TextStyle(color: Colors.white, fontSize: 10)),
            const SizedBox(height: 4),
            Text('Error: $_errorMsg', style: const TextStyle(color: Colors.white70, fontSize: 10), maxLines: 3, overflow: TextOverflow.ellipsis),
          ],
        ),
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
