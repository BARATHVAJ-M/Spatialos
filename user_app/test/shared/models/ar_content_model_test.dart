import 'package:flutter_test/flutter_test.dart';
import 'package:user_app/shared/models/ar_content_model.dart';
import 'package:user_app/shared/models/mini_app_content_model.dart';

void main() {
  group('ArContentModel JSON Parsing', () {
    test('parses basic fields correctly', () {
      final json = {
        'id': '123',
        'qrLocationId': 'LOC-123',
        'contentType': 'MINIAPP',
        'contentReferenceId': 'ref-123',
        'status': 'ACTIVE',
        'createdBy': 'test_user',
        'createdAt': '2026-08-24T18:25:49.899Z',
        'updatedAt': '2026-08-24T18:25:49.899Z',
      };

      final model = ArContentModel.fromJson(json);

      expect(model.id, '123');
      expect(model.qrLocationId, 'LOC-123');
      expect(model.contentType, ArContentType.miniapp);
      expect(model.contentReferenceId, 'ref-123');
      expect(model.status, 'ACTIVE');
      expect(model.createdBy, 'test_user');
    });

    test('handles missing optional fields gracefully', () {
      final json = {
        'id': '456',
        'qrLocationId': 'LOC-456',
        'contentType': 'IMAGE',
        'contentReferenceId': 'ref-456',
        // Missing status, createdBy, createdAt, etc.
      };

      final model = ArContentModel.fromJson(json);

      expect(model.id, '456');
      expect(model.status, 'ACTIVE'); // Default value
      expect(model.createdBy, 'admin'); // Default value
      expect(model.createdAt, isA<DateTime>()); // Defaults to DateTime.now()
    });
  });

  group('MiniAppContentModel JSON Parsing', () {
    test('parses state and mediaItems correctly', () {
      final json = {
        'id': 'mini-1',
        'appId': 'NOTICE_BOARD',
        'appType': 'INTERACTIVE',
        'state': {
          'title': 'Test Notice',
          'mediaItems': [
            {
              'url': 'http://example.com/img.jpg',
              'x': 0.5,
              'y': 0.5,
              'width': 0.5,
              'height': 0.5,
              'rotation': 90
            }
          ]
        }
      };

      final model = MiniAppContentModel.fromJson(json);

      expect(model.id, 'mini-1');
      expect(model.appId, 'NOTICE_BOARD');
      expect(model.state?['title'], 'Test Notice');
      expect(model.state?['mediaItems'], isA<List>());
      expect(model.state?['mediaItems'][0]['url'], 'http://example.com/img.jpg');
    });
  });
}
