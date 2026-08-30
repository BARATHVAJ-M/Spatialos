enum ErrorSeverity {
  info,
  warning,
  fatal,
}

/// Standardized error tracking payload.
class EngineErrorData {
  final String errorId;
  final DateTime timestamp;
  final String sourceModule;
  final ErrorSeverity severity;
  final String message;
  final String? stackTrace;
  final bool isRecoverable;

  EngineErrorData({
    required this.errorId,
    required this.timestamp,
    required this.sourceModule,
    required this.severity,
    required this.message,
    this.stackTrace,
    this.isRecoverable = true,
  });

  Map<String, dynamic> toJson() {
    return {
      'errorId': errorId,
      'timestamp': timestamp.toIso8601String(),
      'sourceModule': sourceModule,
      'severity': severity.toString(),
      'message': message,
      'stackTrace': stackTrace,
      'isRecoverable': isRecoverable,
    };
  }
}
