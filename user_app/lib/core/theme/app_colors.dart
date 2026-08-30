import 'package:flutter/material.dart';

/// Single source of truth for SpatialOS Minimalist ChatGPT-style theme design tokens.
class AppColors {
  AppColors._(); // Prevent instantiation

  // Minimalist Brand Colors (ChatGPT aesthetic: charcoal, crisp white, clean teal accent)
  static const Color primary = Color(0xFF10A37F); // Clean Minimalist Accent
  static const Color primaryDark = Color(0xFF0E906F);
  static const Color accent = Color(0xFF10A37F);  
  static const Color background = Color(0xFF171717); // Deep Charcoal Dark Mode
  static const Color surface = Color(0xFF212121);    // Solid Card Surface
  static const Color surfaceLight = Color(0xFF2F2F36); // Lighter Card Surface

  // Status & Feedback
  static const Color success = Color(0xFF10A37F);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF3B82F6);

  // Typography (High contrast readability)
  static const Color textPrimary = Color(0xFFECECF1);
  static const Color textSecondary = Color(0xFF8E8EA0);
  static const Color textDisabled = Color(0xFF565869);

  // Minimalist Cards (Replacing glowing glassmorphism with flat solid surfaces)
  static final Color glassBackground = const Color(0xFF2B2B30);
  static final Color glassBorder = const Color(0xFF3B3B42);
  static final Color glassGlow = Colors.transparent;
}
