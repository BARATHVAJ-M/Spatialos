import '../models/engine_error_data.dart';

/// Centralized crash and error router.
abstract class IErrorSystem {
  /// Emits whenever an error is recorded.
  Stream<EngineErrorData> get onError;

  /// Reports a new error to the system.
  void reportError(EngineErrorData error);

  /// Returns the history of errors that occurred during this session.
  List<EngineErrorData> getErrorHistory();
}
