import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class AboutSpatialOsCard extends StatelessWidget {
  const AboutSpatialOsCard({super.key});

  Future<void> _launchUrl(String urlString) async {
    final Uri url = Uri.parse(urlString);
    if (!await launchUrl(url)) {
      throw Exception('Could not launch $url');
    }
  }

  void _showLicenseDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1B1C26),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Colors.white10)),
        title: const Text('License', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: const Text(
          'Copyright © PAANDA\n\nAll Rights Reserved.\n\nThis is Prototype 1. Full open source licenses will be listed here in future releases.',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close', style: TextStyle(color: Colors.white54)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
      decoration: BoxDecoration(
        color: const Color(0xFF1B1C26).withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        children: [
          const Text(
            'SpatialOS',
            style: TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold, letterSpacing: -1),
          ),
          const SizedBox(height: 4),
          const Text(
            'from PAANDA',
            style: TextStyle(color: Colors.white54, fontSize: 14, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 24),
          const Text(
            '"Changing the Real World into an Interface."',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white, fontSize: 16, fontStyle: FontStyle.italic, fontWeight: FontWeight.w300),
          ),
          const SizedBox(height: 24),
          const Text(
            'SpatialOS is a spatial computing platform that transforms physical places into interactive digital experiences using Augmented Reality.\n\nIt enables users to discover, navigate, learn, and interact with real-world environments through location-aware digital content.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white70, fontSize: 14, height: 1.5),
          ),
          const SizedBox(height: 32),
          const Divider(color: Colors.white10, height: 1),
          const SizedBox(height: 16),
          
          _buildInfoRow('Version', '1.0.0'),
          _buildInfoRow('Build', 'Prototype 1'),
          _buildInfoRow('Developer', 'Team Unknown'),
          
          const SizedBox(height: 16),
          const Divider(color: Colors.white10, height: 1),
          const SizedBox(height: 16),

          _buildLinkRow('Email', 'paanda.group@gmail.com', () => _launchUrl('mailto:paanda.group@gmail.com')),
          _buildLinkRow('GitHub Repository', 'View Source', () => _launchUrl('https://github.com')),
          _buildLinkRow('License', 'Copyright © PAANDA', () => _showLicenseDialog(context)),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.white54, fontSize: 14)),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildLinkRow(String label, String actionText, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.white54, fontSize: 14)),
          InkWell(
            onTap: onTap,
            child: Text(
              actionText,
              style: const TextStyle(color: Colors.blueAccent, fontSize: 14, fontWeight: FontWeight.w600, decoration: TextDecoration.underline),
            ),
          ),
        ],
      ),
    );
  }
}
