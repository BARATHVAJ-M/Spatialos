import 'dart:async';

/// Detects QR codes in the physical world to bootstrap localization.
abstract class IQrDetector {
  Stream<String> get onQrDetected;
  Future<void> startScanning();
  Future<void> stopScanning();
}
