import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class ToastService {
  ToastService._();

  static void show(
    BuildContext context, 
    String message, {
    IconData icon = Icons.info_outline, 
    Color color = AppColors.primary,
    Duration duration = const Duration(seconds: 3),
  }) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        duration: duration,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.only(bottom: 24, left: 24, right: 24),
        content: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: BoxDecoration(
                color: AppColors.glassBackground,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: color.withValues(alpha: 0.6), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: color.withValues(alpha: 0.15),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(icon, color: color, size: 20),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      message,
                      style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  static void showWelcome(BuildContext context, String userName) {
    show(
      context, 
      'Welcome, $userName! Ready to view spatial experiences.', 
      icon: Icons.auto_awesome, 
      color: AppColors.success,
    );
  }

  static void showError(BuildContext context, String errorMsg) {
    show(
      context, 
      errorMsg, 
      icon: Icons.error_outline, 
      color: AppColors.error,
      duration: const Duration(seconds: 4),
    );
  }

  static void showSuccess(BuildContext context, String successMsg) {
    show(
      context, 
      successMsg, 
      icon: Icons.check_circle_outline, 
      color: AppColors.success,
    );
  }
}
