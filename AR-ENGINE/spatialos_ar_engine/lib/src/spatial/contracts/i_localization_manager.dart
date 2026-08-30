import 'dart:async';
import '../../objects/models/transform_3d.dart';

/// Orchestrates the process of aligning the digital coordinate system
/// with the physical world using an initial trigger (like QR or GPS).
abstract class ILocalizationManager {
  Future<bool> localizeWithQr(String qrData);
  Future<bool> localizeWithCoordinates(double lat, double lng);
  bool get isLocalized;
  Stream<Vector2> get onLocalizationOffsetChanged;
}
