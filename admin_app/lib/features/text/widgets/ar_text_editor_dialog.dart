import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/text_content_model.dart';
import '../../../shared/widgets/custom_text_field.dart';
import '../../../shared/widgets/primary_button.dart';

class ArTextEditorDialog extends StatefulWidget {
  final TextContentModel? existingText;
  const ArTextEditorDialog({super.key, this.existingText});

  @override
  State<ArTextEditorDialog> createState() => _ArTextEditorDialogState();
}

class _ArTextEditorDialogState extends State<ArTextEditorDialog> {
  late final TextEditingController _titleController;
  late final TextEditingController _paragraphController;
  late String _selectedFont;
  late String _textColorHex;
  late String _bgColorHex;
  late double _opacity;

  final List<String> _fonts = ['Nunito', 'Roboto', 'Outfit', 'Montserrat'];
  final Map<String, String> _colorPalettes = {
    'Indigo Glow': '#6366F1',
    'Sky Blue': '#38BDF8',
    'Emerald Green': '#10B981',
    'Amber Alert': '#F59E0B',
    'Rose Crimson': '#F43F5E',
    'Dark Velvet': '#1E293B',
  };

  @override
  void initState() {
    super.initState();
    final ext = widget.existingText;
    _titleController = TextEditingController(text: ext?.title ?? '');
    _paragraphController = TextEditingController(text: ext?.paragraph ?? '');
    _selectedFont = ext?.fontFamily ?? 'Nunito';
    _textColorHex = ext?.textColor ?? '#FFFFFF';
    _bgColorHex = ext?.backgroundColor ?? '#6366F1';
    _opacity = ext?.opacity ?? 0.85;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _paragraphController.dispose();
    super.dispose();
  }

  void _save() {
    if (_titleController.text.trim().isEmpty && _paragraphController.text.trim().isEmpty) return;

    final model = TextContentModel(
      id: widget.existingText?.id ?? const Uuid().v4(),
      title: _titleController.text.trim(),
      paragraph: _paragraphController.text.trim(),
      fontFamily: _selectedFont,
      fontSize: 26.0,
      textColor: _textColorHex,
      backgroundColor: _bgColorHex,
      opacity: _opacity,
      createdAt: widget.existingText?.createdAt ?? DateTime.now(),
      updatedAt: DateTime.now(),
    );
    Navigator.of(context).pop(model);
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
          child: Container(
            padding: const EdgeInsets.all(28),
            constraints: const BoxConstraints(maxWidth: 500, maxHeight: 680),
            decoration: BoxDecoration(
              color: AppColors.surface.withValues(alpha: 0.9),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.glassBorder, width: 1.5),
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        widget.existingText != null ? 'Edit AR Wall Text' : 'Design AR Wall Text',
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: AppColors.textSecondary),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  // Live preview badge
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Color(int.parse(_bgColorHex.replaceAll('#', 'FF'), radix: 16)).withValues(alpha: _opacity),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white24),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _titleController.text.isEmpty ? 'Header Preview' : _titleController.text,
                          style: TextStyle(
                            fontSize: 20, 
                            fontWeight: FontWeight.bold, 
                            color: Colors.white,
                            fontFamily: _selectedFont,
                          ),
                        ),
                        if (_paragraphController.text.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Text(
                            _paragraphController.text,
                            style: TextStyle(fontSize: 14, color: Colors.white70, fontFamily: _selectedFont),
                          ),
                        ]
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  CustomTextField(
                    controller: _titleController,
                    hintText: 'Headline Title (e.g., WELCOME TO IT DEPT)',
                    prefixIcon: Icons.title,
                  ),
                  const SizedBox(height: 12),
                  CustomTextField(
                    controller: _paragraphController,
                    hintText: 'Subtext or notice announcements',
                    prefixIcon: Icons.notes,
                    maxLines: 2,
                  ),
                  const SizedBox(height: 16),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Typography Font:', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                      DropdownButton<String>(
                        value: _selectedFont,
                        dropdownColor: AppColors.surface,
                        underline: const SizedBox(),
                        style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold),
                        items: _fonts.map((f) => DropdownMenuItem(value: f, child: Text(f))).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedFont = val);
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  const Text('Theme Palette & Opacity', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: _colorPalettes.entries.map((entry) {
                      final isSelected = _bgColorHex == entry.value;
                      final colorVal = Color(int.parse(entry.value.replaceAll('#', 'FF'), radix: 16));
                      return GestureDetector(
                        onTap: () => setState(() => _bgColorHex = entry.value),
                        child: Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: colorVal,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: isSelected ? Colors.white : Colors.transparent,
                              width: 2.5,
                            ),
                          ),
                          child: isSelected ? const Icon(Icons.check, color: Colors.white, size: 20) : null,
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Icon(Icons.opacity, color: AppColors.textSecondary, size: 18),
                      const SizedBox(width: 8),
                      const Text('Glass Transparency:', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                      Expanded(
                        child: Slider(
                          value: _opacity,
                          min: 0.2,
                          max: 1.0,
                          activeColor: AppColors.primary,
                          onChanged: (val) => setState(() => _opacity = val),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  PrimaryButton(
                    text: widget.existingText != null ? 'Update AR Overlay' : 'Deploy to Wall',
                    icon: Icons.check_circle_outline,
                    onPressed: _save,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
