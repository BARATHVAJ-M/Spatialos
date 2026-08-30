import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/glass_background.dart';
import '../../qr/providers/qr_location_provider.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final qrLocationsAsync = ref.watch(qrLocationsProvider);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: const Text('Analytics', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: GlassBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          child: qrLocationsAsync.when(
            loading: () => const Center(child: Padding(padding: EdgeInsets.all(50), child: CircularProgressIndicator(color: AppColors.primary))),
            error: (err, _) => Center(child: Text('Error: $err', style: const TextStyle(color: AppColors.error))),
            data: (locations) {
              final activeCount = locations.length;

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('System Health & Live Metrics', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(child: _StatCard(title: 'Active Spots', value: '${locations.where((l) => l.status == 'ACTIVE').length}', change: 'Currently Scannable', color: AppColors.success)),
                      const SizedBox(width: 14),
                      Expanded(child: _StatCard(title: 'Inactive Spots', value: '${locations.where((l) => l.status != 'ACTIVE').length}', change: 'Disabled/Archived', color: AppColors.error)),
                    ],
                  ),
                  const SizedBox(height: 28),

                  const Text('Live Spatial Anchor Registry', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  const SizedBox(height: 14),
                  if (locations.isEmpty)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.symmetric(vertical: 40),
                        child: Text(
                          'No QR Anchors created yet in this database.\nGenerate your first anchor from Saved Places!',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
                        ),
                      ),
                    )
                  else
                    ...locations.map((loc) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _ActivityRow(
                            location: loc.qrCode,
                            action: loc.locationName,
                            time: '${loc.building} - ${loc.room}',
                            icon: Icons.qr_code_2,
                            iconColor: loc.status == 'ACTIVE' ? AppColors.success : AppColors.error,
                          ),
                        )),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final String change;
  final Color color;

  const _StatCard({required this.title, required this.value, required this.change, required this.color});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.glassBackground,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.glassBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
              const SizedBox(height: 8),
              Text(value, style: TextStyle(color: color, fontSize: 26, fontWeight: FontWeight.w900)),
              const SizedBox(height: 6),
              Text(change, style: const TextStyle(color: AppColors.textPrimary, fontSize: 12, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActivityRow extends StatelessWidget {
  final String location;
  final String action;
  final String time;
  final IconData icon;
  final Color iconColor;

  const _ActivityRow({required this.location, required this.action, required this.time, required this.icon, required this.iconColor});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface.withValues(alpha: 0.6),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white12),
          ),
          child: Row(
            children: [
              Icon(icon, color: iconColor, size: 22),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(action, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
                    const SizedBox(height: 2),
                    Text(location, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                  ],
                ),
              ),
              Text(time, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontStyle: FontStyle.italic)),
            ],
          ),
        ),
      ),
    );
  }
}
