import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/toast_service.dart';
import '../../../shared/widgets/glass_background.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/services/cache_service.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  String _customName = 'Administrator';
  String _customEmail = 'admin@spatialos.com';
  String _cacheSize = 'Calculating...';
  final CacheProvider _cacheProvider = DefaultCacheProvider();
  
  late TextEditingController _nameController;
  late TextEditingController _emailController;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authStateProvider).user;
    if (user != null) {
      _customName = user.name;
      _customEmail = user.email;
    }
    _nameController = TextEditingController(text: _customName);
    _emailController = TextEditingController(text: _customEmail);
    _loadCacheSize();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _loadCacheSize() async {
    final size = await _cacheProvider.calculateCacheSize();
    if (mounted) {
      setState(() => _cacheSize = size);
    }
  }

  Future<void> _saveProfile() async {
    final newName = _nameController.text.trim();
    final newEmail = _emailController.text.trim();
    final success = await ref.read(authStateProvider.notifier).updateProfileName(newName);
    
    if (success) {
      if (mounted) {
        ToastService.showSuccess(context, 'Account profile saved successfully!');
      }
    } else {
      if (mounted) {
        ToastService.showError(context, 'Failed to save profile. Try again.');
      }
    }
  }

  Future<void> _clearCache() async {
    setState(() {
      _cacheSize = 'Cleaning...';
    });
    
    try {
      // 1. Clear RAM image cache
      PaintingBinding.instance.imageCache.clear();
      PaintingBinding.instance.imageCache.clearLiveImages();
      
      // 2. Clear physical disk temp cache safely using CacheProvider
      await _cacheProvider.clearAppCache();
      
      setState(() {
        _cacheSize = '0.0 MB';
      });
      if (mounted) {
        ToastService.showSuccess(context, 'Temporary AR textures & camera buffer cache cleaned!');
      }
    } catch (e) {
      setState(() {
        _cacheSize = 'Error';
      });
      if (mounted) {
        ToastService.showError(context, 'Failed to clear cache: $e');
      }
    }
  }

  void _showAboutDialogCustom() {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: const Color(0xFF0F172A),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: AppColors.glassBorder, width: 1.5)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  ClipOval(child: Image.asset('assets/logo.png', width: 44, height: 44, errorBuilder: (_, __, ___) => const Icon(Icons.spatial_audio_off, size: 44, color: AppColors.primary))),
                  const SizedBox(width: 14),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('SpatialOS', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
                      Text('version 1.0.0', style: TextStyle(fontSize: 14, color: AppColors.textSecondary)),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const Text('developed by -  team "unknown"', style: TextStyle(fontSize: 15, color: Colors.white, height: 1.5)),
              const Text('description - "real world into interface "', style: TextStyle(fontSize: 15, color: Colors.white, height: 1.5)),
              const Text('contact - ""', style: TextStyle(fontSize: 15, color: Colors.white, height: 1.5)),
              const Text('website-""', style: TextStyle(fontSize: 15, color: Colors.white, height: 1.5)),
              const Text('github -""', style: TextStyle(fontSize: 15, color: Colors.white, height: 1.5)),
              const Text('license-""', style: TextStyle(fontSize: 15, color: Colors.white, height: 1.5)),
              const SizedBox(height: 24),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Close', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text('Admin Hub & Profile', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: const Color(0xFF0F172A),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20, color: Colors.white),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        child: Column(
          children: [
            // =========================================================
            // COMPLETE PROFILE SECTION MANDATED BY USER
            // =========================================================
            
            // 1. My Account Inline Edit
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.glassBorder, width: 1.5),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.person, color: AppColors.primary),
                      SizedBox(width: 8),
                      Text('Me', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _nameController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      labelText: 'Name',
                      labelStyle: const TextStyle(color: AppColors.textSecondary),
                      filled: true,
                      fillColor: const Color(0xFF0F172A),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _emailController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      labelText: 'Email',
                      labelStyle: const TextStyle(color: AppColors.textSecondary),
                      filled: true,
                      fillColor: const Color(0xFF0F172A),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.save, size: 20),
                      label: const Text('Save Profile', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: _saveProfile,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 2. Saved Places
            _MenuOptionCard(
              icon: Icons.bookmark_outline_rounded,
              title: 'QR Spots',
              subtitle: 'Manage building coordinate anchors and printed codes',
              iconColor: AppColors.accent,
              onTap: () => context.push('/saved-places'),
            ),
            const SizedBox(height: 12),

            // 3. Dashboard
            _MenuOptionCard(
              icon: Icons.analytics_outlined,
              title: 'Analytics',
              subtitle: 'Monitor active scans, wall placements and database metrics',
              iconColor: AppColors.success,
              onTap: () => context.push('/dashboard'),
            ),
            const SizedBox(height: 12),

            // 4. General Settings
            _MenuOptionCard(
              icon: Icons.settings_outlined,
              title: 'Settings',
              subtitle: 'Theme preference and app preferences',
              iconColor: AppColors.primary,
              onTap: () => context.push('/settings'),
            ),
            const SizedBox(height: 12),

            // 5. Cache Management
            _MenuOptionCard(
              icon: Icons.cleaning_services_outlined,
              title: 'Cahe',
              subtitle: 'Temporary AR buffer allocated: $_cacheSize',
              iconColor: AppColors.accent,
              trailing: TextButton(
                onPressed: _clearCache,
                child: const Text('CLEAR', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 12)),
              ),
              onTap: _clearCache,
            ),
            const SizedBox(height: 12),

              // 6. About
            _MenuOptionCard(
              icon: Icons.info_outline,
              title: 'About',
              subtitle: 'SpatialOS version & details',
              iconColor: AppColors.textSecondary,
              onTap: _showAboutDialogCustom,
            ),
            const SizedBox(height: 28),

            // Logout Button
            ElevatedButton.icon(
              icon: const Icon(Icons.logout, size: 20),
              label: const Text('Sign Out of Admin Session', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error.withValues(alpha: 0.8),
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(52),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              onPressed: () {
                ref.read(authStateProvider.notifier).logout();
                context.go('/login');
                ToastService.show(context, 'Signed out safely.', color: AppColors.error);
              },
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}

class _MenuOptionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color iconColor;
  final VoidCallback onTap;
  final Widget? trailing;

  const _MenuOptionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.iconColor,
    required this.onTap,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.glassBorder, width: 1.1),
            boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 10, offset: Offset(0, 4))],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: iconColor, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
                    const SizedBox(height: 2),
                    Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                  ],
                ),
              ),
              trailing ?? const Icon(Icons.arrow_forward_ios, size: 16, color: AppColors.textSecondary),
            ],
          ),
        ),
      ),
    );
  }
}
