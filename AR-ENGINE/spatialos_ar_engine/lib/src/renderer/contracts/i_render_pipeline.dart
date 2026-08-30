import '../../objects/models/i_spatial_node_data.dart';

/// The strict boundary contract defining how the engine's logical scene
/// is passed to the host application to be physically drawn on the screen.
abstract class IRenderPipeline {
  /// Invoked by the engine whenever the logical 3D Scene Graph changes.
  /// The host application must update its 3D renderer (e.g. Filament/Flutter3D)
  /// to match this snapshot.
  void onSceneSnapshotUpdated(List<ISpatialNodeData> nodes);
  
  /// Called when the engine requests the renderer to completely clear all visuals.
  void clearRenderer();
}
