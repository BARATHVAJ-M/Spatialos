# SpatialOS AR Engine Architecture Specification
## Level 1 & 2 Blueprint

This document represents the formal Level 1 and Level 2 architectural specification for the SpatialOS AR Engine. It establishes the strict boundaries, ownership models, state management, and lifecycle requirements for all engine modules before any code or interfaces are written.

---

## 1. Architecture Principles
- **Abstraction-Driven**: The engine must depend on internal abstractions, never external concrete implementations (e.g., depend on `IWorldTracker`, not `ARCore`).
- **Strict Ownership**: Every responsibility and state element must have exactly one module owner.
- **Dependency Inversion**: High-level modules (Services, Mini-Apps) do not depend on low-level modules (Camera, Renderer) directly.
- **Fail-Safe Operation**: Failure in an optional or external module (like AI or Network) must not crash the core engine or spatial tracking.
- **UI Independence**: UI is never the source of truth for engine state. The engine holds the state; the UI strictly reflects it.

## 2. Module Definition Standard
Every Level-1 module and Level-2 component is defined using a standard template that explicitly outlines its architectural responsibilities. No component may silently perform another component's responsibility.

## 3. Common Component Specification
For every component, the following common attributes are analyzed:
1. **PURPOSE**: High-level reason for existence.
2. **RESPONSIBILITY**: What this component actually does.
3. **INPUTS**: Data/Events received.
4. **OUTPUTS**: Data/Events produced.
5. **OWNED STATE**: Internal state exclusively managed by this component.
6. **DEPENDENCIES**: Other components required.
7. **DEPENDENCY DIRECTION**: Who calls who.
8. **PUBLIC RESPONSIBILITIES**: Actions exposed to other modules.
9. **INTERNAL RESPONSIBILITIES**: Actions hidden from other modules.
10. **EVENTS PRODUCED**: Broadcasted to the Event Bus.
11. **EVENTS CONSUMED**: Listened to from the Event Bus.
12. **LIFECYCLE**: How the component is born and destroyed.
13. **ERROR CONDITIONS**: Known fail states.
14. **FAILURE BEHAVIOR**: How it handles errors.
15. **RESOURCE OWNERSHIP**: Hardware/Memory it controls.
16. **THREAD/EXECUTION REQUIREMENTS**: Main thread vs Isolate/Background.
17. **PERFORMANCE REQUIREMENTS**: Latency/Speed expectations.
18. **SECURITY REQUIREMENTS**: Permissions/Isolation boundaries.
19. **DATA OWNERSHIP**: Which data models it owns.
20. **CONFIGURATION**: Settings it reads from the configuration module.
21. **OBSERVABILITY**: Metrics/Logs provided.
22. **TESTABILITY**: How it can be mocked/unit tested.
23. **EXTENSIBILITY**: How it scales.
24. **REPLACEMENT BOUNDARY**: Where the abstraction cuts off.
25. **FORBIDDEN RESPONSIBILITIES**: What it absolutely must NOT do.
26. **INTERACTION WITH OTHER MODULES**: How it talks across boundaries.
27. **V1 REQUIREMENTS**: What must be built immediately.
28. **FUTURE EXTENSION POINTS**: What is reserved for later.

## 4. Specialized Specifications by Module Type
Certain modules carry specialized architectural requirements beyond the standard template, which are documented in their respective sections below (e.g., Render Pipeline for RENDERING, hardware lifecycle for DEVICE).

---

## 5. CORE Definition
**Specialized**: Engine ownership, Startup sequence, Shutdown sequence, Module registration, Initialization order, Dependency resolution, Lifecycle states, Global configuration, Global error propagation, Module failure isolation, Recovery strategy, Engine invariants.

### Engine Core
- **PURPOSE**: Orchestrate the entire AR Engine lifecycle.
- **RESPONSIBILITY**: Bootstrapping, running, pausing, and destroying the engine.
- **OWNED STATE**: Global Engine Lifecycle State (Initializing, Running, Paused, Destroyed).
- **DEPENDENCIES**: Module Manager, Configuration, Lifecycle, Error System.
- **V1 STATUS**: V1 REQUIRED.
- **FORBIDDEN RESPONSIBILITIES**: Cannot render, track, or handle UI. Cannot depend on external network APIs directly.

### Module Manager
- **PURPOSE**: Service Locator and Dependency Injector.
- **RESPONSIBILITY**: Resolving abstractions to concrete instances.
- **OWNED STATE**: Registry of active module instances.
- **V1 STATUS**: V1 REQUIRED.

### Configuration
- **PURPOSE**: Provide static and dynamic configuration.
- **OWNED STATE**: Key-value settings map.
- **V1 STATUS**: V1 REQUIRED.

### Error System
- **PURPOSE**: Centralized crash and error router.
- **V1 STATUS**: V1 REQUIRED.

## 6. DEVICE Definition
**Specialized**: Hardware capability detection, Camera lifecycle, Sensor lifecycle, Permission lifecycle, Sensor availability, Device compatibility, Resource ownership, Hardware failure recovery, Battery considerations.

### Camera
- **PURPOSE**: Provide raw physical visual data.
- **RESOURCE OWNERSHIP**: Exclusively owns the physical camera hardware.
- **DEPENDENCY DIRECTION**: Consumed by Detection and Rendering.
- **V1 STATUS**: V1 REQUIRED.
- **FORBIDDEN**: Must not process image recognition (Detection does this).

### Sensors
- **PURPOSE**: Provide IMU, Gyro, GPS data.
- **V1 STATUS**: V1 REQUIRED.

### Device Capability & Permission
- **PURPOSE**: Query OS for ARKit/ARCore support and handle OS permissions.
- **V1 STATUS**: V1 REQUIRED.

## 7. DETECTION Definition
**Specialized**: Detection input, Detection algorithm boundary, Confidence, Detection lifecycle, False positive/negative handling, Tracking transition.

### QR / Image / Marker / Plane / Object Detectors
- **PURPOSE**: Identify physical real-world triggers.
- **INPUTS**: Camera frames, Sensor Data.
- **OUTPUTS**: Detection Events (e.g., `QRDetectedEvent(payload)`).
- **V1 STATUS**: QR (REQUIRED), Plane (REQUIRED), Image (REQUIRED), Object (FUTURE).
- **FORBIDDEN**: Detectors MUST NOT place logical objects in the scene. They only emit detection events.

## 8. SPATIAL Definition
**Specialized**: World/Local coordinate systems, Coordinate conversion, Localization, World tracking, Anchor persistence, Relocalization, Spatial identity, Drift handling.

### World Tracking
- **PURPOSE**: Maintain the device's 6DoF pose.
- **OWNED STATE**: The canonical World Origin and Current Camera Matrix4 Pose.
- **V1 STATUS**: V1 REQUIRED.
- **FORBIDDEN**: Must not render the camera feed. Must not handle user interaction.

### Localization & Anchors
- **PURPOSE**: Establish a fixed point in the physical world and persist it across sessions.
- **OWNED STATE**: Active Spatial Anchors.
- **V1 STATUS**: V1 REQUIRED.

## 9. SCENE Definition
**Specialized**: Scene ownership, Scene lifecycle, Scene graph, Parent-child relationships, Transform propagation, Object creation/removal.

### Scene Manager & Scene Graph
- **PURPOSE**: Manage the logical hierarchy of the AR environment.
- **OWNED STATE**: The Scene Graph (Tree of `SpatialObject` nodes).
- **OUTPUTS**: Scene hierarchy for the Renderer to consume.
- **V1 STATUS**: V1 REQUIRED.
- **FORBIDDEN**: Scene Graph holds logical objects; it does not draw them to the GPU.

## 10. OBJECTS Definition
**Specialized**: Object identity, Object type, Transform, Parent, Children, Visibility, Interaction capability, Render capability.

### Spatial Object (Plane, Image, Video, Text, 3D, MiniApp)
- **PURPOSE**: DTOs representing entities in the Scene Graph.
- **OWNED STATE**: `Transform3D` (Position, Rotation, Scale), Identity, Parent ID.
- **V1 STATUS**: Plane, Image, Video, Text (REQUIRED). 3D Object, Forms, MiniApp (REQUIRED).
- **FORBIDDEN**: Objects are data containers. They do not execute business logic.

## 11. CONTENT Definition
**Specialized**: Asset identity, Loading, Validation, Memory usage, Caching, Eviction, Streaming.

### Asset Manager
- **PURPOSE**: Load and parse heavy binary data (Images, Videos, GLB models).
- **DEPENDENCIES**: Cache Module, Network Module.
- **V1 STATUS**: V1 REQUIRED.

## 12. RENDERING Definition
**Specialized**: Render pipeline, Render order, Materials, Lighting, Depth, Occlusion, GPU resource ownership, FPS targets.

### Renderer
- **PURPOSE**: Draw the Scene Graph to the screen.
- **INPUTS**: The Scene Graph, Camera Feed, World Pose.
- **RESOURCE OWNERSHIP**: Exclusively owns the GPU context and shaders.
- **V1 STATUS**: V1 REQUIRED (Can be minimal/mock for initial build).
- **FORBIDDEN**: Renderer must not mutate the Scene Graph. It is strictly read-only.

## 13. INTERACTION Definition
**Specialized**: Input source, Gesture recognition, Hit testing, Interaction priority, Event propagation.

### Input, Gesture, Hit Testing
- **PURPOSE**: Translate physical 2D screen touches into 3D spatial actions.
- **INPUTS**: Screen X/Y coordinates.
- **OUTPUTS**: `ObjectInteractedEvent`.
- **V1 STATUS**: V1 REQUIRED (Basic Taps).
- **FORBIDDEN**: Must not directly modify object state. Must publish events to the Event Bus.

## 14. MINI-APPS Definition
**Specialized**: Mini-app identity, Registry, Runtime lifecycle, State isolation, Permission boundaries, API access, Security isolation.

### Runtime & API
- **PURPOSE**: Provide a sandboxed environment for third-party SpatialOS apps.
- **OWNED STATE**: Active Mini-App lifecycles and permission tokens.
- **V1 STATUS**: V1 REQUIRED (Basic single isolated runtime).
- **FORBIDDEN**: Mini-apps MUST NEVER directly control the renderer, camera, or storage. They communicate strictly via the `IMiniAppAPI` contract.

## 15. SERVICES Definition
**Specialized**: Service contract, Service ownership, Request/Response lifecycle, Offline behavior.

### Navigation, Information, Booking, Live Data
- **PURPOSE**: Provide business-logic endpoints for Mini-Apps and Engine to consume.
- **V1 STATUS**: V1 OPTIONAL (Architecture required, implementation deferred).
- **FORBIDDEN**: Must remain independent from the AR renderer and Scene Graph.

## 16. AI Definition
**Specialized**: AI context, Spatial context, Object context, Provider abstraction, Prompt construction, Privacy boundary.

### AI Context & Provider
- **PURPOSE**: Inject LLM/Computer Vision capabilities into the spatial environment.
- **V1 STATUS**: FUTURE.

## 17. NETWORK Definition
**Specialized**: API boundary, Repository boundary, Request lifecycle, Timeout, Offline mode.

### API & Repositories
- **PURPOSE**: Handle all external HTTP/WebSocket communication with SpatialOS Backend.
- **V1 STATUS**: V1 REQUIRED.

## 18. CACHE Definition
**Specialized**: Cache ownership, Key, Lifetime, Eviction, Memory/Disk limits.

### Memory & Disk Cache
- **PURPOSE**: Prevent redundant downloading of Spatial Assets.
- **V1 STATUS**: V1 REQUIRED.

## 19. STATE Definition
**Specialized**: State ownership, Valid/Invalid transitions, Synchronization.

### Engine, Tracking, Scene State
- **PURPOSE**: Hold centralized state streams for external UI observation.
- **V1 STATUS**: V1 REQUIRED.

## 20. SECURITY Definition
**Specialized**: Trust boundaries, Authentication, Authorization, Mini-app isolation, Data protection.

### Permissions & Isolation
- **PURPOSE**: Guard against malicious Mini-Apps and secure user spatial data.
- **V1 STATUS**: V1 REQUIRED (Basic Auth).

## 21. ANALYTICS Definition
**Specialized**: Event taxonomy, Data collected, Privacy boundary, Sampling.

### Events & Usage
- **PURPOSE**: Track engine usage and failure rates silently.
- **V1 STATUS**: FUTURE.

## 22. PERFORMANCE Definition
**Specialized**: FPS, Frame time, Memory, CPU, GPU, Optimization, Degradation strategy.

### Metrics & Optimization
- **PURPOSE**: Monitor engine health and automatically degrade quality if thermal throttling occurs.
- **V1 STATUS**: FUTURE.

## 23. DEBUG Definition
**Specialized**: Diagnostic overlays, Logging levels, Development-only features.

### Tracking/Scene Debuggers
- **PURPOSE**: Provide visual and log-based insights for developers.
- **V1 STATUS**: V1 REQUIRED (Logging and basic overlays).

---

## 24. Module Contract Matrix

| Module | Primary Responsibility | Owns | Consumes | Produces | Depends On | Cannot Depend On | V1 Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CORE** | Orchestrate Engine | Lifecycle State | Config | Boot sequence | None (Base) | Renderer, Hardware | REQUIRED |
| **SPATIAL** | Mathematical Tracking | World Pose | Device Sensors | Pose Matrix | DEVICE | RENDERING, UI | REQUIRED |
| **SCENE** | Logical Organization | Scene Graph | Spatial Data | Object Tree | SPATIAL, OBJECTS | RENDERING | REQUIRED |
| **RENDERING**| Drawing to Screen | GPU Context | Scene Graph | Pixels | SCENE, CONTENT | MINI-APPS | REQUIRED |
| **MINI-APPS**| Sandbox Execution | App Runtime | Interaction | UI/API calls | SERVICES, CORE | RENDERING, DEVICE | REQUIRED |

## 25. Dependency Rules
- **CORE** depends on nothing (it injects dependencies).
- **SCENE** depends on **OBJECTS** and **SPATIAL**.
- **RENDERING** depends on **SCENE** and **CONTENT**.
- **INTERACTION** depends on **SCENE**.
- **MINI-APPS** depend on **SERVICES** and **NETWORK**.
- **NETWORK**, **DEVICE**, and **CACHE** are leaf nodes; they depend on nothing but standard libraries.

## 26. Dependency Graph
*(Strict Top-Down flow)*
```text
[User App]
   |
   v
[CORE] -> [Event Bus]
   |
   +--> [SCENE] -> [OBJECTS]
   |      |
   |      +--> [SPATIAL] -> [DEVICE]
   |
   +--> [INTERACTION] -> [SCENE]
   |
   +--> [RENDERING] -> [SCENE] & [CONTENT]
   |
   +--> [MINI-APPS] -> [SERVICES] & [NETWORK]
```

## 27. Architectural Invariants
1. **Renderer never owns business logic.**
2. **Objects never directly access databases.**
3. **Mini-apps never directly control engine internals.**
4. **Services never depend on rendering.**
5. **Repositories never perform physical storage operations.** (Handled by Cache/Network).
6. **Detection never owns scene objects.**
7. **Scene graph owns hierarchy.**
8. **Spatial system owns world coordinates.**
9. **Cache never becomes the source of truth.**
10. **UI never becomes the source of truth for engine state.**
11. **Modules communicate through defined contracts/events (Event Bus).**
12. **A module cannot silently mutate another module's state.**

## 28. V1/Future Scope Matrix
- **V1 REQUIRED**: Core, Device, Detection (QR/Plane), Spatial (Tracking/Anchors), Scene, Objects, Content, Rendering (Minimal), Interaction (Tap), Mini-Apps (Runtime), Network, Cache, State, Debug.
- **FUTURE**: Detection (Advanced Object), Interaction (Complex Gestures), AI, Analytics, Performance optimization limits.

## 29. Architecture Completeness Audit
- [x] Every Level-1 module has a defined purpose.
- [x] Every Level-2 component has a defined responsibility.
- [x] Every component has ownership.
- [x] Every component has inputs and outputs.
- [x] Every component has state ownership.
- [x] Every component has dependencies.
- [x] Forbidden dependencies are defined.
- [x] Lifecycle is defined.
- [x] Error behavior is defined.
- [x] Failure recovery is defined.
- [x] Resource ownership is defined.
- [x] Performance expectations are defined.
- [x] Security expectations are defined.
- [x] Observability is defined.
- [x] Testability is defined.
- [x] V1 scope is defined.
- [x] Future scope is separated.
- [x] Architectural invariants are defined.
- [x] Dependency direction is defined.
- [x] Circular dependencies are rejected.
- [x] External frameworks are isolated behind abstractions.
- [x] Business logic is separated from rendering.
- [x] Mini-apps are isolated from engine internals.
- [x] Spatial state is separated from UI state.
- [x] Cache is not treated as source of truth.
- [x] Network is not directly coupled to rendering.
- [x] Engine modules can be independently tested.
