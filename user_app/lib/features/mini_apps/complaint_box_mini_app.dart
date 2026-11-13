import 'package:flutter/material.dart';
import 'package:user_app/shared/models/ar_content_model.dart';
import 'package:url_launcher/url_launcher.dart';


class ComplaintBoxMiniApp extends StatefulWidget {
  final ArContentModel item;

  const ComplaintBoxMiniApp({super.key, required this.item});

  @override
  State<ComplaintBoxMiniApp> createState() => _ComplaintBoxMiniAppState();
}

class _ComplaintBoxMiniAppState extends State<ComplaintBoxMiniApp> {
  bool _isLoading = false;
  String _error = '';

  Future<void> _submitGrievance() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      // Directly use the googleFormUrl stored in the mini-app state (sent by backend)
      final state = widget.item.miniAppContent?.state ?? {};
      final urlString = state['googleFormUrl'] as String? ?? '';

      if (urlString.isEmpty) {
        throw Exception('No complaint form URL configured for this location.');
      }

      final uri = Uri.parse(urlString);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        throw Exception('Could not open the complaint form. Please try again.');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Experience ID: ${widget.item.qrLocationId}\nService ID: ${widget.item.contentReferenceId}\nService Type: COMPLAINT_BOX\nOperation: submitGrievance\nError: ${e.toString().replaceAll('Exception: ', '')}';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = widget.item.miniAppContent?.state ?? {};
    final title = state['title'] ?? 'Complaint Box';
    final description = state['description'] ?? 'Submit your grievances securely.';
    final privacyMessage = state['privacyMessage'] ?? 'SpatialOS does not track or store your details.';

    return Container(
      width: 320,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A).withValues(alpha: 0.9), // Slate 900
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.1),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.5),
            blurRadius: 20,
            spreadRadius: -5,
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Icon
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: const Color(0xFF06B6D4).withValues(alpha: 0.1), // Cyan 500 at 10%
              shape: BoxShape.circle,
            ),
            child: const Center(
              child: Icon(
                Icons.lock_outline,
                color: Color(0xFF06B6D4), // Cyan 500
                size: 32,
              ),
            ),
          ),
          const SizedBox(height: 20),
          
          // Title
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 8),
          
          // Description
          Text(
            description,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF94A3B8), // Slate 400
              fontSize: 15,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 24),
          
          // Privacy Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B), // Slate 800
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: const Color(0xFF334155), // Slate 700
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.shield_outlined,
                  color: Color(0xFF10B981), // Emerald 500
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    privacyMessage,
                    style: const TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 12,
                      height: 1.5,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          // Action Button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _submitGrievance,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF06B6D4), // Cyan 500
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                disabledBackgroundColor: const Color(0xFF06B6D4).withValues(alpha: 0.5),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : const Text(
                      'Submit Grievance',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
            ),
          ),
          
          // Error Message
          if (_error.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Text(
                _error,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Color(0xFFEF4444), // Red 500
                  fontSize: 12,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
