# SpatialOS AR Engine Architecture Specification
## Level 3: Interfaces & Contracts

This document strictly defines the Level 3 Interfaces, Contracts, Inputs, Outputs, Events, and Dependency Boundaries for the SpatialOS AR Engine. It contains no concrete implementation code. It is entirely technology-independent.

---

## 1. CORE PRINCIPLES
- **Abstraction-Driven**: Modules communicate purely through interfaces.
- **Dependency Inversion**: Low-level infrastructure depends on high-level domain abstractions.
- **Decoupling**: Implementations (e.g., ARCore, SceneView, SQLite) are replaceable providers hidden behind these contracts.

---

## 2. PROVIDER CONTRACTS (Infrastructure/Hardware)

### `ICameraProvider`
- **Purpose**: Exposes physical camera frames and state.
- **Owner**: DEVICE Module
- **Consumers**: DETECTION, RENDERING
- **Inputs**: Camera start/stop commands.
- **Outputs**: Frame stream, Resolution, FOV.
- **State**: `CameraState` (Starting, Running, Unavailable).

### `ISensorProvider`
- **Purpose**: Exposes IMU, Gyro, GPS data.
- **Owner**: DEVICE Module
- **Consumers**: SPATIAL, CONTEXT

### `IWorldTrackingProvider`
- **Purpose**: Physical OS-level AR tracking.
- **Owner**: SPATIAL Module
- **Consumers**: SCENE, RENDERING
- **Outputs**: 6DoF Pose (Matrix4), Tracking Status.

### `IRenderProvider`
- **Purpose**: Draws spatial objects to a screen/surface.
- **Owner**: RENDERING Module
- **Inputs**: Scene Graph root, Camera Matrix.

### `INetworkProvider`
- **Purpose**: HTTP/WebSocket abstraction.
- **Owner**: NETWORK Module

---

## 3. DOMAIN CONTRACTS (AR Concepts)

### `ISpatialNode`
- **Purpose**: The base contract for anything existing in physical space.
- **Owner**: OBJECTS Module
- **Properties**: `id`, `parentId`, `localTransform`, `isVisible`, `nodeType`.
- **Must Not Do**: Contain rendering logic.

### `ISceneContract`
- **Purpose**: Hierarchical management of `ISpatialNode`s.
- **Owner**: SCENE Module
- **Commands**: `addNode()`, `removeNode()`, `updateTransform()`.
- **Queries**: `getNode(id)`, `getChildren(parentId)`.

### `IAnchorContract`
- **Purpose**: Persistent world-space locking.
- **Owner**: SPATIAL Module
- **Inputs**: Desired Pose.
- **Outputs**: `AnchorId`.

### `IDetectionContract<T>`
- **Purpose**: Generic detection of physical triggers (QR, Plane, Object).
- **Owner**: DETECTION Module
- **Outputs**: Stream of `DetectionResult` (Confidence, Pose, BoundingBox).

---

## 4. APPLICATION / SERVICE CONTRACTS

### `IServiceContract` (Base)
- **Purpose**: Business logic endpoints.
- **Owner**: SERVICES Module
- **Consumers**: MINI-APPS
- **Properties**: `serviceId`, `isAvailableOffline`.
- **Errors**: `ServiceUnavailableException`.

### Specialized Services
- `INavigationService`: Routes within the spatial map.
- `IBookingService`: Transactions and reservations.
- `IInformationService`: Spatial metadata queries.

---

## 5. MINI-APP CONTRACTS

### `IMiniAppRuntime`
- **Purpose**: Sandbox environment for third-party apps.
- **Owner**: MINI-APPS Module
- **Commands**: `launch(appId)`, `suspend(appId)`, `terminate(appId)`.

### `IMiniAppAPI`
- **Purpose**: The strict bridge exposed to Mini Apps.
- **Queries**: `requestUserPose()`.
- **Commands**: `requestServiceInvocation()`, `requestNetworkCall()`.
- **Forbidden**: Direct access to Camera, Renderer, or Storage.

---

## 6. INFRASTRUCTURE CONTRACTS

### `IRepository<T>`
- **Purpose**: Data fetching abstraction.
- **Owner**: NETWORK/CACHE Module
- **Commands**: `get()`, `save()`, `delete()`.
- **Forbidden**: Business logic orchestration.

### `IAssetCache`
- **Purpose**: Prevent redundant downloads.
- **Queries**: `hasAsset(id)`.
- **Commands**: `storeAsset()`, `evictAsset()`.

---

## 7. LIFECYCLE CONTRACTS

### Engine Lifecycle (`IEngineCore`)
- **UNINITIALIZED**: Engine created, no modules loaded.
- **INITIALIZING**: Modules registering, permissions requesting.
- **READY**: Hardware secured, awaiting trigger (QR).
- **RUNNING**: Tracking active, rendering active.
- **PAUSED**: Backgrounded by OS.
- **STOPPED**: Safely spun down.
- **ERROR**: Fatal unrecoverable failure.

### Tracking Lifecycle (`IWorldTracker`)
- **SEARCHING**: Looking for features.
- **TRACKING**: Confident 6DoF lock.
- **DEGRADED**: Poor lighting/movement.
- **LOST**: Total tracking loss.

---

## 8. EVENT CONTRACT ARCHITECTURE

**Event Bus**: `IEventBus`
- **Purpose**: Decoupled Pub/Sub communication.

**Taxonomy**:
- `ENGINE_READY` (Producer: CORE)
- `TRACKING_STARTED` / `TRACKING_LOST` (Producer: SPATIAL)
- `QR_DETECTED` (Producer: DETECTION, Payload: String)
- `ANCHOR_CREATED` (Producer: SPATIAL)
- `OBJECT_CREATED` / `OBJECT_REMOVED` (Producer: SCENE)
- `OBJECT_SELECTED` (Producer: INTERACTION, Payload: NodeId)
- `MINI_APP_STARTED` (Producer: MINI-APPS)
- `ASSET_LOADED` (Producer: CONTENT)
- `NETWORK_OFFLINE` (Producer: NETWORK)
- `ERROR_OCCURRED` (Producer: ERROR SYSTEM)

---

## 9. ERROR CONTRACT ARCHITECTURE

**Hierarchy**:
- `EngineException` (Base)
  - `DeviceException` (Hardware missing)
  - `PermissionException` (User denied camera)
  - `TrackingException` (Relocalization failed)
  - `SceneException` (Invalid parent ID)
  - `AssetException` (Corrupt 3D model)
  - `SecurityException` (Mini-app privilege violation)

**Structure**:
- `id`: Unique error code.
- `severity`: FATAL, WARNING, INFO.
- `isRecoverable`: Boolean.
- `fallbackBehavior`: Instructions for the orchestrator.

---

## 10. COMMAND / QUERY SEPARATION

**Example: Scene Manager**
- **COMMANDS** (Changes State): `attachNode(node, parent)`, `updateTransform(node, newMatrix)`.
- **QUERIES** (Reads State): `getSceneRoot()`, `raycastObject(x,y)`.
- **EVENTS** (Notifications): `onSceneUpdated`.

---

## 11. STATE OWNERSHIP

- **Global Engine State**: Owned by CORE. Read-only to UI.
- **World Pose**: Owned by SPATIAL. Read-only to RENDERING.
- **Scene Hierarchy**: Owned by SCENE. Mutated by INTERACTION/SERVICES. Read-only to RENDERING.
- **Mini-App State**: Owned by MINI-APPS Runtime. Isolated per app.
- **Cache Data**: Owned by CACHE.

---

## 12. DEPENDENCY MATRIX

| Module | Allowed Dependencies | Forbidden Dependencies |
| :--- | :--- | :--- |
| **CORE** | None (Base) | Renderer, Camera, UI |
| **SPATIAL**| Device, EventBus | Renderer, Services |
| **SCENE** | Spatial, Objects | Renderer, Camera |
| **RENDERER**| Scene, Content | Services, Mini-Apps |
| **MINI-APPS**| Services, Core API | Renderer, Hardware |
| **SERVICES**| Network, Cache | Renderer, Interaction |

---

## 13. VERSIONING & COMPATIBILITY

- **Interfaces**: Versioned via semantic naming (`IMiniAppAPI_v1`, `IMiniAppAPI_v2`).
- **Scene Objects**: Versioned schema. Unsupported object types default to `UnknownNode` (invisible placeholder).
- **Backend APIs**: Strict backwards compatibility via Repositories.

---

## 14. DATA OWNERSHIP & SECURITY BOUNDARIES

- **Security Boundary**: Mini-Apps operate in a zero-trust environment. The `IMiniAppAPI` verifies authorization tokens before passing requests to `SERVICES`.
- **Data Protection**: Credentials are owned by SECURITY. No other module, especially MINI-APPS, can query raw authentication tokens.
- **Performance Boundary**: RENDERING dictates FPS limits. If tracking degraded, SPATIAL drops update frequency. CONTENT aborts loading if Memory limit breached.

---

> This concludes the Level 3 Architecture Definition. The engine is now structurally decoupled through strict contracts, ensuring future implementations (ARCore, SceneView, Custom Renderers) can be cleanly swapped without breaking business logic.
