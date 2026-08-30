# SpatialOS AR Engine Architecture Specification
## Level 4: Data Models

This document strictly defines the Level 4 Data Models for the SpatialOS AR Engine. It establishes the abstract Data Transfer Objects (DTOs) that flow through the Level 3 Contracts. 

---

## 1. DATA MODEL PRINCIPLES
- **Pure DTOs**: Data models contain zero business logic, zero rendering logic, and zero hardware tracking logic.
- **Immutability**: Models should be immutable where possible. State changes occur by emitting new model instances or via controlled manager updates, not by silently mutating properties.
- **Serialization**: All models must be strictly serializable (JSON/Binary) to support Network and Cache boundaries.
- **Technology Independent**: Models do not depend on Flutter, ARCore, Unity, or SceneView types (e.g., no direct `ARNode` or `Vector3` from specific 3rd party packages in the core definitions). 

---

## 2. SPATIAL & TRANSFORM MODELS

### `Vector3` / `Vector4` (Conceptual)
Pure mathematical representations of space.
- `Vector3`: (x, y, z) for position and scale.
- `Vector4`: (x, y, z, w) for quaternion rotation.

### `Transform3D`
- **Purpose**: Represents a 6DoF (Degrees of Freedom) location in 3D space relative to its parent.
- **Properties**:
  - `position`: Vector3 (Translation in meters)
  - `rotation`: Vector4 (Quaternion rotation)
  - `scale`: Vector3 (Scale multipliers)
- **Serialization**: `toJson()`, `fromJson()`

### `SpatialPose`
- **Purpose**: Represents an absolute tracking pose provided by the World Tracker.
- **Properties**:
  - `transform`: Transform3D
  - `timestamp`: DateTime
  - `trackingConfidence`: Enum (HIGH, MEDIUM, LOW, FAILED)

### `SpatialAnchor`
- **Purpose**: A persisted point in physical space.
- **Properties**:
  - `id`: String (Unique Anchor ID)
  - `transform`: Transform3D
  - `isResolved`: Boolean

---

## 3. SCENE & OBJECT MODELS (Spatial Nodes)

Every logical object in the scene inherits from a base Spatial Node definition.

### `ISpatialNodeData` (Base Model)
- **Properties**:
  - `id`: String (Unique Object ID)
  - `parentId`: String (ID of parent node, or null for root)
  - `type`: String (Node Type Identifier)
  - `localTransform`: Transform3D
  - `isVisible`: Boolean
  - `isEnabled`: Boolean
  - `metadata`: Map<String, dynamic> (Custom payload)

### `PlaneNodeData`
- **Extends**: ISpatialNodeData
- **Properties**:
  - `physicalWidth`: Double (meters)
  - `physicalLength`: Double (meters)
  - `alignment`: Enum (HORIZONTAL_UP, VERTICAL, etc.)

### `ImageNodeData`
- **Extends**: ISpatialNodeData
- **Properties**:
  - `assetUrl`: String (Remote or local path)
  - `physicalWidth`: Double (meters)

### `VideoNodeData`
- **Extends**: ISpatialNodeData
- **Properties**:
  - `assetUrl`: String
  - `autoPlay`: Boolean
  - `loop`: Boolean

### `Model3DNodeData`
- **Extends**: ISpatialNodeData
- **Properties**:
  - `assetUrl`: String (GLTF/GLB path)
  - `animationState`: String (Current animation playing)

### `MiniAppNodeData`
- **Extends**: ISpatialNodeData
- **Properties**:
  - `appId`: String (Registry ID of the Mini App)
  - `entryRoute`: String
  - `initialPayload`: Map<String, dynamic>

---

## 4. DETECTION MODELS

### `DetectionResult`
- **Purpose**: Data emitted when a physical trigger is found.
- **Properties**:
  - `detectionId`: String
  - `type`: Enum (QR, IMAGE, PLANE, OBJECT)
  - `confidence`: Double (0.0 to 1.0)
  - `pose`: SpatialPose
  - `timestamp`: DateTime

### `QRDetectionPayload`
- **Extends**: DetectionResult
- **Properties**:
  - `payload`: String (The decoded text/URL of the QR code)

---

## 5. INTERACTION MODELS

### `InteractionEventPayload`
- **Purpose**: Data emitted when a user interacts with a spatial object.
- **Properties**:
  - `targetNodeId`: String
  - `interactionType`: Enum (TAP, DOUBLE_TAP, LONG_PRESS, DRAG, SWIPE)
  - `impactPoint`: Vector3 (The exact 3D coordinate of the hit)
  - `timestamp`: DateTime

---

## 6. ASSET & CACHE MODELS

### `AssetManifest`
- **Purpose**: Defines a downloadable binary asset.
- **Properties**:
  - `assetId`: String
  - `url`: String
  - `checksum`: String (Hash for validation)
  - `sizeBytes`: Integer
  - `type`: Enum (IMAGE, VIDEO, MODEL_3D)

### `CacheEntry`
- **Properties**:
  - `key`: String
  - `localPath`: String
  - `expiration`: DateTime
  - `lastAccessed`: DateTime

---

## 7. MINI-APP & SERVICE MODELS

### `MiniAppManifest`
- **Purpose**: Registration data for a Mini App.
- **Properties**:
  - `appId`: String
  - `version`: String
  - `name`: String
  - `permissionsRequired`: List<String>
  - `entryPoint`: String

### `ServiceRequest`
- **Purpose**: Standardized request payload from a Mini App to a Service.
- **Properties**:
  - `requestId`: String
  - `requestingAppId`: String
  - `targetService`: String
  - `action`: String
  - `payload`: Map<String, dynamic>

### `ServiceResponse`
- **Purpose**: Standardized response payload.
- **Properties**:
  - `requestId`: String
  - `isSuccess`: Boolean
  - `data`: Map<String, dynamic>
  - `errorCode`: String?
  - `errorMessage`: String?

---

## 8. ERROR MODELS

### `EngineErrorData`
- **Purpose**: Standardized error tracking payload.
- **Properties**:
  - `errorId`: String
  - `timestamp`: DateTime
  - `sourceModule`: String
  - `severity`: Enum (INFO, WARNING, FATAL)
  - `message`: String
  - `stackTrace`: String?
  - `isRecoverable`: Boolean

---

## 9. SPATIAL ENVIRONMENT MODEL

### `SpatialEnvironment`
- **Purpose**: The master DTO representing an entire saved physical room or experience. It is the core payload downloaded from the backend upon localizing.
- **Properties**:
  - `environmentId`: String
  - `name`: String
  - `qrTriggerPayload`: String (The QR that anchors this room)
  - `rootOrigin`: Transform3D (The absolute origin)
  - `nodes`: List<ISpatialNodeData> (A flat list of all nodes to be reconstructed into a tree via `parentId`)
  - `assets`: List<AssetManifest> (Required assets to download)

---

> This concludes the Level 4 Architecture Definition. By strictly defining these Data Models, we ensure that all modules share a common, serializable language that contains absolutely no implementation logic, perfectly preserving the architectural boundaries defined in Levels 1-3.
