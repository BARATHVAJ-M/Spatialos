import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/widgets/glass_background.dart';
import '../widgets/cache_management_card.dart';

class ProfileDownloadsScreen extends StatelessWidget {
  const ProfileDownloadsScreen({super.key});

  @override
  Widget build(BuildContext context) {
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
                    const Text('Downloads', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
                physics: const BouncingScrollPhysics(),
                children: const [
                  CacheManagementCard(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
