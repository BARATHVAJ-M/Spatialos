import 'package:flutter/material.dart';

/// Immutable model representing AR Text elements matching `text_contents` table.
class TextContentModel {
  final String id;
  final String title;
  final String paragraph;
  final String fontFamily;
  final double fontSize;
  final String textColor;      // Hex representation e.g. '#FFFFFF'
  final String backgroundColor; // Hex representation e.g. '#000000'
  final double opacity;
  final DateTime createdAt;
  final DateTime updatedAt;

  const TextContentModel({
    required this.id,
    required this.title,
    required this.paragraph,
    this.fontFamily = 'Nunito',
    this.fontSize = 24.0,
    this.textColor = '#FFFFFF',
    this.backgroundColor = '#6366F1',
    this.opacity = 0.85,
    required this.createdAt,
    required this.updatedAt,
  });

  Color get parsedTextColor {
    return _parseHex(textColor, 1.0);
  }

  Color get parsedBackgroundColor {
    return _parseHex(backgroundColor, opacity);
  }

  static Color _parseHex(String hex, double opacity) {
    try {
      String clean = hex.replaceAll('#', '');
      if (clean.length == 6) {
        clean = 'FF$clean';
      }
      return Color(int.parse(clean, radix: 16)).withValues(alpha: opacity);
    } catch (_) {
      return Colors.white;
    }
  }

  factory TextContentModel.fromJson(Map<String, dynamic> json) {
    return TextContentModel(
      id: (json['id'] ?? 'default-text-id').toString(),
      title: (json['title'] as String?) ?? '',
      paragraph: (json['paragraph'] as String?) ?? '',
      fontFamily: (json['font_family'] ?? json['fontFamily'] as String?) ?? 'Nunito',
      fontSize: ((json['font_size'] ?? json['fontSize']) as num?)?.toDouble() ?? 24.0,
      textColor: (json['text_color'] ?? json['textColor'] as String?) ?? '#FFFFFF',
      backgroundColor: (json['background_color'] ?? json['backgroundColor'] as String?) ?? '#6366F1',
      opacity: ((json['opacity'] ?? 0.85) as num).toDouble(),
      createdAt: DateTime.tryParse((json['created_at'] ?? json['createdAt'] ?? '').toString()) ?? DateTime.now(),
      updatedAt: DateTime.tryParse((json['updated_at'] ?? json['updatedAt'] ?? '').toString()) ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'paragraph': paragraph,
      'font_family': fontFamily,
      'fontFamily': fontFamily,
      'font_size': fontSize,
      'fontSize': fontSize,
      'text_color': textColor,
      'textColor': textColor,
      'background_color': backgroundColor,
      'backgroundColor': backgroundColor,
      'opacity': opacity,
      'created_at': createdAt.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
