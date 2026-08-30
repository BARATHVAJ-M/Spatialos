import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/profile_provider.dart';

class ProfileInfoCard extends ConsumerStatefulWidget {
  const ProfileInfoCard({super.key});

  @override
  ConsumerState<ProfileInfoCard> createState() => _ProfileInfoCardState();
}

class _ProfileInfoCardState extends ConsumerState<ProfileInfoCard> {
  bool _isEditing = false;
  final TextEditingController _nameController = TextEditingController();
  String? _errorText;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  void _startEditing(String currentName) {
    _nameController.text = currentName;
    setState(() {
      _isEditing = true;
      _errorText = null;
    });
  }

  Future<void> _saveName() async {
    final newName = _nameController.text.trim();
    if (newName.isEmpty) {
      setState(() => _errorText = 'Name cannot be empty');
      return;
    }
    if (newName.length < 3) {
      setState(() => _errorText = 'Minimum 3 characters required');
      return;
    }
    if (newName.length > 40) {
      setState(() => _errorText = 'Maximum 40 characters allowed');
      return;
    }

    final success = await ref.read(profileProvider.notifier).updateName(newName);
    
    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated successfully'), backgroundColor: Colors.green),
      );
      setState(() {
        _isEditing = false;
        _errorText = null;
      });
    } else {
      final error = ref.read(profileProvider).error;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update: $error'), backgroundColor: Colors.redAccent),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authStateProvider).user;
    final isSaving = ref.watch(profileProvider).isLoading;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1B1C26).withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: Colors.transparent,
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white24, width: 2),
                  ),
                  child: const Center(
                    child: Icon(Icons.person_outline, color: Colors.white, size: 30),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (!_isEditing) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              user?.name ?? 'Unknown',
                              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.edit_outlined, color: Colors.white54, size: 20),
                            onPressed: () => _startEditing(user?.name ?? ''),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                          ),
                        ],
                      ),
                    ] else ...[
                      TextField(
                        controller: _nameController,
                        style: const TextStyle(color: Colors.white, fontSize: 16),
                        decoration: InputDecoration(
                          isDense: true,
                          errorText: _errorText,
                          errorStyle: const TextStyle(color: Colors.redAccent, fontSize: 11),
                          enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
                          focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: AppColors.primary)),
                        ),
                        enabled: !isSaving,
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          TextButton(
                            onPressed: isSaving ? null : () => setState(() => _isEditing = false),
                            child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
                          ),
                          TextButton(
                            onPressed: isSaving ? null : _saveName,
                            child: isSaving
                                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary))
                                : const Text('Save', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ],
                    if (!_isEditing) ...[
                      const SizedBox(height: 4),
                      Text(
                        user?.email ?? 'No email',
                        style: const TextStyle(color: Colors.white54, fontSize: 14),
                      ),
                    ]
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
