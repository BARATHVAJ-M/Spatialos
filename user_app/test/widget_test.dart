import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:user_app/main.dart';

void main() {
  testWidgets('App initializes without error', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: SpatialOsUserApp()));
    expect(find.byType(SpatialOsUserApp), findsOneWidget);
  });
}
