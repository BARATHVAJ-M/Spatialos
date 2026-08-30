import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/settings_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/toast_service.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  @override
  Widget build(BuildContext context) {
    final settingsAsync = ref.watch(settingsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text('Settings', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: const Color(0xFF0F172A),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20, color: Colors.white),
          onPressed: () => context.pop(),
        ),
      ),
      body: settingsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (err, _) => Center(child: Text('Error: $err', style: const TextStyle(color: AppColors.error))),
        data: (settings) {
          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('AR Surface & Camera Parameters', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 12),
                _buildSwitchTile(
                  'Plane Detection Visualizer', 
                  'Highlight detected walls and surfaces during placement', 
                  settings.showPlaneDetection, 
                  (val) => ref.read(settingsProvider.notifier).updateSettings(settings.copyWith(showPlaneDetection: val))
                ),
                const SizedBox(height: 10),
                _buildSwitchTile(
                  'Show Anchor Gizmo', 
                  'Render spatial root coordinates at QR location', 
                  settings.showAnchorGizmo, 
                  (val) => ref.read(settingsProvider.notifier).updateSettings(settings.copyWith(showAnchorGizmo: val))
                ),
                const SizedBox(height: 10),
                _buildSwitchTile(
                  'Auto-Save Coordinates', 
                  'Automatically sync transformations to repository on drag end', 
                  settings.autoSaveCoordinates, 
                  (val) => ref.read(settingsProvider.notifier).updateSettings(settings.copyWith(autoSaveCoordinates: val))
                ),
                const SizedBox(height: 24),

                const Text('General Preferences', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 12),
                _buildSwitchTile(
                  'Deep Space Dark Mode', 
                  'Enforce vibrant OLED dark themes across all screens', 
                  settings.themeMode == 'DARK', 
                  (val) {
                    if (!val) {
                      ToastService.show(context, 'Prototype V1 currently mandates Dark Mode for visual AR contrast.', icon: Icons.dark_mode);
                    }
                  }
                ),
                const SizedBox(height: 10),
                
                // Camera Quality selector
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.glassBorder),
                    boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 10, offset: Offset(0, 4))],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Camera Stream Quality', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
                          SizedBox(height: 2),
                          Text('Higher resolution increases AR alignment precision', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                        ],
                      ),
                      DropdownButton<String>(
                        value: settings.cameraQuality,
                        dropdownColor: const Color(0xFF0F172A),
                        underline: const SizedBox(),
                        style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold),
                        items: ['720p HD', '1080p Full-HD', '4K UHD'].map((q) {
                          return DropdownMenuItem(value: q, child: Text(q));
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) {
                            ref.read(settingsProvider.notifier).updateSettings(settings.copyWith(cameraQuality: val));
                            ToastService.showSuccess(context, 'Camera quality updated to $val');
                          }
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSwitchTile(String title, String subtitle, bool value, ValueChanged<bool> onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.glassBorder),
        boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 8, offset: Offset(0, 3))],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 2),
                Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ],
            ),
          ),
          Switch(
            value: value,
            activeColor: AppColors.primary,
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}
