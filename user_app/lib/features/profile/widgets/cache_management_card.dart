import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/cache_provider.dart';

class CacheManagementCard extends ConsumerWidget {
  const CacheManagementCard({super.key});

  String _formatBytes(int bytes) {
    if (bytes <= 0) return "0 B";
    const suffixes = ["B", "KB", "MB", "GB", "TB"];
    var i = (bytes > 0) ? (bytes.toDouble() / 1024).floor() : 0;
    if (i == 0) return "$bytes B";
    i = (bytes.toDouble() / 1024 / 1024).floor() > 0 ? 2 : 1;
    final value = bytes / (1024 * (i == 1 ? 1 : 1024));
    return "${value.toStringAsFixed(1)} ${suffixes[i]}";
  }

  void _confirmClearCache(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1B1C26),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Colors.white10),
        ),
        title: const Text('Clear Cache', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: const Text(
          'This will remove temporary downloaded images, videos and cached AR assets.\n\nYour account and uploaded content will not be affected.',
          style: TextStyle(color: Colors.white70, fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent.withValues(alpha: 0.2),
              foregroundColor: Colors.redAccent,
              elevation: 0,
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              final result = await ref.read(cacheProvider.notifier).clearCache();
              
              if (!context.mounted) return;
              
              if (result['success'] == true) {
                final freed = _formatBytes(result['bytesFreed'] as int);
                final files = result['filesRemoved'];
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Cache cleared: Freed $freed across $files files.'),
                    backgroundColor: Colors.green,
                  ),
                );
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Failed to clear cache: ${result['error']}'),
                    backgroundColor: Colors.redAccent,
                  ),
                );
              }
            },
            child: const Text('Clear'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cacheState = ref.watch(cacheProvider);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1B1C26).withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Cache',
            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            'Manage temporary application data.',
            style: TextStyle(color: Colors.white54, fontSize: 13),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              cacheState.when(
                data: (size) => Text(
                  _formatBytes(size),
                  style: const TextStyle(color: AppColors.primary, fontSize: 15, fontWeight: FontWeight.bold),
                ),
                loading: () => const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)),
                error: (_, __) => const Text('Error loading size', style: TextStyle(color: Colors.redAccent, fontSize: 13)),
              ),
              OutlinedButton(
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.white24),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                onPressed: cacheState.isLoading ? null : () => _confirmClearCache(context, ref),
                child: const Text('Clear Cache', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
