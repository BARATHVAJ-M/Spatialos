# Spatial XR Engine: Master Technical Reference Library

> **Purpose**: This directory serves as the definitive, production-grade architectural and mathematical reference library for developing the **SpatialOS Real-Time Spatial XR Engine**.
> Every module references official engineering documentation from **Google ARCore**, **Google Filament**, **Google MediaPipe Tasks Vision**, and the **Khronos glTF 2.0 Specification**.

---

## 📚 Module Reference Map

The technical knowledge is organized into 6 focused engineering modules:

| Document | Core Topics | Primary Source | How It Helps Our Engine |
| :--- | :--- | :--- | :--- |
| **[`01_SPATIAL_TRACKING_AND_SURFACES.md`](./01_SPATIAL_TRACKING_AND_SURFACES.md)** | • Visual-Inertial Odometry (VIO)<br>• Surface Plane Detection ($Ax+By+Cz+D=0$)<br>• Hit-Testing on Trackables<br>• Euclidean World Anchors | Google ARCore Developer Reference | Guarantees that when a 3D model is placed on a physical floor or table, it remains **100% physically locked** without sliding, jumping, or drifting as the user walks around it. |
| **[`02_CAMERA_PIPELINE_AND_FRAME_SHARING.md`](./02_CAMERA_PIPELINE_AND_FRAME_SHARING.md)** | • Single Camera Ownership Constraint<br>• CPU Image Acquisition (`acquireCameraImage`)<br>• Zero-Copy Buffer Lifecycle<br>• Camera View & Projection Matrix Math | Android NDK / ARCore Camera API | Solves the camera hardware conflict (allowing MediaPipe to process rear-camera frames from ARCore) and keeps 3D graphics in exact alignment with device optics. |
| **[`03_PHYSICALLY_BASED_3D_RENDERING.md`](./03_PHYSICALLY_BASED_3D_RENDERING.md)** | • Google Filament Engine Architecture<br>• Entity Component System (ECS)<br>• PBR Metallic-Roughness Pipeline<br>• `gltfio` Asset Ingestion & Instancing | Google Filament Documentation | Delivers photorealistic, hardware-accelerated 3D rendering of complex mechanical models at sustained 60 FPS with contact shadows and environmental reflections. |
| **[`04_HAND_TRACKING_AND_ASYNC_INFERENCE.md`](./04_HAND_TRACKING_AND_ASYNC_INFERENCE.md)** | • MediaPipe Tasks Vision Architecture<br>• 21 Hand Joint Landmarks & Topology<br>• `RunningMode.LIVE_STREAM` Execution<br>• Monotonic Timestamps & Decoupled Loops | Google MediaPipe Vision Guide | Enables touchless hand tracking directly from the rear camera feed without opening a secondary camera session or stalling the 3D render thread. |
| **[`05_GESTURE_INTERACTION_AND_RAYCASTING.md`](./05_GESTURE_INTERACTION_AND_RAYCASTING.md)** | • Viewport to 3D Ray Unprojection<br>• Ray-Oriented Bounding Box (OBB) Hit Tests<br>• Anatomically Normalized Pinch Math<br>• Hysteresis, Smoothing & Two-Hand Gestures | Real-Time 3D Interaction Mathematics | Bridges 2D camera finger coordinates to real 3D manipulation, allowing the user to pinch-grab, rotate, zoom, and translate the engine model intuitively. |
| **[`06_SCENE_GRAPH_AND_ENGINE_DISASSEMBLY.md`](./06_SCENE_GRAPH_AND_ENGINE_DISASSEMBLY.md)** | • glTF 2.0 Node Hierarchy<br>• Transformation Composition ($M = T \times R \times S$)<br>• Exploded View / Disassembly Mechanics<br>• Part Selection, Highlighting & Outlines | Khronos Group glTF 2.0 Specification | Powers Phase 2 functionality—allowing complex multi-part engine assemblies (e.g. pistons, cylinder heads, crankshafts) to be disassembled, animated, and inspected part-by-part. |
| **[`07_ENGINE_MODULE_ARCHITECTURE.md`](./07_ENGINE_MODULE_ARCHITECTURE.md)** | • 10 Architectural Flaws & Fixes<br>• Initial 4-Layer Module Map<br>• Interface Isolation & Error Contracts | Production Engine Design | Documents the architectural evolution and the critical review that eliminated cross-layer coupling. |
| **[`08_MASTER_MODULE_ARCHITECTURE.md`](./08_MASTER_MODULE_ARCHITECTURE.md)** | • Definitive 12-Layer / 37-Module Architecture<br>• 124 Files Fully Mapped<br>• Encapsulation & Dependency Matrix<br>• Complete Frame Data Flow | Clean Architecture for XR | Serves as the master architectural blueprint for the engine—ensuring any subsystem can be modified without bleeding into others. |
| **[`MASTER_TECHSTACK.md`](./MASTER_TECHSTACK.md)** | • Complete 12-Layer Tech Stack<br>• Phase A (Phone) vs Phase B (DIY Glasses)<br>• SLAM, Filament, MediaPipe, OpenXR | XR Systems Engineering | Defines the full technology roadmap from current phone testing to future custom smart glasses hardware. |

---

## 🔄 End-to-End Runtime Data Flow

```
                                      PHYSICAL WORLD
                                            │
                                            ▼
                           [ ARCore Hardware Camera Session ]
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     │ 60 FPS YUV_420_888 Frames                   │ 6-DoF Camera Pose, View &
                     │ (acquireCameraImage)                        │ Projection Matrices
                     ▼                                             ▼
        [ MediaPipe Tasks Vision ]                        [ Filament 3D Engine ]
        • Asynchronous ML Worker Loop                     • PBR Shaders & IBL
        • 21 Hand Keypoints Extracted                     • RenderableManager & TransformManager
                     │                                             │
                     └──────────────────────┬──────────────────────┘
                                            │ Raycast Unprojection:
                                            │ (P_proj * V_view)^-1 * Screen_Fingertip
                                            ▼
                          [ Spatial Interaction Controller ]
                          • Detects Pinch on Model's OBB
                          • One-Hand Drag: Rotation / Orbit
                          • Two-Hand Drag: Uniform Metric Scaling
                          • Part Click: Disassembly Offset along Normal
                                            │
                                            ▼
                               [ Real Room Display Output ]
```

