import 'package:flutter/material.dart';
import 'package:user_app/shared/models/ar_content_model.dart';


class ClassroomMiniApp extends StatefulWidget {
  final ArContentModel item;

  const ClassroomMiniApp({super.key, required this.item});

  @override
  State<ClassroomMiniApp> createState() => _ClassroomMiniAppState();
}

class _ClassroomMiniAppState extends State<ClassroomMiniApp> {
  bool _isLoading = true;
  String _error = '';
  Map<String, dynamic>? _currentClass;
  Map<String, dynamic>? _nextClass;
  List<dynamic> _reminders = [];
  String _className = '';
  bool _showNextClass = true;
  bool _showReminders = true;

  @override
  void initState() {
    super.initState();
    _fetchClassroomStatus();
  }

  Future<void> _fetchClassroomStatus() async {
    try {
      // Load data directly from the state provided by the AR placement backend
      final state = widget.item.miniAppContent?.state ?? {};
      _className = state['className'] as String? ?? 'Classroom';
      
      if (state['currentClass'] != null) {
        _currentClass = Map<String, dynamic>.from(state['currentClass'] as Map);
      }
      if (state['nextClass'] != null) {
        _nextClass = Map<String, dynamic>.from(state['nextClass'] as Map);
      }
      if (state['reminders'] != null) {
        _reminders = List<dynamic>.from(state['reminders'] as List);
      }
      
      final displayOptions = state['displayOptions'] as Map<String, dynamic>?;
      if (displayOptions != null) {
        _showNextClass = displayOptions['showNextClass'] ?? true;
        _showReminders = displayOptions['showReminders'] ?? true;
      }
      
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Experience ID: ${widget.item.qrLocationId}\nService ID: ${widget.item.contentReferenceId}\nService Type: CLASSROOM\nOperation: fetchClassroomStatus\nError: ${e.toString().replaceAll('Exception: ', '')}';
          _isLoading = false;
        });
      }
    }
  }


  String _formatTime(String? time24) {
    if (time24 == null || time24.isEmpty) return '--:--';
    try {
      final parts = time24.split(':');
      final hour = int.parse(parts[0]);
      final minute = parts.length > 1 ? parts[1] : '00';
      final period = hour >= 12 ? 'PM' : 'AM';
      var hour12 = hour % 12;
      if (hour12 == 0) hour12 = 12;
      return '$hour12:$minute $period';
    } catch (_) {
      return time24;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Container(
        width: 480,
        height: 600,
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A).withValues(alpha: 0.9),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.white24, width: 2),
        ),
        child: const Center(child: CircularProgressIndicator(color: Colors.white)),
      );
    }

    if (_error.isNotEmpty) {
      return Container(
        width: 320,
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
                Text('Classroom Load Failed', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              ],
            ),
            const SizedBox(height: 8),
            Text(_error, style: const TextStyle(color: Colors.white, fontSize: 12)),
          ],
        ),
      );
    }

    final bool hasCurrentClass = _currentClass != null && (_currentClass!['subject'] as String? ?? '').trim().isNotEmpty;
    final bool hasNextClass = _showNextClass && _nextClass != null && (_nextClass!['subject'] as String? ?? '').trim().isNotEmpty;

    return Container(
      width: 480,
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A).withValues(alpha: 0.95), // Deep Space OLED
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.15), width: 2),
        boxShadow: [
          BoxShadow(
            color: Colors.cyanAccent.withValues(alpha: 0.1),
            blurRadius: 30,
            spreadRadius: 5,
          )
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 24),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.05),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(22)),
              border: Border(bottom: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
            ),
            child: Row(
              children: [
                const Icon(Icons.school, color: Colors.cyanAccent, size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _className,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: hasCurrentClass ? Colors.redAccent.withValues(alpha: 0.2) : Colors.greenAccent.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: hasCurrentClass ? Colors.redAccent : Colors.greenAccent),
                  ),
                  child: Text(
                    hasCurrentClass ? 'OCCUPIED' : 'AVAILABLE',
                    style: TextStyle(
                      color: hasCurrentClass ? Colors.redAccent : Colors.greenAccent,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                )
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Current Class Status
                if (hasCurrentClass) ...[
                  const Text('NOW', style: TextStyle(color: Colors.cyanAccent, fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 2)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B), // Slate 800
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.cyanAccent.withValues(alpha: 0.3)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _currentClass!['subject'] ?? 'Unknown Subject',
                          style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            const Icon(Icons.person, color: Colors.white70, size: 20),
                            const SizedBox(width: 8),
                            Text(_currentClass!['staff'] ?? 'TBD', style: const TextStyle(color: Colors.white70, fontSize: 18)),
                            const Spacer(),
                            const Icon(Icons.access_time, color: Colors.white70, size: 20),
                            const SizedBox(width: 8),
                            Text(_formatTime(_currentClass!['time']), style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                          ],
                        )
                      ],
                    ),
                  ),
                ] else ...[
                  const Text('NOW', style: TextStyle(color: Colors.greenAccent, fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 2)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.greenAccent.withValues(alpha: 0.3)),
                    ),
                    child: const Center(
                      child: Text('No Ongoing Class', style: TextStyle(color: Colors.white54, fontSize: 20, fontStyle: FontStyle.italic)),
                    ),
                  ),
                ],

                const SizedBox(height: 24),

                // Next Class Status
                if (hasNextClass) ...[
                  const Text('UP NEXT', style: TextStyle(color: Colors.white54, fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 2)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B).withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white10),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _nextClass!['subject'] ?? 'Unknown',
                                style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 4),
                              Text(_nextClass!['staff'] ?? 'TBD', style: const TextStyle(color: Colors.white54, fontSize: 14)),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.black26,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            _formatTime(_nextClass!['time']),
                            style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                        )
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                ],

                // Reminders
                if (_showReminders && _reminders.isNotEmpty) ...[
                  const Text('REMINDERS', style: TextStyle(color: Colors.amberAccent, fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 2)),
                  const SizedBox(height: 8),
                  ..._reminders.map((r) => Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.amberAccent.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.amberAccent.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.notifications_active, color: Colors.amberAccent, size: 24),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(r['title'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              Text(r['description'] ?? '', style: const TextStyle(color: Colors.white70, fontSize: 14)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  )),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
