# SpatialOS XR Engine — Master Tech Stack
> Future-proof. Production-grade. DIY-glasses ready. No shortcuts.

---

## HOW TO READ THIS

Each layer has a **Phase A** (what you build now on Android phone) and a **Phase B** (what it upgrades to on DIY glasses / standalone XR device). The code you write in Phase A does NOT get thrown away — it gets a hardware swap underneath, the engine logic stays the same.

---

## LAYER 0 — HARDWARE TARGET

### Phase A: Android Phone (Now)
| Component | Spec |
|-----------|------|
| CPU | ARM Cortex-A55 / A78 (your Realme Narzo 50) |
| GPU | Mali / Adreno (OpenGL ES 3.1 + Vulkan 1.1) |
| Camera | Single rear RGB camera (30-60 fps) |
| IMU | 6-axis (3-axis accel + 3-axis gyro) |
| Display | Single flat OLED screen |
| Input | Touch + camera hand tracking |

### Phase B: DIY XR Glasses (Future)
| Component | Option 1 — Budget | Option 2 — Pro |
|-----------|------------------|----------------|
| Compute board | Raspberry Pi CM5 | NVIDIA Jetson Orin NX |
| GPU | VideoCore VII | 1024-core Ampere |
| Stereo cameras | 2× OV9281 (global shutter, 120 fps) | Intel RealSense D435i |
| Depth sensor | Computed from stereo | Built-in structured IR |
| IMU | ICM-42688-P (SPI, 8 kHz) | Built-in RealSense IMU |
| Display | 2× 1080p micro-OLED (Sony ECX344A) | 2× 2K waveguide combiner |
| Optical | DIY half-mirror / Birdbath lens | Waveguide (like XREAL) |
| OS | Raspberry Pi OS / Ubuntu 22.04 | Linux + CUDA (L4T) |

> **Why OV9281?** It is a **global shutter** sensor — zero rolling shutter distortion during fast head movement. Rolling shutter (most phone cameras) causes SLAM to glitch mid-motion. Global shutter is mandatory for good glasses tracking.

---

## LAYER 1 — OPERATING SYSTEM & RUNTIME

| Phase | Choice | Why |
|-------|--------|-----|
| **A** | Android 12+ (API 31+) | ARCore runs here, Vulkan 1.1+ guaranteed |
| **B-budget** | Raspberry Pi OS (Debian Bookworm 64-bit) | Runs OpenCV, ORB-SLAM3, OpenXR |
| **B-pro** | Ubuntu 22.04 + L4T (NVIDIA Jetson Linux) | Full CUDA, TensorRT, ROS 2 Humble |

**OpenXR** is the unified runtime that makes Phase B work across hardware. Write to OpenXR and your engine runs on your DIY glasses, any future HMD, or Meta Quest without rewriting a line.

---

## LAYER 2 — SPATIAL TRACKING (SLAM)

This is the most critical layer. Everything else depends on it being correct.

### Phase A — ARCore (Android)
```
Library : com.google.ar:core:1.44.0

Gives you:
  - 6-DoF VIO (Visual-Inertial Odometry) SLAM
  - Plane detection (horizontal + vertical)
  - World anchors (persist position in space)
  - Depth API (on supported devices)
  - Camera pose at 30 Hz (tied to camera frame rate)
  - IMU fusion at 100-200 Hz internally (runs on DSP, not CPU)
```

> **Why ARCore and not writing our own?** Google runs SLAM on the DSP — your app gets pose for free, spending zero CPU cycles computing it. This is why you can hit 60 FPS rendering simultaneously.

### Phase B — ORB-SLAM3 (DIY Glasses)
```
Library : ORB-SLAM3 (C++17, open source, MIT licence)
GitHub  : UZ-SLAMLab/ORB-SLAM3

Gives you:
  - Monocular, Stereo, RGBD, and IMU-fused modes
  - Map reuse (load a saved map, relocalize instantly)
  - Multi-session mapping
  - Runs on CPU (Pi CM5) or GPU-accelerated
  - You compile it yourself and own every line
```

**Alternative if ORB-SLAM3 is too heavy on Pi**: OpenVINS (lighter VIO, 50+ Hz on ARM cores).

---

## LAYER 3 — 3D RENDERING ENGINE

### Phase A — Google Filament (Android)
```
Library : io.github.sceneview:arsceneview:2.2.1
          (bundles Filament + gltfio + ARCore integration)

Native  : com.google.android.filament:filament-android:1.51.3

Backend : OpenGL ES 3.1 → auto-upgrades to Vulkan when available

Gives you:
  - PBR (metallic-roughness workflow)
  - IBL (Image-Based Lighting) with HDR environment maps
  - Contact shadows on detected planes
  - glTF 2.0 / GLB model loading via gltfio
  - ECS scene graph
  - Multi-threaded render loop (render + main thread separation)
```

### Phase B — Filament Desktop (Same Codebase)
```
Filament compiles natively on Linux ARM.
Your engine code is IDENTICAL.
Only the surface changes: SurfaceView → X11/Wayland window.

Option if max performance needed: raw Vulkan
  - VulkanMemoryAllocator (VMA) + vk-bootstrap
  - SPIR-V compiled shaders (glslc or Slang)
  - Full GPU control — only go here if Filament cannot do what you need
```

### Shader Language Path
```
Phase A : GLSL ES 3.0  → compiled to Filament .filamat by matc tool
Phase B : GLSL 4.6     → same matc tool, same .filamat format
Future  : Slang (NVIDIA open-source, cross-compiles to GLSL / HLSL / Metal / SPIR-V / CUDA)
```

---

## LAYER 4 — DEPTH SENSING

| Phase | Method | Accuracy |
|-------|--------|----------|
| **A** | ARCore Depth API (ToF sensor or ML monocular) | ±5–20 cm |
| **A fallback** | Google ML Kit Depth (monocular ML) | ±10–30 cm |
| **B stereo** | Stereo disparity — OpenCV `StereoSGBM` | ±2–5 cm at 1 m |
| **B structured** | Intel RealSense D435i (IR + stereo) | ±1–2 cm at 1 m |
| **B AI** | Depth Anything V2 ViT-Small via TensorRT | ±3 cm, single camera |

Depth powers: occlusion (virtual object hidden behind real objects), surface meshing, physics collision.

---

## LAYER 5 — HAND & BODY TRACKING

### Phase A — MediaPipe Tasks Vision (Android)
```
Library : com.google.mediapipe:tasks-vision:0.10.14

HandLandmarker:
  - 21 hand keypoints per hand, up to 2 hands
  - 3D landmark coordinates (x, y, z relative to wrist)
  - Handedness (Left / Right)
  - LIVE_STREAM mode — runs on background HandlerThread
  - Model: hand_landmarker.task (~8 MB, float16 GPU delegate)
  - Latency: ~12–25 ms on modern phone GPU
```

### Phase B — Glasses Options
```
Option 1: MediaPipe C++ (same models, runs on Pi / Jetson)
  - Compile from source for ARM Linux
  - GPU delegate via OpenCL (Pi) or CUDA (Jetson)

Option 2: ONNX Runtime + MediaPipe ONNX export
  - onnxruntime-linux-aarch64
  - TensorRT execution provider on Jetson (10× faster)

Option 3 (best hardware): Leap Motion Controller 2
  - Dedicated hand tracking chip, 200 fps, sub-5 ms latency
  - Official Linux SDK (USB-C, plug into compute board)
  - Most accurate hand tracking available to indie builders
```

### Body Tracking (Phase B bonus)
```
BlazePose (MediaPipe) — 33-point full body skeleton
Runs alongside hand tracking on separate inference thread
```

---

## LAYER 6 — COMPUTER VISION & IMAGE PROCESSING

### Core CV Library
```
Phase A : OpenCV Android 4.9 — com.quickbirdstudios:opencv-contrib:4.9.0
Phase B : OpenCV 4.9 native C++ (compiled from source for ARM)

Uses:
  - Stereo camera calibration + rectification
  - Feature detection (ORB, SIFT) for custom tracking
  - Image preprocessing for MediaPipe (resize, color convert)
  - Stereo disparity map (StereoSGBM)
  - ArUco marker detection (aruco module)
  - Optical flow (Lucas-Kanade) for fast motion tracking
```

### GPU-Accelerated CV (Phase B — Jetson only)
```
VPI (Vision Programming Interface) — NVIDIA proprietary, free
  - Runs on Jetson's dedicated VPU/ISP hardware block
  - Stereo disparity, optical flow, Harris corners
  - Offloads computation from CPU entirely

CUDA-accelerated OpenCV (opencv_cuda module)
  - 10–50× faster than CPU for image filters and transforms
```

---

## LAYER 7 — AI / ML INFERENCE

### Phase A — On-Device (Android)
| Model | Library | Use |
|-------|---------|-----|
| MediaPipe Hand Landmarker | MediaPipe Tasks | 21-point hand tracking |
| MediaPipe Depth (optional) | MediaPipe Tasks | Monocular depth |
| ML Kit Selfie Segmentation | ML Kit | Background removal |
| Custom models | TFLite GPU `tensorflow-lite-gpu:2.14.0` | Any custom task |

### Phase B — On-Device (Glasses)
| Model | Runtime | Latency |
|-------|---------|---------|
| Depth Anything V2 Small | ONNX + TensorRT (Jetson) | ~8 ms |
| YOLOv10n (object detect) | TensorRT | ~5 ms |
| Whisper Tiny (voice input) | whisper.cpp (ARM NEON) | ~200 ms |
| Custom gesture classifier | TFLite or ONNX | ~3 ms |

### Phase B — Inference Runtime Stack
```
1. ONNX Runtime 1.18   — universal model format, runs everywhere
2. TensorRT 10.x       — Jetson only, 10–50× faster than ONNX alone
3. TFLite 2.14         — Pi CPU + GPU delegate (OpenCL)
4. llama.cpp           — LLM on CPU/GPU (future voice assistant)
5. OpenVINO 2024.x     — Intel NCS2 stick (alternative accelerator)
```

---

## LAYER 8 — SPATIAL AUDIO

AR without spatial audio feels fake. Sound must come from where the 3D object is in world space.

```
Phase A: Google Resonance Audio (Android)
  - Apache 2.0, open source
  - com.google.resonance-audio:resonance-audio:1.0.0
  - HRTF binaural audio (Head-Related Transfer Function)
  - Works with phone speakers AND headphones
  - Position audio source at exact 3D world coordinates

Phase B: OpenAL-soft + KEMAR HRTF dataset
  - openal-soft (open source, compiles on Linux ARM)
  - MIT KEMAR HRTF dataset (free, 72 directions measured on a human head)
  - Sound positioned at exact 3D anchor coordinates of virtual object
  - Latency < 10 ms
```

---

## LAYER 9 — NETWORKING & MULTI-USER

For when two people look at the same AR scene simultaneously.

```
Phase A : WebSocket (OkHttp 4.12) — simple real-time pose sync
Phase B : WebRTC data channels — peer-to-peer, ~20 ms latency
Phase B+: QUIC (libquic / Cloudflare QUICHE) — sub-10 ms latency

Shared world state sync:
  CRDTs (Conflict-free Replicated Data Types)
  - Each device owns its own state, merges automatically, no server needed
  - Library: Automerge (Rust port automerge-rs, C FFI available)

Pose streaming: Protocol Buffers (protobuf 3)
  - Compact binary format, ~20 bytes per pose update
  - 60 Hz pose sync = ~100 KB/s bandwidth per user
```

---

## LAYER 10 — ENGINE BRIDGE & APP LAYER

### Phase A — Flutter Bridge
```
Flutter 3.24+
  - PlatformView → Android SurfaceView (Filament renders here)
  - MethodChannel (Dart ↔ Kotlin) for engine commands
  - EventChannel (Kotlin → Dart) for engine event callbacks
  - dart:ffi (optional — direct C++ function calls, bypasses MethodChannel overhead)
  - flutter_gl (alternative — share OpenGL context between Flutter and Filament)
```

### Phase B — OpenXR (Glasses Runtime)
```
OpenXR 1.1 (Khronos standard, fully open source)
  - Single API works on: your DIY glasses, Meta Quest, XREAL, Apple Vision Pro
  - xrLocateSpace()     → get camera pose (maps to ORB-SLAM3 on your glasses)
  - xrCreateSwapchain() → stereo display output
  - xrSyncActions()     → unified input (hand, controller, voice)
  - Composition layers  → stereo reprojection without judder

Runtime implementation: Monado (open source OpenXR runtime, runs on Linux)
  - Monado maps OpenXR calls → V4L2 camera → ORB-SLAM3 → your display
  - You build the experience once to OpenXR. Hardware is swappable below it.
```

> **Why OpenXR is the right bet**: Meta, Microsoft, Valve, Sony, and Apple are all converging on OpenXR. It is the OpenGL of XR. Write to it once and your engine works everywhere.

---

## LAYER 11 — BUILD SYSTEM & TOOLCHAIN

### Phase A (Android)
```
Kotlin 2.0.0              — engine language
Gradle 8.9 (KTS)          — build system
Android Gradle Plugin 8.5
NDK r26c                  — C++ interop (OpenCV JNI, Filament native)
CMake 3.28                — native code build
matc (Filament tool)      — compile .mat sources → .filamat binary material blobs
ktlint + detekt           — Kotlin static analysis
```

### Phase B (Linux ARM)
```
GCC 13 / Clang 17         — C++17 or C++23
CMake 3.28                — same CMakeLists.txt, different toolchain file
Ninja 1.11                — fast build (replaces Make)
Conan 2.x                 — C++ package manager (like pub.dev for C++)
Cross-compile toolchain   — aarch64-linux-gnu (build on x86 PC, deploy to ARM board)
```

### CI/CD
```
GitHub Actions
  - Auto build Kotlin engine on every push
  - Run ktlint + detekt lint
  - Run cppcheck for C++ static analysis
  - Firebase Test Lab — run APK on real Android devices in cloud
  - Matrix build — test on API 24, 29, 31, 34 simultaneously
```

---

## LAYER 12 — DEBUGGING & PROFILING

This is what separates a production engine from a demo.

| Tool | Phase | What It Reveals |
|------|-------|-----------------|
| **Android GPU Inspector** | A | GPU frame timeline, draw calls, shader bottlenecks |
| **Android Studio Profiler** | A | CPU threads, memory, battery drain |
| **Perfetto** | A | System-wide trace (Choreographer, Binder IPC, GPU queue) |
| **ARCore Sceneform Debug** | A | Tracking state, plane count, anchors live |
| **RenderDoc** | A + B | Frame capture — inspect every GPU API call |
| **NVIDIA Nsight Graphics** | B Jetson | CUDA + Vulkan GPU profiler |
| **Tracy Profiler** | B | C++ instrumented profiler, microsecond precision |
| **Valgrind / AddressSanitizer** | B | Memory leak + buffer overflow detection |

---

## COMPLETE MASTER STACK TABLE

| Layer | Phase A — Phone (NOW) | Phase B — DIY Glasses (FUTURE) |
|-------|-----------------------|--------------------------------|
| **Hardware** | Android ARM SoC | Jetson Orin NX / RPi CM5 + stereo cams |
| **OS** | Android 12+ | Ubuntu 22.04 / L4T |
| **SLAM** | ARCore 1.44 | ORB-SLAM3 + OpenVINS fallback |
| **Rendering** | Filament via SceneView 2.2.1 | Filament on Linux / raw Vulkan |
| **Shaders** | GLSL ES → .filamat | GLSL 4.6 → .filamat / Slang |
| **Depth** | ARCore Depth API | Stereo StereoSGBM / RealSense D435i |
| **Hand tracking** | MediaPipe Tasks 0.10.14 | MediaPipe C++ / Leap Motion 2 |
| **Body tracking** | — | BlazePose C++ |
| **CV library** | OpenCV Android 4.9 | OpenCV 4.9 native / VPI (Jetson) |
| **AI runtime** | TFLite GPU delegate | ONNX Runtime + TensorRT |
| **Spatial audio** | Resonance Audio | OpenAL-soft + KEMAR HRTF |
| **Multi-user** | WebSocket (OkHttp) | WebRTC / QUIC + CRDTs |
| **App bridge** | Flutter MethodChannel | OpenXR 1.1 + Monado runtime |
| **Engine language** | Kotlin 2.0 + C++ (NDK) | C++17/23 |
| **UI language** | Dart (Flutter 3.24) | Flutter on Linux / Qt6 |
| **Build** | Gradle KTS + CMake | CMake + Ninja + Conan |
| **Debug** | GPU Inspector + Perfetto | RenderDoc + Tracy + Nsight |

---

## THE ONE RULE THAT MAKES THIS FUTURE-PROOF

> **Program to the interface. Never to the hardware.**

Your `ITrackingModule` returns a `Pose`. On Phase A, `ArTrackingEngine` fills it using ARCore. On Phase B, `OrbSlamTrackingEngine` fills it using ORB-SLAM3 on stereo cameras. Your renderer, gestures, scene graph — they never change. They only ever see `ITrackingModule`.

This is exactly why the engine was designed with `core/contracts/` first.

---

## WHAT TO DOWNLOAD RIGHT NOW

```
1. Filament matc compiler (compile .mat → .filamat)
   https://github.com/google/filament/releases
   → Download Windows release → extract matc.exe → add to PATH

2. MediaPipe hand_landmarker.task model (~8 MB)
   https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task
   → Save to: engine/src/main/assets/mediapipe/hand_landmarker.task

3. Android NDK r26c (for OpenCV JNI + C++ interop)
   Android Studio → SDK Manager → SDK Tools → NDK (Side by side) → 26.3.x

4. ARCore APK for emulator testing
   https://github.com/google-ar/arcore-android-sdk/releases
```
