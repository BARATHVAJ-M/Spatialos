import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/settings_provider.dart';

class SettingsCard extends ConsumerWidget {
  const SettingsCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);
    final notifier = ref.read(settingsProvider.notifier);

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1B1C26).withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(left: 20, top: 20, bottom: 8),
            child: Text(
              'Settings',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ),
          if (settings.isLoading)
            const Padding(
              padding: EdgeInsets.all(20),
              child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
            )
          else ...[
            _buildSwitchTile(
              title: 'Camera Permission',
              subtitle: 'Allow SpatialOS to use the camera',
              value: settings.cameraPermission,
              onChanged: (val) {
                notifier.updateCameraPermission(val);
                if (!val) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Camera permission disabled. AR features will not work until re-enabled.')),
                  );
                }
              },
            ),
            const Divider(color: Colors.white10, height: 1),
            _buildSwitchTile(
              title: 'AR Placement',
              subtitle: 'Enable augmented reality content anchoring',
              value: settings.arPlacement,
              onChanged: notifier.updateArPlacement,
            ),
            const Divider(color: Colors.white10, height: 1),
            _buildDropdownTile(
              title: 'Detection',
              subtitle: 'Detection tier: Fast, Balanced, or High Precision',
              value: settings.detectionQuality,
              options: ['Fast', 'Balanced', 'High Precision'],
              onChanged: (val) => notifier.updateDetectionQuality(val!),
            ),
            const Divider(color: Colors.white10, height: 1),
            _buildDropdownTile(
              title: 'Theme',
              subtitle: 'Application appearance',
              value: settings.themeMode,
              options: ['System', 'Light', 'Dark'],
              onChanged: (val) => notifier.updateThemeMode(val!),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSwitchTile({
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return SwitchListTile(
      title: Text(title, style: const TextStyle(color: Colors.white, fontSize: 15)),
      subtitle: Text(subtitle, style: const TextStyle(color: Colors.white54, fontSize: 13)),
      value: value,
      onChanged: onChanged,
      activeColor: AppColors.primary,
      activeTrackColor: AppColors.primary.withValues(alpha: 0.3),
      inactiveThumbColor: Colors.white54,
      inactiveTrackColor: Colors.white10,
    );
  }

  Widget _buildDropdownTile({
    required String title,
    required String subtitle,
    required String value,
    required List<String> options,
    required ValueChanged<String?> onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.white, fontSize: 15)),
                Text(subtitle, style: const TextStyle(color: Colors.white54, fontSize: 13)),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: Colors.white10,
              borderRadius: BorderRadius.circular(8),
            ),
            child: DropdownButton<String>(
              value: value,
              underline: const SizedBox(),
              dropdownColor: const Color(0xFF2B2C3A),
              icon: const Icon(Icons.arrow_drop_down, color: Colors.white54),
              style: const TextStyle(color: Colors.white, fontSize: 14),
              items: options.map((opt) {
                return DropdownMenuItem<String>(
                  value: opt,
                  child: Text(opt),
                );
              }).toList(),
              onChanged: onChanged,
            ),
          ),
        ],
      ),
    );
  }
}
