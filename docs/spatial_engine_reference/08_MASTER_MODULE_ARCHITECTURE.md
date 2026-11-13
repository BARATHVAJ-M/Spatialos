# 08 — SpatialOS XR Engine: Master Module Architecture
> **Principle**: One concern = one module. Touch one folder, change one thing. Nothing bleeds across.
> **Rule**: A file belongs in the module whose layer *owns* that concern. If layer N needs something that touches layer Z's domain, N creates its own module for that boundary — it does not reach into Z.

---

## THE GOLDEN RULE OF THIS ARCHITECTURE

```
IF you need to change how hand tracking works  → touch only  vision/hands/
IF you need to change how planes render        → touch only  renderer/reticle/ or tracking/planes/
IF you need to change how gestures work        → touch only  interaction/gestures/
IF you need to change the Flutter bridge       → touch only  bridge/flutter/
IF you need to add a new 3D model format       → touch only  renderer/assets/
IF you add a new error type                    → touch only  core/error/
```

**Zero files are shared between modules. Zero global singletons outside core/. Zero static state.**

---

## LAYER MAP (12 Layers, Bottom → Top)

```
┌─────────────────────────────────────────────────────────────────┐
│  L12  diagnostics/   metrics · overlay · logging                │
├─────────────────────────────────────────────────────────────────┤
│  L11  bridge/        flutter · engine · openxr(future)          │
├─────────────────────────────────────────────────────────────────┤
│  L10  network/       sync · protocol                            │
├─────────────────────────────────────────────────────────────────┤
│  L09  audio/         spatial · player                           │
├─────────────────────────────────────────────────────────────────┤
│  L08  interaction/   raycast · gestures · events · bounds       │
├─────────────────────────────────────────────────────────────────┤
│  L07  scenegraph/    tree · model · animation · state           │
├─────────────────────────────────────────────────────────────────┤
│  L06  vision/        hands · landmarks · depth_ml · segment     │
├─────────────────────────────────────────────────────────────────┤
│  L05  renderer/      core · camera · assets · materials         │
│                      lighting · reticle                         │
├─────────────────────────────────────────────────────────────────┤
│  L04  tracking/      slam · planes · anchors · relocalize       │
├─────────────────────────────────────────────────────────────────┤
│  L03  sensing/       camera · depth · imu(future)               │
├─────────────────────────────────────────────────────────────────┤
│  L02  platform/      session · permissions · capability         │
├─────────────────────────────────────────────────────────────────┤
│  L01  core/          contracts · math · types · error           │
└─────────────────────────────────────────────────────────────────┘
         ↑ Lower layers have ZERO knowledge of upper layers
```

---

## DEPENDENCY RULE TABLE

| Layer | May import from | Must NEVER import from |
|-------|-----------------|------------------------|
| `core` | nothing | everything |
| `platform` | `core` | `sensing`, `tracking`, `renderer`, `vision`, `bridge` |
| `sensing` | `core`, `platform` | `tracking`, `renderer`, `vision`, `bridge` |
| `tracking` | `core`, `platform`, `sensing` | `renderer`, `vision`, `interaction`, `bridge` |
| `renderer` | `core`, `platform`, `sensing` | `tracking`, `vision`, `interaction`, `bridge` |
| `vision` | `core`, `sensing` | `tracking`, `renderer`, `interaction`, `bridge` |
| `scenegraph` | `core`, `renderer` | `tracking`, `vision`, `bridge` |
| `interaction` | `core`, `tracking`, `vision` | `renderer`, `bridge` |
| `audio` | `core` | `tracking`, `renderer`, `vision`, `bridge` |
| `network` | `core` | `tracking`, `renderer`, `vision`, `bridge` |
| `bridge` | ALL layers | — |
| `diagnostics` | `core` + read-only view of all | Writes to none |

---

## COMPLETE FOLDER + FILE MAP

```
engine/
├── build.gradle.kts
├── src/
│   └── main/
│       ├── AndroidManifest.xml
│       ├── assets/
│       │   ├── mediapipe/
│       │   │   └── hand_landmarker.task          ← Download: 8 MB MediaPipe model
│       │   ├── materials/
│       │   │   ├── pbr_opaque.filamat             ← Compiled by matc from pbr_opaque.mat
│       │   │   ├── pbr_transparent.filamat
│       │   │   ├── unlit.filamat
│       │   │   └── reticle.filamat
│       │   └── environments/
│       │       └── default_ibl.ktx               ← IBL environment map (Filament KTX format)
│       └── kotlin/com/spatialos/engine/
│           │
│           ├── ══════════════════════════════════════════════
│           │   L01 — CORE (zero external dependencies)
│           ├── ══════════════════════════════════════════════
│           │
│           ├── core/
│           │   │
│           │   ├── contracts/            ← Pure interfaces. The only thing upper layers see of lower layers.
│           │   │   ├── ITrackingModule.kt     — getTrackingState(): TrackingState
│           │   │   ├── IRendererModule.kt     — render(frame), loadModel(), removeModel()
│           │   │   ├── IVisionModule.kt       — startHandTracking(), stopHandTracking()
│           │   │   ├── IInteractionModule.kt  — hitTest(), getGestureState()
│           │   │   ├── ISceneModule.kt        — placeModel(), removeModel(), selectPart()
│           │   │   ├── IAudioModule.kt        — playAt(sound, position), stop()
│           │   │   └── ISensingModule.kt      — getCameraFrame(), getDepthFrame()
│           │   │
│           │   ├── math/                ← All math lives here. Used by every layer.
│           │   │   ├── Matrix4f.kt            — 4×4 column-major: multiply, inverse, transpose
│           │   │   ├── Vector3f.kt            — 3D: add, sub, dot, cross, normalize, lerp
│           │   │   ├── Vector2f.kt            — 2D: screen coordinates, UV
│           │   │   ├── Quaternionf.kt         — rotation: slerp, toMatrix, fromEuler
│           │   │   ├── Ray3D.kt               — origin + direction, at(t) point
│           │   │   ├── Pose.kt                — translation (Vector3f) + rotation (Quaternionf)
│           │   │   ├── BoundingBox.kt         — AABB + OBB, contains(), intersects()
│           │   │   └── MathUtils.kt           — degrees↔radians, clamp, lerp scalar
│           │   │
│           │   ├── types/               ← Shared enums and value types. No logic.
│           │   │   ├── EngineState.kt         — UNINITIALIZED · INITIALIZING · RUNNING · PAUSED · STOPPED
│           │   │   ├── TrackingQuality.kt     — NONE · LIMITED · NORMAL
│           │   │   ├── PlaneType.kt           — HORIZONTAL_UP · HORIZONTAL_DOWN · VERTICAL
│           │   │   └── ModelFormat.kt         — GLB · GLTF
│           │   │
│           │   └── error/               ← All failure types in ONE place. Single source of truth.
│           │       ├── EngineError.kt         — sealed class (see Part 7 of doc 07)
│           │       ├── EngineResult.kt        — typealias Result<T> = kotlin.Result<T> + EngineError ext fns
│           │       └── EngineCallbacks.kt     — single interface: happy path + onEngineError(EngineError)
│           │
│           ├── ══════════════════════════════════════════════
│           │   L02 — PLATFORM (Android lifecycle, ARCore install, permissions)
│           ├── ══════════════════════════════════════════════
│           │
│           ├── platform/
│           │   │
│           │   ├── session/             ← ARCore Session lifecycle. Everything session-related here.
│           │   │   ├── ArSessionManager.kt    — Session.create/resume/update/pause/close
│           │   │   ├── ArInstallFlow.kt       — ArCoreApk.requestInstall state machine
│           │   │   └── SessionConfig.kt       — ARCore config: plane mode, depth mode, light estimation
│           │   │
│           │   ├── permissions/         ← Camera permission. Encapsulated, not scattered in Activity.
│           │   │   ├── PermissionManager.kt   — ActivityResultLauncher wrapper, request + result
│           │   │   └── PermissionState.kt     — data class: granted, denied, shouldShowRationale
│           │   │
│           │   └── capability/          ← Device check. One module = one job.
│           │       ├── DeviceCapabilityChecker.kt — ARCore availability, Vulkan, depth API, hand tracking
│           │       └── FallbackMode.kt            — FULL_AR · LIMITED_AR (no depth) · NO_AR (rotation only)
│           │
│           ├── ══════════════════════════════════════════════
│           │   L03 — SENSING (raw hardware data: camera pixels, depth, IMU)
│           ├── ══════════════════════════════════════════════
│           │
│           ├── sensing/
│           │   │
│           │   ├── camera/              ← CPU frame ownership. Only module that calls acquireCameraImage().
│           │   │   ├── CameraFrameProvider.kt — acquireCameraImage() + zero-copy buffer pool
│           │   │   ├── CameraIntrinsics.kt    — focal length fx/fy, principal point cx/cy, image WxH
│           │   │   └── FrameMetadata.kt       — timestamp ns, display rotation, exposure time
│           │   │
│           │   ├── depth/               ← ARCore Depth API. Separate from camera — different frame type.
│           │   │   ├── DepthFrameProvider.kt  — acquireDepthImage(), raw depth + confidence images
│           │   │   ├── DepthFrame.kt          — data class: depthImageBuffer, confidenceBuffer, timestamp
│           │   │   └── DepthConfig.kt         — mode enum: RAW · SMOOTHED; max depth meters
│           │   │
│           │   └── imu/                 ← Phase B: raw IMU for custom SLAM on glasses hardware
│           │       ├── ImuDataProvider.kt     — accel + gyro at 200 Hz
│           │       └── ImuReading.kt          — data class: accel Vector3f, gyro Vector3f, timestamp ns
│           │
│           ├── ══════════════════════════════════════════════
│           │   L04 — TRACKING (SLAM, planes, anchors, map reuse)
│           ├── ══════════════════════════════════════════════
│           │
│           ├── tracking/
│           │   │
│           │   ├── slam/                ← 6-DoF pose. The core spatial engine output.
│           │   │   ├── ArTrackingEngine.kt    — implements ITrackingModule; wraps ARCore Frame.update()
│           │   │   ├── TrackingState.kt       — data class: cameraPose, quality, frameTimestamp, lightEstimate
│           │   │   └── CameraProjection.kt    — View matrix + Projection matrix from ARCore camera
│           │   │
│           │   ├── planes/              ← Plane detection logic + its own visual mesh (owns both together).
│           │   │   ├── PlaneDetector.kt       — filters Frame.getUpdatedTrackables() → DetectedPlane list
│           │   │   ├── DetectedPlane.kt       — data class: id, PlaneType, centerPose, polygon Vector3f[]
│           │   │   └── PlaneVisualizer.kt     — creates Filament mesh outline for the plane (owned here, not renderer)
│           │   │
│           │   ├── anchors/             ← World anchor lifecycle. Everything anchor-related stays here.
│           │   │   ├── AnchorManager.kt       — createAnchor(hitResult), detachAnchor(id), getAnchorPose(id)
│           │   │   ├── SpatialAnchor.kt       — data class: id UUID, worldPose Pose, arcoreAnchor ref, state
│           │   │   └── AnchorState.kt         — TRACKING · PAUSED · STOPPED
│           │   │
│           │   └── relocalization/      ← Phase B: load saved map, relocalize on startup.
│           │       ├── MapPersistenceManager.kt — save/load ARCore CloudAnchor or ORB-SLAM3 map file
│           │       └── RelocalizationState.kt  — SEARCHING · LOCALIZING · LOCALIZED · FAILED
│           │
│           ├── ══════════════════════════════════════════════
│           │   L05 — RENDERER (Filament PBR, model loading, materials, lighting)
│           ├── ══════════════════════════════════════════════
│           │
│           ├── renderer/
│           │   │
│           │   ├── core/                ← Filament engine init. The only place Engine/Renderer/SwapChain exist.
│           │   │   ├── FilamentContext.kt     — Engine, Renderer, SwapChain, View — single instance manager
│           │   │   ├── RenderLoop.kt          — Choreographer-driven 60 Hz tick, calls Renderer.render()
│           │   │   └── SurfaceManager.kt      — SurfaceView lifecycle, SwapChain resize on rotation
│           │   │
│           │   ├── camera/              ← Renderer's view of the camera. Syncs ARCore → Filament matrices.
│           │   │   ├── FilamentCameraSync.kt  — sets Filament Camera View+Projection from ARCore matrices
│           │   │   └── CameraStreamBinder.kt  — binds ARCore OES texture → Filament CameraStream (NO BackgroundRenderer)
│           │   │
│           │   ├── assets/              ← 3D model loading. All gltfio code lives here.
│           │   │   ├── ModelLoader.kt         — gltfio AssetLoader + ResourceLoader, loads GLB/glTF
│           │   │   ├── ModelCache.kt          — LRU cache: URI → loaded Filament FilamentAsset
│           │   │   └── AssetRegistry.kt       — tracks all active Filament entities in scene, by model ID
│           │   │
│           │   ├── materials/           ← .filamat blobs + per-part highlighting. All material logic here.
│           │   │   ├── MaterialLibrary.kt     — loads .filamat from assets, caches MaterialInstance per model
│           │   │   ├── PartHighlighter.kt     — sets emissive color on a MaterialInstance for selection glow
│           │   │   └── MaterialVariant.kt     — PBR_OPAQUE · PBR_TRANSPARENT · UNLIT · RETICLE
│           │   │
│           │   ├── lighting/            ← IBL, sun, shadows. All lighting encapsulated here.
│           │   │   ├── LightingSystem.kt      — creates IBL indirect light + directional sun entity
│           │   │   ├── ShadowSystem.kt        — contact shadows of model on detected plane
│           │   │   └── EnvironmentLoader.kt   — loads KTX environment map from assets/environments/
│           │   │
│           │   └── reticle/             ← The placement indicator mesh. Fully self-contained.
│           │       ├── ReticleRenderer.kt     — Filament disk mesh, positioned at hit-test Pose
│           │       ├── ReticleAnimator.kt     — fades in on good tracking, fades out on NONE quality
│           │       └── ReticleConfig.kt       — radius meters, color ARGB, opacity float
│           │
│           ├── ══════════════════════════════════════════════
│           │   L06 — VISION (ML inference on camera frames)
│           ├── ══════════════════════════════════════════════
│           │
│           ├── vision/
│           │   │
│           │   ├── hands/               ← MediaPipe hand tracking. Everything pipeline-related here.
│           │   │   ├── HandTrackingPipeline.kt — HandlerThread + HandLandmarker + bounded queue (cap=2, drop oldest)
│           │   │   ├── HandLandmarkResult.kt   — data class: landmarks List<Landmark3D>, handedness, confidence
│           │   │   └── HandTrackingConfig.kt   — numHands (1|2), minDetectionConf, minTrackingConf, modelPath
│           │   │
│           │   ├── landmarks/           ← Landmark math + filtering. Separate from pipeline — different job.
│           │   │   ├── LandmarkConverter.kt    — normalised [0,1] → screen px → world-space Ray3D
│           │   │   ├── LandmarkFilter.kt       — 1€ filter to smooth jittery raw landmark coordinates
│           │   │   └── HandLandmark.kt         — enum: WRIST · THUMB_TIP · INDEX_MCP · INDEX_TIP … (21 total)
│           │   │
│           │   ├── depth_ml/            ← Phase B: monocular ML depth (Depth Anything V2 via ONNX).
│           │   │   ├── MonocularDepthEstimator.kt — ONNX Runtime inference, input MPImage, output FloatArray
│           │   │   └── DepthEstimationResult.kt   — data class: depthMap FloatArray, width, height, maxDepthM
│           │   │
│           │   └── segmentation/        ← Phase B: background/foreground segmentation.
│           │       ├── SelfieSegmentor.kt      — ML Kit ImageSegmenter wrapper
│           │       └── SegmentationMask.kt     — data class: maskBytes ByteArray, width, height
│           │
│           ├── ══════════════════════════════════════════════
│           │   L07 — SCENEGRAPH (3D scene structure, model instances, animations)
│           ├── ══════════════════════════════════════════════
│           │
│           ├── scenegraph/
│           │   │
│           │   ├── tree/                ← glTF node hierarchy. Pure structural logic, no animation.
│           │   │   ├── SceneNodeTree.kt       — glTF parent-child node tree, getNode(name), reparent()
│           │   │   ├── SceneNode.kt           — data class: name, localTransform Matrix4f, children, filamentEntity
│           │   │   └── TransformStack.kt      — M = T × R × S matrix accumulation from root to leaf
│           │   │
│           │   ├── model/               ← Placed model instances. Owns anchor-to-node binding.
│           │   │   ├── ModelInstance.kt       — placed model: anchorId + rootNode + worldBounds ModelBounds
│           │   │   ├── ModelBounds.kt         — AABB/OBB in world space, recalculates on transform change
│           │   │   └── ModelRegistry.kt       — Map<UUID, ModelInstance>, add/remove/find
│           │   │
│           │   ├── animation/           ← All animation logic. Reads tree, writes transforms, nothing else.
│           │   │   ├── PartAnimator.kt        — timed explode/collapse: moves each node to target offset
│           │   │   ├── AnimationCurve.kt      — easing: linear(), easeInOut(), spring(stiffness, damping)
│           │   │   └── AnimationState.kt      — IDLE · EXPLODING · EXPLODED · COLLAPSING · PLAYING
│           │   │
│           │   └── state/               ← Scene snapshot. What is in the scene right now.
│           │       ├── SceneState.kt          — data class: models[], selectedPartName?, cameraPose
│           │       └── SceneEvent.kt          — sealed: ModelAdded · ModelRemoved · PartSelected · AnimationDone
│           │
│           ├── ══════════════════════════════════════════════
│           │   L08 — INTERACTION (raycasting, gestures, events, bounds)
│           ├── ══════════════════════════════════════════════
│           │
│           ├── interaction/
│           │   │
│           │   ├── raycast/             ← 2D → 3D unprojection + intersection. No gesture logic here.
│           │   │   ├── RaycastEngine.kt       — unprojects screen point → world Ray3D, Ray-OBB test
│           │   │   ├── RaycastResult.kt       — data class: hit bool, modelId?, partName?, hitPoint, distance
│           │   │   └── ScreenUnprojector.kt   — viewport + projection + view matrices → Ray3D (owns the math)
│           │   │
│           │   ├── gestures/            ← Gesture state machine. Reads landmarks, outputs InteractionEvent.
│           │   │   ├── GestureStateMachine.kt — FSM: IDLE→PINCHING→HOLDING→TWO_HAND; fires InteractionEvent
│           │   │   ├── GestureDetector.kt     — classifies raw HandLandmarkResult → gesture type enum
│           │   │   └── GestureConfig.kt       — pinchThresholdPx, holdDurationMs, scaleSensitivity
│           │   │
│           │   ├── events/              ← All interaction event types. Single location, nothing else.
│           │   │   ├── InteractionEvent.kt    — sealed: Tap · Pinch · TwoHandScale · Rotate · HoldStart · HoldEnd
│           │   │   └── InteractionDispatcher.kt — routes event to SceneGraph AND EngineCallbacks
│           │   │
│           │   └── bounds/              ← World-space bounds tracking and collision testing.
│           │       ├── BoundingBoxTracker.kt  — updates OBB for all placed models each frame
│           │       └── CollisionTester.kt     — Ray-OBB, Ray-AABB, sphere-AABB intersection
│           │
│           ├── ══════════════════════════════════════════════
│           │   L09 — AUDIO (spatial sound positioned in 3D world)
│           ├── ══════════════════════════════════════════════
│           │
│           ├── audio/
│           │   │
│           │   ├── spatial/             ← Resonance Audio. All HRTF + room modelling here.
│           │   │   ├── SpatialAudioEngine.kt  — Resonance Audio init, room model, master volume
│           │   │   ├── SpatialAudioSource.kt  — audio source anchored at a 3D world position
│           │   │   └── AudioListener.kt       — head pose for HRTF (follows camera Pose each frame)
│           │   │
│           │   └── player/              ← Asset loading and playback. Separate from spatial positioning.
│           │       ├── AudioPlayer.kt         — play/pause/stop AudioSource by ID
│           │       ├── AudioAssetLoader.kt    — loads WAV/OGG from assets/, returns buffer
│           │       └── AudioState.kt          — IDLE · PLAYING · PAUSED · STOPPED
│           │
│           ├── ══════════════════════════════════════════════
│           │   L10 — NETWORK (multi-user pose sync, future)
│           ├── ══════════════════════════════════════════════
│           │
│           ├── network/
│           │   │
│           │   ├── sync/                ← WebSocket pose sync. Fully isolated from engine logic.
│           │   │   ├── PoseSyncClient.kt      — OkHttp WebSocket, connect/disconnect, send pose
│           │   │   ├── PoseSyncMessage.kt     — data class: userId String, pose Pose, timestampMs Long
│           │   │   └── SyncState.kt           — DISCONNECTED · CONNECTING · CONNECTED · SYNCING · ERROR
│           │   │
│           │   └── protocol/            ← Serialization. Knows nothing about networking.
│           │       ├── MessageSerializer.kt   — Pose ↔ ByteArray (manual or Protobuf)
│           │       └── SpatialProtocol.kt     — message type IDs, version, header format
│           │
│           ├── ══════════════════════════════════════════════
│           │   L11 — BRIDGE (Flutter boundary + future OpenXR)
│           ├── ══════════════════════════════════════════════
│           │
│           ├── bridge/
│           │   │
│           │   ├── flutter/             ← Flutter-specific code. ONLY module that imports Flutter SDK.
│           │   │   ├── SpatialXrPlugin.kt         — FlutterPlugin: registers MethodChannel + PlatformViewFactory
│           │   │   ├── SpatialXrPlatformView.kt   — PlatformView: owns SurfaceView, forwards lifecycle
│           │   │   ├── MethodChannelHandler.kt    — maps every Dart method call → SpatialXrEngine call
│           │   │   └── EventChannelEmitter.kt     — streams EngineCallbacks events → Dart EventChannel
│           │   │
│           │   ├── engine/              ← Pure Kotlin facade. Zero Flutter imports. Assembles all modules.
│           │   │   ├── SpatialXrEngine.kt         — wires: session+sensing+tracking+renderer+vision+scene+interaction
│           │   │   ├── EngineConfig.kt            — data class: resolution, trackingMode, handTracking on/off, debug on/off
│           │   │   └── EngineLifecycle.kt         — interface: onSurfaceCreated, onResume, onPause, onDestroy
│           │   │
│           │   └── openxr/              ← Phase B: OpenXR 1.1 path for DIY glasses (Monado runtime)
│           │       ├── OpenXrSession.kt           — xrCreateSession, xrBeginSession, xrEndSession
│           │       ├── OpenXrSwapchain.kt         — stereo swapchain, left+right eye render targets
│           │       └── OpenXrInputMapper.kt       — xrSyncActions → InteractionEvent (same type as L08)
│           │
│           └── ══════════════════════════════════════════════
│               L12 — DIAGNOSTICS (observability, debug HUD, structured logs)
│           ═══════════════════════════════════════════════════
│
│           └── diagnostics/
│               │
│               ├── metrics/             ← Performance data collection. Read-only view of engine.
│               │   ├── EngineMetricsCollector.kt  — collects FPS, frameTimeMs, trackingQuality, handConfidence
│               │   ├── PerformanceSampler.kt      — rolling average over last 60 frames
│               │   └── MetricsSnapshot.kt         — data class: fps Float, frameTimeMs Float, trackingQuality, handConf
│               │
│               ├── overlay/             ← Debug HUD. Stripped in release builds via BuildConfig.DEBUG.
│               │   ├── OverlayDiagnosticsRenderer.kt — Canvas text overlay drawn above Filament SurfaceView
│               │   └── DiagnosticsConfig.kt          — which fields to show, text color, position corner
│               │
│               └── logging/             ← Structured logger. All engine log calls go through here.
│                   ├── EngineLogger.kt            — tag by subsystem, filter by LogLevel, forward to Logcat
│                   └── LogLevel.kt               — VERBOSE · DEBUG · INFO · WARN · ERROR
```

---

## MODULE COUNT SUMMARY

| Layer | Modules | File Count |
|-------|---------|-----------|
| L01 core | contracts, math, types, error | 20 |
| L02 platform | session, permissions, capability | 7 |
| L03 sensing | camera, depth, imu | 7 |
| L04 tracking | slam, planes, anchors, relocalization | 11 |
| L05 renderer | core, camera, assets, materials, lighting, reticle | 17 |
| L06 vision | hands, landmarks, depth_ml, segmentation | 10 |
| L07 scenegraph | tree, model, animation, state | 11 |
| L08 interaction | raycast, gestures, events, bounds | 11 |
| L09 audio | spatial, player | 6 |
| L10 network | sync, protocol | 5 |
| L11 bridge | flutter, engine, openxr | 9 |
| L12 diagnostics | metrics, overlay, logging | 7 |
| **TOTAL** | **37 modules** | **121 files** |

---

## WHAT CHANGED FROM PREVIOUS STRUCTURE (and why)

| Old (flat) | New (encapsulated) | Reason |
|-----------|-------------------|--------|
| `camera/` at root level | `sensing/camera/` | camera is a sensor — it belongs in sensing layer |
| `session/` at root level | `platform/session/` | session is a platform concern, not a tracking concern |
| flat `tracking/` | `tracking/slam/` + `tracking/planes/` + `tracking/anchors/` | each has different data and different change rate |
| flat `renderer/` | `renderer/core/` + `renderer/camera/` + `renderer/assets/` + `renderer/materials/` + `renderer/lighting/` + `renderer/reticle/` | changing materials should not touch render loop |
| flat `vision/` | `vision/hands/` + `vision/landmarks/` + `vision/depth_ml/` | pipeline ≠ math ≠ fallback model |
| flat `interaction/` | `interaction/raycast/` + `interaction/gestures/` + `interaction/events/` + `interaction/bounds/` | 4 completely different concerns |
| flat `bridge/` | `bridge/flutter/` + `bridge/engine/` + `bridge/openxr/` | Flutter code isolated, engine code isolated |
| `core/contracts/` only | + `core/types/` + `core/math/` + `core/error/` | complete zero-dependency foundation |
| nothing | `audio/` layer | Resonance Audio spatial sound |
| nothing | `network/` layer | future multi-user sync |

---

## ONE-FRAME DATA FLOW (Phase 1 — tracking + rendering only)

```
Choreographer (16 ms tick)
       │
       ▼
platform/session/ArSessionManager
  session.update() → returns ARCore Frame
       │
       ├──► sensing/camera/CameraFrameProvider
       │      acquireCameraImage() → CameraFrame (CPU pixels for MediaPipe)
       │
       ├──► tracking/slam/ArTrackingEngine
       │      frame.camera.pose → TrackingState (cameraPose, quality)
       │      frame.camera.getProjectionMatrix() → CameraProjection
       │      │
       │      ├──► tracking/planes/PlaneDetector
       │      │      frame.getUpdatedTrackables() → List<DetectedPlane>
       │      │
       │      └──► tracking/anchors/AnchorManager
       │             updates existing anchor poses
       │
       ├──► renderer/camera/FilamentCameraSync
       │      takes CameraProjection → sets Filament Camera matrices
       │
       ├──► renderer/camera/CameraStreamBinder
       │      binds ARCore OES texture → Filament CameraStream (camera feed on screen)
       │
       ├──► renderer/reticle/ReticleRenderer
       │      takes hit-test Pose → positions Filament disk mesh
       │
       └──► renderer/core/RenderLoop
              renderer.render(swapChain, view) → GPU draws frame
```

---

## BUILD ORDER (Phase by Phase)

```
Phase 1A ── core + platform + sensing + tracking/slam
            Goal: ARCore session up, camera pose tracked, prints to log

Phase 1B ── + tracking/planes + tracking/anchors
            Goal: floors detected, anchors created on tap

Phase 1C ── + renderer/core + renderer/camera
            Goal: Filament renders camera feed, stays in sync with ARCore

Phase 1D ── + renderer/assets + renderer/materials + renderer/lighting + scenegraph/tree + scenegraph/model
            Goal: GLB model loads, sits at anchor, stays fixed in world

Phase 1E ── + renderer/reticle + bridge/engine + bridge/flutter
            Goal: Flutter app can place/remove model via MethodChannel

Phase 2A ── + vision/hands + vision/landmarks
            Goal: hand landmarks detected asynchronously on background thread

Phase 2B ── + interaction/raycast + interaction/gestures + interaction/events + interaction/bounds
            Goal: pinch rotates model, two-hand scales model

Phase 2C ── + scenegraph/animation
            Goal: tap part → exploded view animation plays

Phase 3A ── + audio/spatial + audio/player
            Goal: sound plays from model's world position

Phase 3B ── + network/sync + network/protocol
            Goal: two devices share the same scene in real time
```

> Every phase compiles and runs independently. Phase 2 files are absent from Phase 1 build.
