import 'dart:async';
import 'contracts/i_error_system.dart';
import 'models/engine_error_data.dart';

class ErrorSystem implements IErrorSystem {
  final List<EngineErrorData> _history = [];
  final StreamController<EngineErrorData> _controller = StreamController.broadcast();

  @override
  Stream<EngineErrorData> get onError => _controller.stream;

  @override
  void reportError(EngineErrorData error) {
    _history.add(error);
    _controller.add(error);
    
    // In V1, we print to console. 
    // Later, this connects to the Analytics Module.
    print('[SpatialOS Error] [${error.severity.name.toUpperCase()}] ${error.sourceModule}: ${error.message}');
    if (error.stackTrace != null) {
      print(error.stackTrace);
    }
  }

  @override
  List<EngineErrorData> getErrorHistory() {
    return List.unmodifiable(_history);
  }
  
  void dispose() {
    _controller.close();
  }
}
