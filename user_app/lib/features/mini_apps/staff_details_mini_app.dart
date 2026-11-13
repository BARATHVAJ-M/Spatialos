import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:user_app/core/services/api_service.dart';
import 'package:user_app/core/config/api_config.dart';
import 'package:user_app/shared/models/ar_content_model.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:convert';
class StaffDetailsMiniApp extends ConsumerStatefulWidget {
  final ArContentModel item;

  const StaffDetailsMiniApp({super.key, required this.item});

  @override
  ConsumerState<StaffDetailsMiniApp> createState() => _StaffDetailsMiniAppState();
}

class _StaffDetailsMiniAppState extends ConsumerState<StaffDetailsMiniApp> {
  bool _isLoading = true;
  String _error = '';
  Map<String, dynamic>? _profile;

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    final state = widget.item.miniAppContent?.state ?? {};
    
    // Eagerly load profile if provided by the backend preview endpoint
    if (state['profile'] != null) {
      if (mounted) {
        setState(() {
          _profile = Map<String, dynamic>.from(state['profile'] as Map);
          _isLoading = false;
        });
      }
      return; // Skip network call completely
    }

    final staffId = state['staffId'] as String? ?? '';

    if (staffId.isEmpty) {
      if (mounted) {
        setState(() {
          _error = 'No staff ID configured for this AR node.';
          _isLoading = false;
        });
      }
      return;
    }

    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.get(
        '/placements/staff-profile',
        queryParameters: {'staffId': staffId},
      );

      if (response.data != null && response.data['success'] == true) {
        if (mounted) {
          setState(() {
            _profile = response.data['data'] as Map<String, dynamic>?;
            _isLoading = false;
          });
        }
      } else {
        throw Exception(response.data?['error'] ?? 'Staff profile not found.');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Experience ID: ${widget.item.qrLocationId}\nService ID: ${widget.item.contentReferenceId}\nService Type: STAFF_DETAILS\nOperation: fetchProfile\nError: ${e.toString().replaceAll('Exception: ', '')}';
          _isLoading = false;
        });
      }
    }
  }


  @override
  Widget build(BuildContext context) {
    final state = widget.item.miniAppContent?.state ?? {};
    final bool displayContact = state['displayContact'] ?? true;
    final bool displayTimetable = state['displayTimetable'] ?? true;

    return Container(
      width: 340,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A).withValues(alpha: 0.95), // Slate 900
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.15),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.6),
            blurRadius: 30,
            spreadRadius: -10,
          ),
        ],
      ),
      child: _isLoading 
        ? const SizedBox(
            height: 200,
            child: Center(
              child: CircularProgressIndicator(color: Color(0xFF06B6D4)), // Cyan 500
            ),
          )
          : _error.isNotEmpty 
            ? Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.red.withValues(alpha: 0.8),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.error_outline, color: Colors.white, size: 24),
                        SizedBox(width: 8),
                        Text('Staff Profile Load Failed', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(_error, style: const TextStyle(color: Colors.white, fontSize: 12)),
                  ],
                ),
              )
          : _profile == null
            ? const SizedBox(
                height: 200,
                child: Center(
                  child: Text('Profile not found', style: TextStyle(color: Colors.white)),
                ),
              )
            : _buildProfileContent(displayContact, displayTimetable),
    );
  }

  Widget _buildProfileContent(bool displayContact, bool displayTimetable) {
    String? fullPhotoUrl;
    final String? rawPhotoUrl = _profile!['photoUrl'];
    if (rawPhotoUrl != null && rawPhotoUrl.isNotEmpty) {
      if (rawPhotoUrl.startsWith('http')) {
        fullPhotoUrl = rawPhotoUrl;
      } else if (rawPhotoUrl.startsWith('/media/') || rawPhotoUrl.startsWith('/storage/')) {
        final config = ref.read(apiConfigProvider);
        fullPhotoUrl = '${config.serverUrl.replaceFirst(RegExp(r'/$'), '')}$rawPhotoUrl';
      }
    }
    
    final token = ApiService.syncToken;

    String? timetableUrl;
    if (_profile!['timetable'] != null) {
      if (_profile!['timetable'] is Map) {
        timetableUrl = _profile!['timetable']['url'];
      } else if (_profile!['timetable'] is String) {
        try {
          final Map<String, dynamic> parsed = jsonDecode(_profile!['timetable']);
          timetableUrl = parsed['url'];
        } catch (e) {
          timetableUrl = _profile!['timetable']; // Fallback
        }
      }
    }

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B), // Slate 800 - Deep Space OLED Dark Mode
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.15), width: 1.5), // Glass Border
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.5),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Top Accent Bar
          Container(
            height: 6,
            decoration: const BoxDecoration(
              color: Color(0xFF06B6D4), // Cyan 500
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(20),
                topRight: Radius.circular(20),
              ),
            ),
          ),
          
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Main Content: Photo Left, Text Right
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Photo Column
                    Container(
                      width: 110,
                      height: 145,
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F172A), // Slate 900
                        borderRadius: BorderRadius.circular(16), // Rounded rectangle photo
                        border: Border.all(color: const Color(0xFF06B6D4).withValues(alpha: 0.5), width: 2), // Cyan border
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: fullPhotoUrl == null
                            ? const Icon(Icons.person, size: 40, color: Color(0xFF64748B))
                            : Image.network(
                                fullPhotoUrl,
                                headers: token != null ? {'Authorization': 'Bearer $token'} : null,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) {
                                  return const Center(
                                    child: Icon(Icons.broken_image, size: 40, color: Colors.redAccent),
                                  );
                                },
                              ),
                      ),
                    ),
                    const SizedBox(width: 20),
                    
                    // Details Column
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _profile!['name'] ?? 'Unknown Staff',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.w700,
                              letterSpacing: -0.5,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 6),
                          if (_profile!['designation'] != null && _profile!['designation'].isNotEmpty)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFF06B6D4).withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                _profile!['designation'].toUpperCase(),
                                style: const TextStyle(
                                  color: Color(0xFF06B6D4), // Cyan 500
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          const SizedBox(height: 6),
                          if (_profile!['department'] != null && _profile!['department'].isNotEmpty)
                            Text(
                              _profile!['department'],
                              style: const TextStyle(
                                color: Color(0xFF94A3B8), // Slate 400
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),

                          // Contact Info (Compact)
                          if (displayContact && (_profile!['email'] != null || _profile!['phone'] != null)) ...[
                            const SizedBox(height: 12),
                            if (_profile!['email'] != null && _profile!['email'].isNotEmpty)
                              Row(
                                children: [
                                  const Icon(Icons.email_outlined, color: Color(0xFF06B6D4), size: 14),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      _profile!['email'],
                                      style: const TextStyle(color: Color(0xFFE2E8F0), fontSize: 12),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            if (_profile!['phone'] != null && _profile!['phone'].isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 6),
                                child: Row(
                                  children: [
                                    const Icon(Icons.phone_outlined, color: Color(0xFF10B981), size: 14),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        _profile!['phone'],
                                        style: const TextStyle(color: Color(0xFFE2E8F0), fontSize: 12),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                          ],

                          // Academic Details
                          if ((_profile!['subjects'] != null && _profile!['subjects'].isNotEmpty) || 
                              (_profile!['classesInCharge'] != null && _profile!['classesInCharge'].isNotEmpty)) ...[
                            const SizedBox(height: 12),
                            if (_profile!['subjects'] != null && _profile!['subjects'].isNotEmpty) ...[
                              const Text('Subjects', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                              const SizedBox(height: 2),
                              Text(
                                (_profile!['subjects'] is List) ? _profile!['subjects'].join(', ') : _profile!['subjects'].toString(),
                                style: const TextStyle(color: Colors.white, fontSize: 12, height: 1.2),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              if (_profile!['classesInCharge'] != null && _profile!['classesInCharge'].isNotEmpty)
                                const SizedBox(height: 8),
                            ],
                            if (_profile!['classesInCharge'] != null && _profile!['classesInCharge'].isNotEmpty) ...[
                              const Text('Class in Charge', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                              const SizedBox(height: 2),
                              Text(
                                (_profile!['classesInCharge'] is List) ? _profile!['classesInCharge'].join(', ') : _profile!['classesInCharge'].toString(),
                                style: const TextStyle(color: Colors.white, fontSize: 12, height: 1.2),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
                
                // Timetable Button
                if (displayTimetable && timetableUrl != null && timetableUrl.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        final Uri url = Uri.parse(timetableUrl!);
                        if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
                          debugPrint('Could not launch $url');
                        }
                      },
                      icon: const Icon(Icons.table_chart_outlined, color: Colors.white),
                      label: const Text('View Timetable', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF06B6D4), // Cyan 500 accent
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
