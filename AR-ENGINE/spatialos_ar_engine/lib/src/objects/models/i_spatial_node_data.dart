import 'transform_3d.dart';

/// The base contract for all logical objects in the AR Scene.
abstract class ISpatialNodeData {
  String get id;
  String? get parentId;
  String get type;
  Transform3D get localTransform;
  bool get isVisible;
  bool get isEnabled;
  Map<String, dynamic> get metadata;

  Map<String, dynamic> toJson();
}
