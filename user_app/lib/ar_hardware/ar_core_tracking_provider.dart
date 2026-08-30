import 'dart:async';
import 'package:vector_math/vector_math_64.dart';
import 'package:spatialos_ar_engine/spatialos_ar_engine.dart';

class ArCoreTrackingProvider implements ITrackingProvider {
  final StreamController<TrackingState> _stateController = StreamController<TrackingState>.broadcast();
  TrackingState _currentState = TrackingState.initializing;
  Matrix4 _cameraPose = Matrix4.identity();

  @override
  TrackingState get state => _currentState;

  @override
  Stream<TrackingState> get onStateChanged => _stateController.stream;

  @override
  Future<void> initialize() async {
    _updateState(TrackingState.initializing);
  }

  @override
  Future<void> startTracking() async {
    _updateState(TrackingState.tracking);
  }

  @override
  Future<void> stopTracking() async {
    _updateState(TrackingState.stopped);
  }

  @override
  Matrix4 getCameraPose() {
    return _cameraPose;
  }

  void _updateState(TrackingState newState) {
    if (_currentState != newState) {
      _currentState = newState;
      _stateController.add(newState);
    }
  }

  @override
  void dispose() {
    _stateController.close();
  }
}
