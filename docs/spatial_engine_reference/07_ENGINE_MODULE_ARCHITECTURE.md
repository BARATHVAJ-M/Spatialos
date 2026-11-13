# 07 — Spatial XR Engine: Corrected Module Architecture

> **Status**: Production-Ready Definitive Version  
> **Last Updated**: Phase 1 — ARCore + Filament + MediaPipe  
> **Root Package**: `com.spatialos.engine`  
> **Root Directory**: `engine/src/main/kotlin/com/spatialos/engine/`

---

## PART 1 — CRITICAL REVIEW: Every Flaw in the Previous Plan

### FLAW 1 — `ReticleRenderer.kt` placed inside `tracking/`
**What was wrong**: The reticle (the circle that shows where a model will land) is a Filament renderable — a mesh drawn by the GPU. Tracking only knows a 3D hit-test `Pose`. It should never know about rendering.  
**Fix**: Move to `renderer/reticle/ReticleRenderer.kt`. It reads a `HitResult` from tracking and draws a Filament mesh. Zero coupling to ARCore internals.

---

### FLAW 2 — `BackgroundRenderer.kt` as a standalone class
**What was wrong**: The ARCore camera feed is an OpenGL ES OES texture. Filament's `CameraStream` API wraps it natively. Having a separate `BackgroundRenderer` duplicates what Filament already does and creates a second OpenGL context risk — instant crash on many devices.  
**Fix**: Delete `BackgroundRenderer.kt`. Camera texture is owned by `FilamentSceneRenderer.kt` via `engine.createTextureBuilder()` → `CameraStream`. The `camera/` module only owns CPU frame extraction (`Image` buffer for MediaPipe). GPU display is Filament's job.

---

### FLAW 3 — No `session/` module. Session lifecycle buried in `core/`
**What was wrong**: ARCore `Session` has a strict Android lifecycle: `create → resume → update → pause → close`. Permissions, install flow (`ArCoreApk.requestInstall`), and device compatibility live here. Burying a `DeviceCapabilityChecker` in `core/capability/` and leaving session management nowhere means it ends up in the Activity — catastrophic coupling.  
**Fix**: New top-level module `session/` with:
- `ArSessionManager.kt` — owns Session lifecycle, permissions, resume/pause
- `ArInstallFlow.kt` — handles `INSTALL_REQUESTED` state machine
- `DeviceCapabilityChecker.kt` — moved from `core/capability/`

---

### FLAW 4 — `MaterialManager.kt` is too broad
**What was wrong**: In Filament, materials are precompiled `.filamat` binary blobs. You cannot create a material at runtime the way you instantiate a Java object. A "MaterialManager" implies dynamic material creation — that is not how Filament works.  
**Fix**: Split into:
- `MaterialLibrary.kt` — loads and caches compiled `.filamat` assets, creates `MaterialInstance` per model
- `PartHighlighter.kt` — changes emissive color on a specific `MaterialInstance` for selection glow

---

### FLAW 5 — `FlutterEngineBridge.kt` and `SpatialXrView.kt` overlap / wrong responsibilities
**What was wrong**: Flutter PlatformView registration happens in a `FlutterPlugin`. The Android `View` is a separate concern. The engine facade (Kotlin-only logic) must not import anything from Flutter SDK. These three things were tangled into two files incorrectly.  
**Fix**: Clean 3-file split in `bridge/`:
- `SpatialXrPlugin.kt` — implements `FlutterPlugin`, registers MethodChannel + PlatformViewFactory
- `SpatialXrPlatformView.kt` — implements `PlatformView`, owns the Android `SurfaceView`
- `SpatialXrEngine.kt` — pure Kotlin facade, **zero Flutter imports**, called by the PlatformView

---

### FLAW 6 — No `diagnostics/` module
**What was wrong**: When the engine breaks on a real device (Realme Narzo 50 or any other), you have zero visibility into what failed — is it ARCore tracking loss? MediaPipe queue overflow? Filament sync issue? Without a diagnostics module, debugging in the field is impossible.  
**Fix**: New module `diagnostics/` with:
- `EngineMetricsCollector.kt` — collects FPS, frame time, tracking state, hand confidence
- `OverlayDiagnosticsRenderer.kt` — renders a debug HUD (text overlay) in debug builds
- `EngineLogger.kt` — structured tagged logging, filters by subsystem

---

### FLAW 7 — `AsyncInferenceLoop.kt` name is too vague + threading contract unclear
**What was wrong**: "Async loop" tells you nothing about ownership. MediaPipe requires a `HandLandmarker` created on a background `HandlerThread`. The input is `MPImage`, output via callback. The queue between camera frames and inference must be bounded (drop frames if inference is slow) or you get unbounded memory growth.  
**Fix**: Replace with `HandTrackingPipeline.kt` which owns:
- `HandlerThread` lifecycle
- `HandLandmarker` initialization with `.taskRunningModeValue(LIVE_STREAM)`
- Bounded input queue (capacity = 2, drop oldest on overflow)
- Output callback → `EngineCallbacks`

---

### FLAW 8 — No `assets/` directory in module structure
**What was wrong**: MediaPipe requires `hand_landmarker.task` (the ML model, ~8 MB) shipped inside the APK. Filament requires compiled `.filamat` material files. Without declaring these in the build structure, the build will silently fail when these assets are missing.  
**Fix**: Add to the folder structure:
```
engine/src/main/assets/
├── mediapipe/
│   └── hand_landmarker.task
└── materials/
    ├── pbr_opaque.filamat
    ├── pbr_transparent.filamat
    └── reticle.filamat
```

---

### FLAW 9 — `SceneNodeTree.kt` and `SubPartController.kt` overlap
**What was wrong**: Both were manipulating node transforms without a clear owner. The scene graph owns the tree structure. Part control (explode/collapse, highlight, isolate) is a behavior layer on top of the tree.  
**Fix**:
- `SceneNodeTree.kt` — owns the glTF node hierarchy, parent-child relationships, transform math only
- `PartAnimator.kt` — executes timed explode/collapse animations ON the node tree (reads tree, writes transforms via interpolation)
- `SubPartController.kt` — deleted, responsibilities split between the two above

---

### FLAW 10 — No error/event propagation system for failure states
**What was wrong**: `EngineCallbacks.kt` only had happy-path events (`onModelPlaced`, `onGestureDetected`). There was no channel for: tracking loss, session crash, MediaPipe init failure, Filament OOM, permission denied. The host app had no way to know the engine had failed.  
**Fix**: Add `EngineError` sealed class and `onEngineError(error: EngineError)` to `EngineCallbacks`. Every module reports failures through this single channel.

---

## PART 2 — CORRECTED ARCHITECTURE: 4-Layer Module Map

```
LAYER 4  ──────────────────────────────────────────────────────
  bridge/            Flutter ↔ Engine boundary
  diagnostics/       Metrics, logging, debug HUD

LAYER 3  ──────────────────────────────────────────────────────
  interaction/       Raycasting, gesture state machine
  scenegraph/        glTF scene tree, part animation

LAYER 2  ──────────────────────────────────────────────────────
  tracking/          ARCore SLAM, planes, anchors
  camera/            CPU frame extraction (for MediaPipe)
  renderer/          Filament PBR + reticle + asset loading
  vision/            MediaPipe hand tracking pipeline

LAYER 1  ──────────────────────────────────────────────────────
  session/           ARCore Session & Android lifecycle
  core/              Contracts (interfaces), math, error types
```

**Rule**: A module in a lower layer NEVER imports from a higher layer.  
**Rule**: `core/` has ZERO external dependencies — no ARCore, no Filament, no Flutter.

---

## PART 3 — DEFINITIVE FILE STRUCTURE

```
engine/
├── build.gradle.kts
├── src/
│   └── main/
│       ├── AndroidManifest.xml
│       ├── assets/
│       │   ├── mediapipe/
│       │   │   └── hand_landmarker.task          ← MediaPipe ML model (~8 MB)
│       │   └── materials/
│       │       ├── pbr_opaque.filamat             ← Compiled Filament material
│       │       ├── pbr_transparent.filamat
│       │       └── reticle.filamat
│       └── kotlin/com/spatialos/engine/
│           │
│           ├── core/                              ═══ LAYER 1: Pure Kotlin, zero deps
│           │   ├── contracts/
│           │   │   ├── ITrackingModule.kt         ← ARCore tracking interface
│           │   │   ├── IRendererModule.kt         ← Filament renderer interface
│           │   │   ├── IVisionModule.kt           ← MediaPipe vision interface
│           │   │   ├── IInteractionModule.kt      ← Gesture/raycast interface
│           │   │   └── ISceneModule.kt            ← Scene graph interface
│           │   ├── math/
│           │   │   ├── Matrix4f.kt                ← 4×4 column-major matrix ops
│           │   │   ├── Vector3f.kt                ← 3D vector math
│           │   │   ├── Quaternionf.kt             ← Rotation math (SLERP)
│           │   │   ├── Ray3D.kt                   ← Ray (origin + direction)
│           │   │   └── Pose.kt                    ← Translation + Rotation wrapper
│           │   └── error/
│           │       ├── EngineError.kt             ← Sealed class: all failure types
│           │       └── EngineCallbacks.kt         ← Single callback interface (happy + error paths)
│           │
│           ├── session/                           ═══ LAYER 1+: Android lifecycle owner
│           │   ├── ArSessionManager.kt            ← Session.create/resume/pause/close
│           │   ├── ArInstallFlow.kt               ← ArCoreApk.requestInstall state machine
│           │   └── DeviceCapabilityChecker.kt     ← ARCore availability check, non-AR fallback flag
│           │
│           ├── camera/                            ═══ LAYER 2: CPU frame pipeline
│           │   ├── CameraFrameProvider.kt         ← Owns acquireCameraImage(), zero-copy buffer pool
│           │   ├── CameraIntrinsics.kt            ← Focal length, principal point (for MediaPipe)
│           │   └── FrameMetadata.kt               ← Timestamp, rotation, dimensions per frame
│           │
│           ├── tracking/                          ═══ LAYER 2: ARCore SLAM
│           │   ├── ArTrackingEngine.kt            ← Implements ITrackingModule, wraps ARCore Frame
│           │   ├── PlaneDetector.kt               ← Filters trackables → HorizontalPlane/VerticalPlane
│           │   ├── AnchorManager.kt               ← Creates, persists, and resolves World Anchors
│           │   └── TrackingState.kt               ← Data class: pose, planes[], anchors[], frameTs
│           │
│           ├── renderer/                          ═══ LAYER 2: Filament PBR
│           │   ├── FilamentSceneRenderer.kt       ← Engine init, SwapChain, Renderer, CameraStream
│           │   ├── FilamentCameraSync.kt          ← Syncs ARCore View+Projection → Filament Camera
│           │   ├── ModelLoader.kt                 ← gltfio AssetLoader, ResourceLoader, GLB ingest
│           │   ├── MaterialLibrary.kt             ← Loads .filamat blobs, caches MaterialInstance
│           │   ├── PartHighlighter.kt             ← Emissive glow on selected MaterialInstance
│           │   ├── LightingSystem.kt              ← IBL environment, directional sun, contact shadows
│           │   └── reticle/
│           │       └── ReticleRenderer.kt         ← Filament mesh at hit-test Pose, animates opacity
│           │
│           ├── vision/                            ═══ LAYER 2: MediaPipe (async, background thread)
│           │   ├── HandTrackingPipeline.kt        ← HandlerThread owner, HandLandmarker lifecycle
│           │   ├── HandLandmarkResult.kt          ← Data class: 21 landmarks × (x,y,z), handedness, confidence
│           │   └── LandmarkConverter.kt           ← Normalised [0,1] → screen px → world-space ray
│           │
│           ├── interaction/                       ═══ LAYER 3: Spatial interaction
│           │   ├── RaycastEngine.kt               ← Unprojects screen→world ray, Ray-OBB intersection
│           │   ├── GestureStateMachine.kt         ← Pinch, hold, two-hand scale/rotate state machine
│           │   ├── InteractionEvent.kt            ← Sealed class: Tap, Pinch, TwoHandScale, Rotate
│           │   └── BoundingBoxTracker.kt          ← Tracks OBB of placed model in world space
│           │
│           ├── scenegraph/                        ═══ LAYER 3: Scene & model logic
│           │   ├── SceneNodeTree.kt               ← glTF node hierarchy, parent-child, transform stack
│           │   ├── ModelInstance.kt               ← Placed model: anchor + root node + real-world bounds
│           │   ├── PartAnimator.kt                ← Timed explode/collapse animations via interpolation
│           │   └── SceneState.kt                  ← Current scene snapshot: models[], selectedPart?
│           │
│           ├── bridge/                            ═══ LAYER 4: Flutter boundary
│           │   ├── SpatialXrPlugin.kt             ← FlutterPlugin: registers MethodChannel + PlatformViewFactory
│           │   ├── SpatialXrPlatformView.kt       ← PlatformView impl: owns SurfaceView, routes events
│           │   └── SpatialXrEngine.kt             ← Pure Kotlin facade (NO Flutter imports), assembles all modules
│           │
│           └── diagnostics/                       ═══ LAYER 4: Debug & observability
│               ├── EngineMetricsCollector.kt      ← FPS, frame time, tracking state, hand confidence
│               ├── OverlayDiagnosticsRenderer.kt  ← Debug HUD text overlay (stripped in release builds)
│               └── EngineLogger.kt                ← Structured tagged logging per subsystem
```

---

## PART 4 — MODULE DEPENDENCY RULES (enforced, not optional)

| Module | May Import From | Must NOT Import From |
|--------|----------------|----------------------|
| `core/` | Nothing | Everything |
| `session/` | `core/` | `tracking`, `renderer`, `vision`, `bridge` |
| `camera/` | `core/` | `tracking`, `renderer`, `vision`, `bridge` |
| `tracking/` | `core/`, `session/`, `camera/` | `renderer`, `vision`, `interaction`, `bridge` |
| `renderer/` | `core/`, `session/` | `tracking`, `vision`, `interaction`, `bridge` |
| `vision/` | `core/`, `camera/` | `tracking`, `renderer`, `interaction`, `bridge` |
| `interaction/` | `core/`, `tracking/`, `vision/` | `renderer`, `bridge` |
| `scenegraph/` | `core/`, `renderer/` | `tracking`, `vision`, `bridge` |
| `bridge/` | ALL modules | — |
| `diagnostics/` | `core/`, reads from all | Writes to none |

---

## PART 5 — DATA FLOW (one frame, 60 Hz)

```
Android Frame Callback (Choreographer)
        │
        ▼
[session/ArSessionManager]  ──── session.update() ────►  [tracking/ArTrackingEngine]
        │                                                        │
        │                                              TrackingState (pose, planes, anchors)
        │                                                        │
        ▼                                                        ▼
[camera/CameraFrameProvider]                       [renderer/FilamentCameraSync]
  acquireCameraImage()                               Syncs View+Projection matrices
        │                                                        │
        │  MPImage (CPU)                                         ▼
        ▼                                           [renderer/FilamentSceneRenderer]
[vision/HandTrackingPipeline]  (async)               Renders scene at current camera pose
        │                                                        ▲
        │  HandLandmarkResult                                    │
        ▼                                           [scenegraph/SceneNodeTree]
[interaction/GestureStateMachine]                    Provides renderable node transforms
        │
        │  InteractionEvent (Pinch / Rotate / Scale)
        ▼
[scenegraph/PartAnimator + ModelInstance]
  Updates node transforms, triggers PartHighlighter
        │
        ▼
[bridge/SpatialXrEngine]
  Fires EngineCallbacks → Flutter MethodChannel
```

---

## PART 6 — PHASE BUILD ORDER

| Phase | Modules Active | Goal |
|-------|---------------|------|
| **Phase 1A** | `core`, `session`, `camera`, `tracking` | ARCore session up, planes detected, poses tracked |
| **Phase 1B** | + `renderer` | Filament renders camera feed + reticle on detected plane |
| **Phase 1C** | + `scenegraph` (basic) | GLB model loads, sits on anchor, stays fixed in world |
| **Phase 1D** | + `bridge` | Flutter can place/remove model via MethodChannel |
| **Phase 2A** | + `vision` | Hand landmarks detected asynchronously |
| **Phase 2B** | + `interaction` | Pinch rotates model, two-hand scales model |
| **Phase 2C** | + `scenegraph` (PartAnimator) | Exploded view animations |

> Phase 1 must compile and run with Phase 2 modules **completely absent** from the build.

---

## PART 7 — `EngineError` Sealed Class (complete)

```kotlin
// core/error/EngineError.kt
sealed class EngineError(val message: String, val cause: Throwable? = null) {
    class ArCoreNotInstalled(cause: Throwable? = null) : EngineError("ARCore not installed", cause)
    class ArCoreUnsupported(device: String) : EngineError("ARCore unsupported on $device")
    class SessionCreateFailed(cause: Throwable) : EngineError("Session creation failed", cause)
    class CameraPermissionDenied : EngineError("Camera permission denied")
    class FilamentInitFailed(cause: Throwable) : EngineError("Filament init failed", cause)
    class ModelLoadFailed(path: String, cause: Throwable) : EngineError("Model load failed: $path", cause)
    class MediaPipeInitFailed(cause: Throwable) : EngineError("MediaPipe init failed", cause)
    class TrackingLost(reason: String) : EngineError("Tracking lost: $reason")
    class AnchorCreationFailed(cause: Throwable? = null) : EngineError("Anchor creation failed", cause)
    class OutOfMemory(subsystem: String) : EngineError("OOM in $subsystem")
}
```

---

## PART 8 — `EngineCallbacks` Interface (complete)

```kotlin
// core/error/EngineCallbacks.kt
interface EngineCallbacks {
    // Tracking
    fun onTrackingStateChanged(isTracking: Boolean) {}
    fun onPlaneDetected(planeId: String, centerPose: Pose) {}
    // Model
    fun onModelPlaced(instanceId: String, worldPose: Pose) {}
    fun onModelRemoved(instanceId: String) {}
    // Interaction
    fun onGestureDetected(event: InteractionEvent) {}
    fun onPartSelected(instanceId: String, partName: String) {}
    // Errors — every module reports failures here
    fun onEngineError(error: EngineError) {}
    // Diagnostics
    fun onMetricsUpdate(fps: Float, trackingState: String, handConfidence: Float) {}
}
```
