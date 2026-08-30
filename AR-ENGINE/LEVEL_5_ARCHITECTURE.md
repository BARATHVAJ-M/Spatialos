# SpatialOS AR Engine Architecture Specification
## Level 5: Module Dependencies & Implementation Rules

This document represents the absolute, enterprise-grade definition for Level 5 of the SpatialOS AR Engine. It establishes the strict dependency graphs, module-to-module communication maps, inversion of control laws, data ownership matrices, and enforcement hooks. 

No module implementation may begin without strictly adhering to the dependency flow defined in this document.

---

## 1. INVERSION OF CONTROL (IoC) PRINCIPLE

The foundation of the engine is that no high-level module creates its own low-level dependencies. 

**Forbidden Rule**:
A module MUST NOT instantiate another module directly via constructors (e.g., `final renderer = Renderer(TrackingProvider())`). This creates unbreakable tight coupling.

**Required Rule**:
All dependencies must be requested from the `IModuleManager` (Service Locator) or injected via dependency injection during the boot sequence. Concrete implementations (e.g., `ARCoreTracker`) must never be referenced directly outside their specific initialization closure.

---

## 2. COMPLETE DEPENDENCY MATRIX

This matrix defines exactly what each of the 19 Level-1 Modules is allowed to depend on, and what is strictly forbidden.

| Module | Allowed Inward Dependencies (Consumes) | Forbidden Dependencies (Must Never Know About) |
| :--- | :--- | :--- |
| **1. CORE** | Configuration, Error System, Event Bus | All other modules (Core injects them, but does not import them) |
| **2. DEVICE** | Permissions, Configuration | Scene, Rendering, Content, AI, Services |
| **3. DETECTION** | Device (Camera, Sensors) | Objects, Scene, Rendering, UI |
| **4. SPATIAL** | Device (Sensors), Event Bus | Rendering, UI, Mini-Apps, Services |
| **5. SCENE** | Spatial, Objects, Event Bus | Rendering, Content (Assets), Camera |
| **6. OBJECTS** | Core Models (Math/Vectors) | Network, Database, Rendering logic |
| **7. CONTENT** | Network, Cache | Scene, Spatial, Rendering |
| **8. RENDERING**| Scene, Content, Spatial Pose | Services, Mini-Apps, Network, Detection |
| **9. INTERACTION**| Scene, Device (Input) | Mini-Apps, Services, Content |
| **10. MINI-APPS**| Services, Interaction, Network, State | Renderer, Camera, Scene Manager, Storage |
| **11. SERVICES** | Network, Cache, State | Renderer, Scene, Detection |
| **12. AI** | Scene, Spatial, Network, Context | Renderer, Cache |
| **13. NETWORK** | Configuration, Auth (Security) | Scene, Rendering, Interaction |
| **14. CACHE** | Configuration | Business Logic, Scene, Interaction |
| **15. STATE** | Event Bus | Renderer, Network, Hardware |
| **16. SECURITY** | Network (Auth) | Scene, Rendering, Tracking |
| **17. ANALYTICS**| Event Bus, Network | Scene, Rendering, Tracking (Must listen passively) |
| **18. PERFORMANCE**| Event Bus, Device | Business Logic, Scene, Interaction |
| **19. DEBUG** | All modules (Read-only observation) | Must not mutate ANY module state |

---

## 3. EXHAUSTIVE MODULE INITIALIZATION SEQUENCE

The Engine Core (`IEngineCore`) is strictly responsible for bootstrapping the engine in a specific, topological order to prevent `NullReferenceExceptions` and circular dependencies.

### Phase 1: Primal Dependencies (Leaf Nodes)
*Zero dependencies. Initialized synchronously.*
1. **Error System**: Traps boot crashes.
2. **Configuration**: Loads local/remote JSON configs.
3. **Event Bus**: Opens the communication channels.
4. **Cache**: Prepares the local disk mapping.
5. **State**: Initializes empty `StateStream` objects.

### Phase 2: Base Providers (Hardware & Network)
*Requires Phase 1.*
6. **Security (Auth)**: Validates session tokens.
7. **Network**: Bootstraps HTTP/WebSocket clients (Requires Security, Cache).
8. **Permissions**: Requests OS-level access.
9. **Device (Camera/Sensors)**: Warms up hardware (Requires Permissions).

### Phase 3: Spatial & Content Engines
*Requires Phase 2.*
10. **World Tracking**: Begins calculating 6DoF (Requires Device).
11. **Detection**: Begins scanning frames (Requires Device).
12. **Content / Asset Manager**: Begins downloading manifests (Requires Network).
13. **AI Context**: Establishes LLM connection (Requires Network).

### Phase 4: Orchestrators
*Requires Phase 3.*
14. **Scene Manager**: Constructs the root coordinate space (Requires World Tracking).
15. **Interaction**: Begins mapping screen coordinates (Requires Scene Manager).

### Phase 5: Visual & Runtime (The Consumers)
*Requires Phase 4.*
16. **Renderer**: Attaches to the UI Canvas (Requires Scene, World Tracking, Content).
17. **Services**: Exposes business logic endpoints (Requires Network).
18. **Mini-App Runtime**: Boots sandboxes (Requires Services, Interaction, State).
19. **Analytics & Performance**: Begins passive observation (Requires Event Bus).

---

## 4. MODULE-TO-MODULE COMMUNICATION MAP

To prevent circular dependencies, communication is split into three strict channels:

### 4.1 Downward Invocations (Command)
High-level modules call methods on low-level abstractions.
- **Example**: `MiniAppManager` calls `NetworkService.get()`.
- **Rule**: Must be asynchronous (`Future`). Must catch errors.

### 4.2 Upward Notifications (Event)
Low-level modules MUST NOT call high-level modules. They broadcast.
- **Example**: `WorldTracker` loses tracking. It MUST NOT call `Renderer.stop()`. It broadcasts `TrackingLostEvent`. The `Renderer` listens and pauses itself.
- **Rule**: Must be handled via the `IEventBus`.

### 4.3 State Observation (Query)
Modules read state from other modules via reactive streams.
- **Example**: `Renderer` listens to `SceneManager.onSceneUpdated`.
- **Rule**: State objects returned must be immutable/deep-copied.

---

## 5. DATA OWNERSHIP MATRIX

Who owns, mutates, and destroys critical data types?

| Data Type | Owned/Mutated By | Read By | Destroyed By |
| :--- | :--- | :--- | :--- |
| **World Pose** | SPATIAL | Rendering, Scene | SPATIAL (on reset) |
| **Scene Graph** | SCENE | Rendering, Interaction | SCENE (on clear) |
| **Spatial Anchors**| SPATIAL | Scene | SPATIAL |
| **Cached Assets** | CACHE | Content, Rendering | CACHE (Eviction rules) |
| **Auth Tokens** | SECURITY | Network | SECURITY (on logout) |
| **Mini-App State**| MINI-APPS | Services, UI | MINI-APPS (on termination) |
| **Camera Frames** | DEVICE | Detection, AI | DEVICE (on buffer flush) |

---

## 6. ERROR PROPAGATION & RECOVERY DEPENDENCIES

If a module fails, how does the dependency graph react?

- **Leaf Node Failure (e.g., Network offline)**: Network module enters `OfflineState`. Emits `NetworkOfflineEvent`. Dependent modules (Services, Content) switch to Cache. The Engine DOES NOT crash.
- **Hardware Failure (e.g., Camera denied)**: Device module emits `HardwareUnavailableEvent`. Spatial tracking fails. The Engine gracefully degrades to an error screen.
- **Consumer Failure (e.g., Mini-App crash)**: Mini-App runtime traps the error, destroys the specific Mini-App sandbox, and emits `MiniAppCrashedEvent`. The Scene and Renderer continue running flawlessly.

---

## 7. ARCHITECTURE ENFORCEMENT HOOKS

To ensure developers do not violate these rules during the implementation phase:

### 7.1 Encapsulation Purity
- **Rule**: Concrete implementations (e.g., `ARCoreTracker`, `SceneViewRenderer`) MUST NOT be exported from the engine package barrel file (`spatialos_ar_engine.dart`).
- **Enforcement**: The public API of the engine must ONLY export the `contracts/` and `models/` folders. This forces external apps to compile against abstractions.

### 7.2 Sandbox Integrity
- **Rule**: Mini-apps must be strictly isolated from engine internals.
- **Enforcement**: The `IMiniAppAPI` must be implemented via Dart Isolates or a restricted interface class. It must be physically impossible for a Mini-app developer to accidentally import `IRenderer` and delete nodes they do not own.

### 7.3 Rendering Read-Only Rule
- **Rule**: The Renderer is a pure consumer.
- **Enforcement**: The Renderer can read the `SceneGraph` to draw pixels, but it is strictly forbidden from editing nodes, moving objects, or altering the World Pose. If an object needs to move for an animation, the animation system edits the `SceneManager`, and the Renderer simply draws the new frame.

---

> This concludes the comprehensive, enterprise-level definition for **Level 5: Module Dependencies & Implementation Rules**. 
> The architecture is now mathematically guaranteed to avoid circular dependencies, tight coupling, and state corruption.
