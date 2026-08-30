import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/toast_service.dart';
import '../../../core/config/api_config.dart';
import '../../../shared/widgets/glass_background.dart';
import '../../../shared/widgets/custom_text_field.dart';
import '../../../shared/widgets/primary_button.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController(text: 'admin@spatialos.com');
  final _passwordController = TextEditingController(text: 'admin123');
  final _formKey = GlobalKey<FormState>();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final success = await ref.read(authStateProvider.notifier).login(
      _emailController.text.trim(),
      _passwordController.text.trim(),
    );

    if (mounted) {
      if (success) {
        final userName = ref.read(authStateProvider).user?.name ?? 'Admin';
        ToastService.showWelcome(context, userName);
        context.go('/home');
      } else {
        final err = ref.read(authStateProvider).errorMessage ?? 'Authentication failed.';
        ToastService.showError(context, err);
      }
    }
  }

  void _showServerConfigDialog() {
    final config = ref.read(apiConfigProvider);
    final controller = TextEditingController(text: config.serverUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF0F172A),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: AppColors.glassBorder)),
        title: const Text('Configure Laptop Server URL', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Enter your Laptop Wi-Fi IP address and Port 3000:', style: TextStyle(color: Colors.white70, fontSize: 13)),
            const SizedBox(height: 14),
            CustomTextField(
              controller: controller,
              hintText: 'http://192.168.1.6:3000',
              prefixIcon: Icons.lan_outlined,
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.amber.withOpacity(0.5)),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('⚡ Solving "errno 113 / No route to host":', style: TextStyle(color: Colors.amber, fontWeight: FontWeight.bold, fontSize: 12)),
                  SizedBox(height: 4),
                  Text('This error means Windows Defender Firewall is blocking inbound LAN packets to Port 3000.\n\n👉 On your computer, run setup_dev_server.ps1 in PowerShell to automatically open the firewall rule and verify your exact Wi-Fi IP!', style: TextStyle(color: Colors.white70, fontSize: 11)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: Colors.white60))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            onPressed: () async {
              final newUrl = controller.text.trim();
              if (newUrl.isNotEmpty) {
                await ref.read(apiConfigProvider.notifier).setServerUrl(newUrl);
                setState(() {});
                if (mounted) ToastService.showSuccess(context, 'Server connected to $newUrl');
              }
              Navigator.pop(ctx);
            },
            child: const Text('Save & Connect', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);

    return Scaffold(
      body: GlassBackground(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(28),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
                  child: Container(
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      color: AppColors.glassBackground,
                      borderRadius: BorderRadius.circular(28),
                      border: Border.all(color: AppColors.glassBorder, width: 1.5),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          blurRadius: 32,
                          offset: const Offset(0, 16),
                        ),
                      ],
                    ),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Logo & Header
                          Container(
                            height: 80,
                            width: 80,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primary.withValues(alpha: 0.5),
                                  blurRadius: 24,
                                  offset: const Offset(0, 8),
                                )
                              ],
                            ),
                            child: ClipOval(
                              child: Image.asset('assets/logo.png', fit: BoxFit.cover),
                            ),
                          ),
                          const SizedBox(height: 20),
                          const Text(
                            'SpatialOS Admin',
                            style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Enter your credentials to manage AR Anchors',
                            style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 16),
                          InkWell(
                            onTap: _showServerConfigDialog,
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppColors.primary.withValues(alpha: 0.4)),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.router_rounded, size: 16, color: AppColors.accent),
                                  const SizedBox(width: 8),
                                  Flexible(
                                    child: Text(
                                      'Server: ${ref.watch(apiConfigProvider).serverUrl}',
                                      style: const TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.w500),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  const Icon(Icons.edit_outlined, size: 14, color: AppColors.accent),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Email input
                          CustomTextField(
                            controller: _emailController,
                            hintText: 'Admin Email',
                            prefixIcon: Icons.email_outlined,
                            keyboardType: TextInputType.emailAddress,
                            validator: (value) => value == null || value.isEmpty ? 'Please enter your email' : null,
                          ),
                          const SizedBox(height: 16),

                          // Password input
                          CustomTextField(
                            controller: _passwordController,
                            hintText: 'Password',
                            prefixIcon: Icons.lock_outline,
                            obscureText: _obscurePassword,
                            suffixIcon: IconButton(
                              icon: Icon(_obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: AppColors.textSecondary),
                              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                            ),
                            validator: (value) => value == null || value.isEmpty ? 'Please enter your password' : null,
                          ),
                          const SizedBox(height: 28),

                          // Login CTA
                          PrimaryButton(
                            text: 'Authenticate',
                            icon: Icons.login,
                            isLoading: authState.isLoading,
                            onPressed: _handleLogin,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
