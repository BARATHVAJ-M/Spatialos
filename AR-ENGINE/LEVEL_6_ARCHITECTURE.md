# SpatialOS AR Engine Architecture Specification
## Level 6: Implementation Strategy

This document defines the strict strategic blueprint for **Level 6: Implementation**. 

While Levels 1-5 established the theoretical boundaries, contracts, and data models of the engine, this document defines *how* the actual Dart/Flutter codebase will be constructed, structured, and rolled out without breaking those boundaries.

---

## 1. REPOSITORY & PACKAGE STRUCTURE

The SpatialOS AR Engine must remain completely isolated from the specific UI of any consuming application (like a consumer app or a diagnostic app).

### 1.1 The Package Boundary
The engine will be implemented as a standalone local Flutter package (`spatialos_ar_engine`). 

**Structure:**
```text
spatialos_ar_engine/
├── pubspec.yaml
├── lib/
│   ├── spatialos_ar_engine.dart (The public barrel file)
│   └── src/ (All concrete implementations MUST be hidden here)
│       ├── core/
│       ├── spatial/
│       ├── scene/
│       ├── objects/
│       ├── device/
│       ├── rendering/
│       ├── interaction/
│       ├── content/
│       ├── mini_apps/
│       ├── services/
│       ├── network/
│       └── ... (All 19 modules)
```

### 1.2 The Barrel File Rule
No application consuming this engine is allowed to import from `lib/src/`. The `spatialos_ar_engine.dart` file will explicitly export ONLY the Level 3 Contracts (Interfaces) and Level 4 Data Models (DTOs), plus the primary `SpatialOSEngine` bootstrapper.

---

## 2. THE MOCK-FIRST IMPLEMENTATION STRATEGY

AR development is notoriously difficult because physical hardware (Cameras, LiDAR) cannot be easily tested in Emulators, and compiling native C++ AR libraries often breaks builds across different Gradle versions.

### 2.1 The "Mock AR" Paradigm
To guarantee velocity and stability, the V1 Implementation will be built **Mock-First**.
1. **Mock Hardware**: We will implement `MockWorldTracker` and `MockCameraProvider` before integrating real ARCore/ARKit. 
2. **Mock Scene**: This allows the Scene Manager and Mini-App Runtime to be built and tested entirely on desktop or in simple emulators.
3. **Hot-Swappable**: Because of our Level 3 Interfaces, swapping `MockWorldTracker` for `GoogleARCoreTracker` later will require changing exactly one line of code in the Dependency Injector.

---

## 3. STATE MANAGEMENT IMPLEMENTATION

The engine must not rely on Flutter-specific UI state management (like Provider, Riverpod, or BLoC) for its internal brain. The core engine must be pure Dart.

### 3.1 Reactive Streams
- The engine's internal state will be implemented using pure Dart `StreamController` and `Stream`.
- External Flutter apps will observe the engine state using `StreamBuilder` widgets.

### 3.2 The Event Bus
- The `IEventBus` will be implemented using a generic `Stream` broadcasting mechanism.
- Handlers will subscribe to specific Type parameters: `eventBus.on<ObjectInteractedEvent>().listen(...)`.

---

## 4. DEPENDENCY INJECTION IMPLEMENTATION

We will not use heavy reflection-based Dependency Injection libraries.

### 4.1 Custom Module Manager
We will implement a lightweight, extremely fast Service Locator (`ModuleManager`) utilizing a `Map<Type, dynamic>` registry.

```dart
// Conceptual implementation plan for DI
class ModuleManager implements IModuleManager {
  final Map<Type, dynamic> _registry = {};

  @override
  void register<T>(T instance) {
    _registry[T] = instance;
  }

  @override
  T resolve<T>() {
    if (!_registry.containsKey(T)) throw DependencyException();
    return _registry[T] as T;
  }
}
```

---

## 5. V1 IMPLEMENTATION SCOPE (The Rollout Plan)

To prevent overwhelming the architecture, the Level 6 coding phase will be rolled out in strict sequential phases.

### Phase A: The Skeleton (Core & Math)
*Focus: Get the engine booting.*
1. Implement the DI `ModuleManager`.
2. Implement the `EventBus`.
3. Implement `Transform3D` and Vector math.
4. Implement the `SpatialOSEngine` boot sequence.

### Phase B: Spatial & Scene (The Brain)
*Focus: Track space and build the hierarchy.*
1. Implement `MockWorldTracker` (Emulates 6DoF movement).
2. Implement `SceneManager` (Manages the tree).
3. Implement core `SpatialNode` concrete classes (Plane, Image, MiniApp).

### Phase C: Interaction & Mocks (The Sandbox)
*Focus: Allow users to tap things in the mock environment.*
1. Implement `InteractionSystem` (Hit-testing the mock scene).
2. Implement `MiniAppRuntime` (Sandboxing logic).

### Phase D: Physical Hardware & Visuals (The Reality)
*Focus: Connect the real world.*
1. Swap `MockWorldTracker` for a real physical implementation (e.g., bridging to a platform channel).
2. Implement `CameraProvider`.
3. Connect the `Renderer`.

---

## 6. ERROR HANDLING IMPLEMENTATION

### 6.1 The Safety Net
All module functions that perform IO or Hardware operations must be wrapped in generic `try/catch` blocks that immediately route physical exceptions into the Engine's `ErrorSystem`, translating them into the standard `EngineErrorData` model defined in Level 4.

---

> This concludes the **Level 6: Implementation Strategy**. With the repository structure, mock-first approach, state management, and strict rollout phases defined, the architectural blueprint is perfectly primed for actual coding.
