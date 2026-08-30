import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/toast_service.dart';
import '../../../core/config/api_config.dart';
import '../../../shared/widgets/custom_text_field.dart';
import '../../../shared/widgets/primary_button.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _obscurePassword = true;
  bool _isRegistering = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    bool success;
    if (_isRegistering) {
      success = await ref.read(authStateProvider.notifier).register(
        _nameController.text.trim(),
        _emailController.text.trim(),
        _passwordController.text.trim(),
      );
    } else {
      success = await ref.read(authStateProvider.notifier).login(
        _emailController.text.trim(),
        _passwordController.text.trim(),
      );
    }

    if (mounted) {
      if (success) {
        final userName = ref.read(authStateProvider).user?.name ?? 'Viewer';
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
        backgroundColor: const Color(0xFF1E1F29),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: AppColors.glassBorder)),
        title: const Text('Configure Server URL', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Enter your Laptop Server Wi-Fi IP and Port 3001 (Backend API):', style: TextStyle(color: Colors.white70, fontSize: 13)),
            const SizedBox(height: 14),
            CustomTextField(
              controller: controller,
              hintText: 'http://192.168.1.100:3001',
              prefixIcon: Icons.lan_outlined,
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF2E2F3A),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white24),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('⚡ Local Wi-Fi Testing Note:', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                  SizedBox(height: 4),
                  Text('Ensure your laptop server is running and your device is connected to the same LAN or Wi-Fi network.', style: TextStyle(color: Colors.white70, fontSize: 11)),
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
              if (ctx.mounted) Navigator.pop(ctx);
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
      backgroundColor: const Color(0xFF121212), // Plain simple dark background
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: const Color(0xFF1E1E1E), // Flat dark card
                borderRadius: BorderRadius.circular(12), // Simpler radius
                border: Border.all(color: Colors.white12, width: 1), // No glow border
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      height: 72,
                      width: 72,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white10,
                      ),
                      child: ClipOval(
                        child: Image.asset('assets/logo.png', fit: BoxFit.cover, errorBuilder: (ctx, err, stack) => const Icon(Icons.view_in_ar_rounded, size: 40, color: Colors.white)),
                      ),
                    ),
                    const SizedBox(height: 18),
                    const Text(
                      'SpatialOS User',
                      style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: Colors.white),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _isRegistering ? 'Create an account to view AR experiences' : 'Sign in to view spatial AR scenes',
                      style: const TextStyle(fontSize: 13, color: Colors.white70),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    InkWell(
                      onTap: _showServerConfigDialog,
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.black26,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.white10),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.router_rounded, size: 15, color: Colors.white54),
                            const SizedBox(width: 8),
                            Flexible(
                              child: Text(
                                'Server: ${ref.watch(apiConfigProvider).serverUrl}',
                                style: const TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.w500),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 6),
                            const Icon(Icons.edit_outlined, size: 13, color: Colors.white54),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    if (_isRegistering) ...[
                      CustomTextField(
                        controller: _nameController,
                        hintText: 'Full Name / User Name',
                        prefixIcon: Icons.person_outline,
                        validator: (value) => value == null || value.isEmpty ? 'Please enter your user name' : null,
                      ),
                      const SizedBox(height: 14),
                    ],

                    CustomTextField(
                      controller: _emailController,
                      hintText: 'Email Address',
                      prefixIcon: Icons.email_outlined,
                      keyboardType: TextInputType.emailAddress,
                      validator: (value) => value == null || value.isEmpty ? 'Please enter your email' : null,
                    ),
                    const SizedBox(height: 14),

                    CustomTextField(
                      controller: _passwordController,
                      hintText: 'Password',
                      prefixIcon: Icons.lock_outline,
                      obscureText: _obscurePassword,
                      suffixIcon: IconButton(
                        icon: Icon(_obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: Colors.white54),
                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                      ),
                      validator: (value) => value == null || value.isEmpty ? 'Please enter your password' : null,
                    ),
                    const SizedBox(height: 24),

                    PrimaryButton(
                      text: _isRegistering ? 'Create Account' : 'Sign In',
                      icon: _isRegistering ? Icons.person_add_alt_1 : Icons.login,
                      isLoading: authState.isLoading,
                      onPressed: _handleSubmit,
                    ),
                    const SizedBox(height: 18),

                    TextButton(
                      onPressed: () => setState(() {
                        _isRegistering = !_isRegistering;
                        _formKey.currentState?.reset();
                      }),
                      child: Text(
                        _isRegistering ? 'Already have an account? Sign In' : 'New user? Create account',
                        style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
