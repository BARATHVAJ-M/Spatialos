import 'transform_3d.dart';
import 'i_spatial_node_data.dart';

enum NodeType { plane, image, video, text, miniApp, model3D, unknown, button, form }

/// Base class for any object in the SpatialOS Scene.
abstract class SpatialNode implements ISpatialNodeData {
  @override
  final String id;
  @override
  final String? parentId;
  final NodeType nodeType;
  @override
  final Transform3D localTransform;
  @override
  final bool isVisible;
  @override
  final bool isEnabled;
  @override
  final Map<String, dynamic> metadata;

  SpatialNode({
    required this.id,
    this.parentId,
    required this.nodeType,
    required this.localTransform,
    this.isVisible = true,
    this.isEnabled = true,
    this.metadata = const {},
  });

  @override
  String get type => nodeType.toString().split('.').last;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'parentId': parentId,
      'type': type,
      'localTransform': localTransform.toJson(),
      'isVisible': isVisible,
    };
  }

  factory SpatialNode.fromJson(Map<String, dynamic> json) {
    switch(json['type']) {
      case 'image': return ImageNode.fromJson(json);
      case 'text': return TextNode.fromJson(json);
      case 'miniApp': return MiniAppNode.fromJson(json);
      // Fallback for generic node (like an empty plane anchor)
      default: 
        return _GenericNode(
          id: json['id'],
          parentId: json['parentId'],
          nodeType: NodeType.values.firstWhere((e) => e.toString().split('.').last == json['type']),
          localTransform: Transform3D.fromJson(json['localTransform']),
          isVisible: json['isVisible'] ?? true,
        );
    }
  }
}

class _GenericNode extends SpatialNode {
  _GenericNode({
    required super.id,
    super.parentId,
    required super.nodeType,
    required super.localTransform,
    super.isVisible,
  });
}

class ImageNode extends SpatialNode {
  final String imageUrl;
  final double physicalWidth;

  ImageNode({
    required super.id,
    super.parentId,
    required super.localTransform,
    required this.imageUrl,
    required this.physicalWidth,
    super.isVisible,
  }) : super(nodeType: NodeType.image);

  factory ImageNode.fromJson(Map<String, dynamic> json) {
    return ImageNode(
      id: json['id'],
      parentId: json['parentId'],
      localTransform: Transform3D.fromJson(json['localTransform']),
      imageUrl: json['imageUrl'],
      physicalWidth: json['physicalWidth']?.toDouble() ?? 1.0,
      isVisible: json['isVisible'] ?? true,
    );
  }

  @override
  Map<String, dynamic> toJson() {
    final data = super.toJson();
    data['imageUrl'] = imageUrl;
    data['physicalWidth'] = physicalWidth;
    return data;
  }
}

class TextNode extends SpatialNode {
  final String text;
  final double fontSize;
  final String hexColor;

  TextNode({
    required super.id,
    super.parentId,
    required super.localTransform,
    required this.text,
    required this.fontSize,
    required this.hexColor,
    super.isVisible,
  }) : super(nodeType: NodeType.text);

  factory TextNode.fromJson(Map<String, dynamic> json) {
    return TextNode(
      id: json['id'],
      parentId: json['parentId'],
      localTransform: Transform3D.fromJson(json['localTransform']),
      text: json['text'],
      fontSize: json['fontSize']?.toDouble() ?? 14.0,
      hexColor: json['hexColor'] ?? '#FFFFFF',
      isVisible: json['isVisible'] ?? true,
    );
  }
  
  @override
  Map<String, dynamic> toJson() {
    final data = super.toJson();
    data['text'] = text;
    data['fontSize'] = fontSize;
    data['hexColor'] = hexColor;
    return data;
  }
}

class MiniAppNode extends SpatialNode {
  final String appId;
  final String entryRoute;
  final Map<String, dynamic> initialPayload;

  MiniAppNode({
    required super.id,
    super.parentId,
    required super.localTransform,
    required this.appId,
    required this.entryRoute,
    required this.initialPayload,
    super.isVisible,
  }) : super(nodeType: NodeType.miniApp);

  factory MiniAppNode.fromJson(Map<String, dynamic> json) {
    return MiniAppNode(
      id: json['id'],
      parentId: json['parentId'],
      localTransform: Transform3D.fromJson(json['localTransform']),
      appId: json['appId'],
      entryRoute: json['entryRoute'],
      initialPayload: json['initialPayload'] ?? {},
      isVisible: json['isVisible'] ?? true,
    );
  }

  @override
  Map<String, dynamic> toJson() {
    final data = super.toJson();
    data['appId'] = appId;
    data['entryRoute'] = entryRoute;
    data['initialPayload'] = initialPayload;
    return data;
  }
}
