import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:user_app/features/mini_apps/notice_board_mini_app.dart';
import 'package:user_app/core/config/api_config.dart';
import 'package:user_app/shared/models/mini_app_content_model.dart';

void main() {
  group('NoticeBoardMiniApp', () {
    testWidgets('renders title and mediaItems correctly based on canvas coordinates', (WidgetTester tester) async {
      final mockModel = MiniAppContentModel(
        id: '1',
        appId: 'NOTICE_BOARD',
        appType: 'INTERACTIVE',
        state: {
          'title': 'Campus Notices',
          'pages': [
            {
              'id': 'page_1',
              'mediaItems': [
                {
                  'id': '1',
                  'type': 'image',
                  'url': 'http://example.com/test.png',
                  'x': 0.1,
                  'y': 0.2,
                  'width': 0.5,
                  'height': 0.5,
                  'rotation': 0
                }
              ]
            }
          ]
        },
      );

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: Center(
                child: SizedBox(
                  width: 300,
                  height: 400,
                  child: NoticeBoardMiniApp(state: mockModel.state),
                ),
              ),
            ),
          ),
        ),
      );

      // Allow image loading futures to settle
      await tester.pumpAndSettle();

      // Check title
      expect(find.text('Campus Notices'), findsOneWidget);

      // Check LayoutBuilder and AspectRatio presence
      expect(find.byType(PageView), findsOneWidget);
      expect(find.byType(Positioned), findsOneWidget);

      // The network image will fail in test environment, rendering the broken_image icon, which is fine
      expect(find.byIcon(Icons.broken_image), findsOneWidget);

      // It should find the Page indicator for single page: "1 / 1" shouldn't show because we hide pagination if pages <= 1
      expect(find.text('1 / 1'), findsNothing);
    });

    testWidgets('renders pagination when multiple pages exist', (WidgetTester tester) async {
      final state = {
        'title': 'Multi Page',
        'pages': [
          { 'id': '1', 'mediaItems': [] },
          { 'id': '2', 'mediaItems': [] }
        ]
      };

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: NoticeBoardMiniApp(state: state),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Multi Page'), findsOneWidget);
      expect(find.byIcon(Icons.chevron_left), findsOneWidget);
      expect(find.byIcon(Icons.chevron_right), findsOneWidget);
      expect(find.text('1 / 2'), findsOneWidget);
    });
  });
}
