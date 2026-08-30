import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/widgets/glass_background.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/cache_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  void _confirmLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1B1C26),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Colors.white10),
        ),
        title: const Text('Logout', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: const Text(
          'Are you sure you want to logout?\n\nThis will clear your active session.',
          style: TextStyle(color: Colors.white70),
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
              await ref.read(cacheProvider.notifier).clearCache();
              await ref.read(authStateProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuTile(BuildContext context, {required String title, required String subtitle, required IconData icon, required VoidCallback onTap, Color iconColor = AppColors.primary}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1B1C26).withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white12, width: 1),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.15),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: iconColor),
        ),
        title: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
        subtitle: Text(subtitle, style: const TextStyle(color: Colors.white60, fontSize: 13)),
        trailing: const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white30, size: 16),
        onTap: onTap,
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: GlassBackground(
        child: Column(
          children: [
            SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                      onPressed: () => context.pop(),
                    ),
                    const SizedBox(width: 8),
                    const Text('Profile', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
                physics: const BouncingScrollPhysics(),
                children: [
                  _buildMenuTile(
                    context,
                    title: 'Me',
                    subtitle: 'Name, email, and account info',
                    icon: Icons.person_rounded,
                    iconColor: AppColors.primary,
                    onTap: () => context.push('/profile/me'),
                  ),
                  _buildMenuTile(
                    context,
                    title: 'Settings',
                    subtitle: 'All application settings',
                    icon: Icons.settings_rounded,
                    iconColor: AppColors.info,
                    onTap: () => context.push('/profile/settings'),
                  ),
                  _buildMenuTile(
                    context,
                    title: 'Downloads',
                    subtitle: 'Clear cache and manage storage',
                    icon: Icons.folder_rounded,
                    iconColor: AppColors.accent,
                    onTap: () => context.push('/profile/downloads'),
                  ),
                  _buildMenuTile(
                    context,
                    title: 'About',
                    subtitle: 'Version info and legal',
                    icon: Icons.info_outline_rounded,
                    iconColor: AppColors.success,
                    onTap: () => context.push('/profile/about'),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.redAccent.withValues(alpha: 0.1),
                        foregroundColor: Colors.redAccent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                          side: BorderSide(color: Colors.redAccent.withValues(alpha: 0.3)),
                        ),
                        elevation: 0,
                      ),
                      onPressed: () => _confirmLogout(context, ref),
                      child: const Text('Logout', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
