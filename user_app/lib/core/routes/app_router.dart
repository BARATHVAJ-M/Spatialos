import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/profile/screens/profile_me_screen.dart';
import '../../features/profile/screens/profile_settings_screen.dart';
import '../../features/profile/screens/profile_downloads_screen.dart';
import '../../features/profile/screens/profile_about_screen.dart';

/// Centralized GoRouter navigation router for SpatialOS User App.
final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/login',
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/profile/me',
        builder: (context, state) => const ProfileMeScreen(),
      ),
      GoRoute(
        path: '/profile/settings',
        builder: (context, state) => const ProfileSettingsScreen(),
      ),
      GoRoute(
        path: '/profile/downloads',
        builder: (context, state) => const ProfileDownloadsScreen(),
      ),
      GoRoute(
        path: '/profile/about',
        builder: (context, state) => const ProfileAboutScreen(),
      ),
    ],
  );
});
