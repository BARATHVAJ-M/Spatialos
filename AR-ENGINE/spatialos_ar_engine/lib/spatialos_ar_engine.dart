library spatialos_ar_engine;

// ==========================================
// SPATIALOS AR ENGINE - PUBLIC EXPORT BARREL
// ==========================================
// 
// IMPORTANT: This file MUST ONLY export Contracts (Interfaces) and 
// Data Models (DTOs). 
// Concrete implementations from `src/` must remain hidden to enforce 
// strict inversion of control.
//

// CORE EXPORTS
export 'src/core/contracts/i_engine_core.dart';
export 'src/core/contracts/i_module_manager.dart';
export 'src/core/contracts/i_event_bus.dart';
export 'src/core/contracts/i_configuration.dart';
export 'src/core/contracts/i_error_system.dart';
export 'src/core/models/engine_error_data.dart';

// DEVICE EXPORTS
export 'src/device/contracts/i_camera_provider.dart';
export 'src/device/contracts/i_sensor_provider.dart';
export 'src/device/contracts/i_permission_manager.dart';
export 'src/device/models/device_capability.dart';

// OBJECTS / MATH EXPORTS
export 'src/objects/models/transform_3d.dart';
export 'src/objects/models/i_spatial_node_data.dart';
export 'src/objects/models/plane_node_data.dart';
export 'src/objects/models/image_node_data.dart';
export 'src/objects/models/video_node_data.dart';
export 'src/objects/models/model_3d_node_data.dart';
export 'src/objects/models/mini_app_node_data.dart';
export 'src/objects/models/spatial_node.dart';
export 'src/objects/models/model3d_node.dart';
export 'src/objects/models/button_node.dart';
export 'src/objects/models/form_node.dart';

// SPATIAL EXPORTS
export 'src/spatial/contracts/i_world_tracker.dart';
export 'src/spatial/contracts/i_anchor_contract.dart';
export 'src/spatial/contracts/i_localization_manager.dart';
export 'src/spatial/models/spatial_pose.dart';
export 'src/spatial/models/spatial_anchor.dart';
export 'src/spatial/models/spatial_identity.dart';

// SCENE EXPORTS
export 'src/scene/contracts/i_scene_manager.dart';

// INTERACTION EXPORTS
export 'src/interaction/contracts/i_interaction_system.dart';
export 'src/interaction/contracts/i_input_manager.dart';
export 'src/interaction/contracts/i_gesture_recognizer.dart';
export 'src/interaction/models/interaction_event.dart';

// MINI-APPS EXPORTS
export 'src/mini_apps/contracts/i_mini_app_runtime.dart';
export 'src/mini_apps/contracts/i_mini_app_api.dart';
export 'src/mini_apps/contracts/i_mini_app_registry.dart';
export 'src/mini_apps/models/mini_app_manifest.dart';
export 'src/mini_apps/models/mini_app_permissions.dart';

// DETECTION EXPORTS
export 'src/detection/contracts/i_plane_detector.dart';
export 'src/detection/contracts/i_qr_detector.dart';
export 'src/detection/contracts/i_image_detector.dart';
export 'src/detection/contracts/i_marker_detector.dart';
export 'src/detection/contracts/i_object_detector.dart';
export 'src/detection/models/plane_anchor.dart';

// NETWORK & CACHE EXPORTS
export 'src/network/contracts/i_network_client.dart';
export 'src/network/contracts/i_synchronization_manager.dart';
export 'src/network/contracts/i_offline_handler.dart';
export 'src/network/api_gateway.dart';
export 'src/cache/contracts/i_asset_cache.dart';
export 'src/cache/contracts/i_disk_cache.dart';
export 'src/cache/models/cache_policy.dart';
export 'src/cache/memory_asset_cache.dart';
export 'src/content/asset_manager.dart';
export 'src/state/engine_store.dart';

// SERVICES EXPORTS
export 'src/services/contracts/i_api_gateway.dart';
export 'src/services/contracts/i_navigation_service.dart';
export 'src/services/contracts/i_booking_service.dart';
export 'src/services/contracts/i_communication_service.dart';
export 'src/services/contracts/i_live_data_service.dart';

// AI EXPORTS
export 'src/ai/contracts/i_ai_provider.dart';
export 'src/ai/models/context_models.dart';

// SECURITY & ANALYTICS EXPORTS
export 'src/security/contracts/i_auth_manager.dart';
export 'src/analytics/contracts/i_analytics_tracker.dart';

// PERFORMANCE & DEBUG EXPORTS
export 'src/performance/contracts/i_performance_monitor.dart';
export 'src/debug/contracts/i_debug_overlay.dart';

// RENDERER EXPORTS
export 'src/renderer/contracts/i_render_pipeline.dart';
export 'src/renderer/contracts/i_material_manager.dart';
export 'src/renderer/contracts/i_lighting_system.dart';
export 'src/renderer/contracts/i_depth_manager.dart';
export 'src/renderer/contracts/i_occlusion_manager.dart';

// PLATFORM EXPORTS
export 'src/platform/ar_session_manager_adapter.dart';
export 'src/platform/ar_anchor_manager_adapter.dart';
export 'src/platform/ar_plane_detector_adapter.dart';
export 'src/platform/ar_engine_view.dart';
export 'src/core/bootstrap_pipeline.dart';

// The Bootstrapper (The only concrete class we export for the host app)
export 'src/core/engine_core.dart' show EngineCore;
