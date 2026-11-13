# AR Spatial Math & Engine Binding

This document outlines the critical bridge between the backend database and the frontend Flutter AR engines (ARCore / ARKit). It explains how SpatialOS translates relational PostgreSQL records into the dynamic 3D objects and interactive widgets painted onto the real world.

---

## 1. The Spatial Node Architecture
At the core of the AR system is the `SpatialNode` Prisma model. A Spatial Node represents a physical anchor in the real world relative to the scanned QR code.

The backend stores a 9-axis coordinate system for every node:
*   **Position (`positionX`, `positionY`, `positionZ`)**: Floating-point values representing distance in meters from the QR anchor center.
*   **Rotation (`rotationX`, `rotationY`, `rotationZ`)**: Angular rotation. (While currently captured as Euler angles, the frontend engine handles the complex Quaternion math required to prevent gimbal lock).
*   **Scale (`scaleX`, `scaleY`, `scaleZ`)**: Multiplier values indicating the physical size of the object in the AR space.

Each `SpatialNode` acts as a placeholder that binds to a specific `ServiceInstance` (the actual content or app).

---

## 2. The Placements Pipeline (`placements.controller.ts`)
When a user scans a physical QR code with the SpatialOS mobile app, the app makes an unauthenticated `GET` request to `/placements/preview?qrCode=<ID>`.

The backend controller executes the following resolution pipeline:
1.  **Anchor Identification**: It searches the database for a `Place` that matches the `qrTargetId`.
2.  **Experience Resolution**: It fetches the *only* `PUBLISHED` AR `Experience` currently assigned to that `Place`.
3.  **Data Hydration**: It pulls all `SpatialNodes` and `ServiceInstances` attached to that specific version of the Experience.
4.  **Temporal Filtering**: The backend inspects the `configuration.publishAt` and `configuration.expiresAt` JSON properties of the services. If an object is scheduled for the future or has expired, it is stripped from the payload entirely, ensuring the mobile app never wastes RAM rendering expired nodes.

---

## 3. Cross-Platform Translation (Backend -> Flutter)
The backend does not send raw database rows to the mobile app. Instead, `placements.controller.ts` maps the relational data into a flat, highly optimized JSON array expected by the Flutter `ARContentModel`.

### The Transform Block
Database floats are mapped into a unified `transform` object that the Flutter engine can instantly consume:
```json
"transform": {
  "id": "trans-1234",
  "positionX": 1.5,
  "positionY": 0.0,
  "positionZ": -2.0,
  "rotationX": 0,
  "rotationY": 0,
  "rotationZ": 0,
  "scaleX": 1,
  "scaleY": 1,
  "scaleZ": 1,
  "anchorType": "PLANE_WALL"
}
```

### Node Type Translation
The backend translates its internal `nodeType` into a `contentType` the frontend understands:
*   `nodeType: 'MEDIA'` -> `contentType: 'MEDIA'` (Static images or videos)
*   `nodeType: 'UI_PANEL'` -> `contentType: 'MINIAPP'` (Interactive Flutter Widgets)

---

## 4. Dynamic "MiniApp" Resolution
SpatialOS is unique because it allows generic 3D planes to spawn full, interactive applications (MiniApps) in AR space.

When mapping a `UI_PANEL` node, the backend dynamically resolves *which* app to draw based on the `ServiceDefinition` attached to it. It constructs a `state` object holding the configuration payload.

**Examples of Backend Resolution:**

*   **Classroom App**: 
    If the Service Name is `'Classroom'`, the backend maps it to `appId: 'CLASSROOM'`. The Flutter factory sees this and inflates the Classroom Flutter Widget in 3D space.
*   **Notice Board**: 
    If it's a `'Notice Board'`, the backend extracts the nested `pages`, `bgColor`, and `title` from the JSON configuration and passes it into the state payload.
*   **Complaint Box**: 
    If it's a `'Complaint Box'`, the backend sets `appId: 'COMPLAINT_BOX'` and passes the `googleFormUrl` into the state so the frontend can launch a webview inside the AR world.

By tightly controlling this translation layer, the backend dictates exactly what the AR engine draws without requiring any complex logic on the mobile device.
