import 'dart:async';
import '../models/context_models.dart';

/// Provides advanced AI reasoning about the spatial environment.
abstract class IAiProvider {
  Future<String> analyzeSpatialContext(SpatialContext context);
  Future<String> analyzeObjectContext(ObjectContext context);
}
