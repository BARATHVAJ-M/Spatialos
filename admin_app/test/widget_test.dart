import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:admin_app/main.dart';

void main() {
  testWidgets('SpatialOS Admin Hub application smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: SpatialOsAdminApp()));
    await tester.pump();
    expect(find.text('SpatialOS Admin'), findsOneWidget);
  });
}
