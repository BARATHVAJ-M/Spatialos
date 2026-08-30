import 'package:flutter_test/flutter_test.dart';
import 'package:dio/dio.dart';
import 'package:user_app/core/services/api_service.dart';
import 'package:user_app/repositories/api_ar_content_repository.dart';
import 'package:user_app/shared/models/ar_content_model.dart';

class FakeApiService implements ApiService {
  final Map<String, dynamic>? Function(String path) responseMock;
  final Exception? Function(String path)? errorMock;

  FakeApiService({required this.responseMock, this.errorMock});

  @override
  Future<Response<T>> get<T>(String path, {Map<String, dynamic>? queryParameters}) async {
    if (errorMock != null) {
      final err = errorMock!(path);
      if (err != null) throw err;
    }
    return Response<T>(
      requestOptions: RequestOptions(path: path),
      data: responseMock(path) as T,
    );
  }
  
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  group('ApiArContentRepository', () {
    test('returns empty list if response is unsuccessful', () async {
      final fakeApi = FakeApiService(
        responseMock: (path) => {'success': false},
      );
      final repository = ApiArContentRepository(fakeApi);

      final result = await repository.getContentForLocation('LOC-123');
      expect(result, isEmpty);
    });

    test('returns parsed ArContentModels on success', () async {
      final mockResponseData = {
        'success': true,
        'data': {
          'objects': [
            {
              'id': 'obj-1',
              'contentType': 'MINIAPP',
              'contentReferenceId': 'ref-1',
              'qrLocationId': 'LOC-123',
              'contentData': {
                'id': 'content-1',
                'appId': 'NOTICE_BOARD',
                'appType': 'INTERACTIVE',
                'state': {'title': 'Test Notice'}
              }
            }
          ]
        }
      };

      final fakeApi = FakeApiService(
        responseMock: (path) => mockResponseData,
      );
      final repository = ApiArContentRepository(fakeApi);

      final result = await repository.getContentForLocation('LOC-123');
      
      expect(result.length, 1);
      expect(result.first.id, 'obj-1');
      expect(result.first.contentType, ArContentType.miniapp);
      expect(result.first.miniAppContent, isNotNull);
    });

    test('throws exception on network error', () async {
      final fakeApi = FakeApiService(
        responseMock: (path) => null,
        errorMock: (path) => Exception('Network Error'),
      );
      final repository = ApiArContentRepository(fakeApi);

      expect(() => repository.getContentForLocation('LOC-123'), throwsException);
    });
  });
}
