# Module 01: Spatial Tracking, Surface Detection & World Anchors

> **Official Documentation Sources**:
> - [Google ARCore Fundamental Concepts](https://developers.google.com/ar/develop/fundamentals)
> - [ARCore Plane Detection & Environmental Understanding](https://developers.google.com/ar/develop/java/environmental-understanding)
> - [ARCore HitResult & Anchor API Reference](https://developers.google.com/ar/reference/java/com/google/ar/core/Anchor)

---

## 1. Visual-Inertial Odometry (VIO) & SLAM Fundamentals

### How ARCore Tracks Physical Space
ARCore calculates the mobile device's real-time 3D position and orientation (known as its **Pose**) using **Concurrent Visual-Inertial Odometry (VIO)**:
1. **Optical Feature Points**: The rear camera captures frames at $60\text{ Hz}$. Computer vision algorithms identify high-contrast visual features (edges, corners, textured clusters) and track how these points translate across successive camera frames.
2. **Inertial Measurement Unit (IMU)**: Accelerometer and gyroscope hardware sensors sample linear acceleration and angular velocity at high frequencies ($\ge 200\text{ Hz}$).
3. **Sensor Fusion (Extended Kalman Filter)**: By mathematically combining optical shift vectors with integrated inertial measurements, ARCore continuously estimates the phone's Euclidean 6-DoF position $[X, Y, Z]$ in real meters and its orientation as a unit quaternion $[Q_x, Q_y, Q_z, Q_w]$.

### Tracking State Machine
A camera's state can change rapidly based on lighting or rapid device motion. The engine must check `camera.trackingState` before processing world interactions:
* `TrackingState.TRACKING`: Full 6-DoF tracking is active. World coordinates are reliable.
* `TrackingState.PAUSED`: Tracking is temporarily lost (e.g., camera covered or device moved too quickly). **The engine must freeze model transforms** and avoid creating new anchors.
* `TrackingState.STOPPED`: Session has terminated.

```kotlin
val camera = frame.camera
if (camera.trackingState != TrackingState.TRACKING) {
    // Suspend spatial transformations; do not discard anchor
    return
}
```

---

## 2. Surface Plane Detection

### Planar Mathematics
When feature points consistently lie on a common plane, ARCore fits a geometric plane equation:
$$Ax + By + Cz + D = 0$$
Where:
* $[A, B, C]$ represents the plane's normal unit vector $\hat{n}$.
* $D$ represents the plane's perpendicular distance from the coordinate origin.

### Plane Types & Polygon Bounds
* `Plane.Type.HORIZONTAL_UPWARD_FACING`: Floors, carpets, tables, countertops.
* `Plane.Type.HORIZONTAL_DOWNWARD_FACING`: Ceilings, undersides of desks.
* `Plane.Type.VERTICAL`: Walls, doors, whiteboards, cabinet sides.

ARCore provides a 2D convex polygon hull defining the plane's detected physical boundary. To ensure a 3D model is placed strictly on top of a physical surface (and not hanging off an edge in empty space), the engine tests:
```kotlin
val plane = hitResult.trackable as? Plane
if (plane != null && plane.isPoseInPolygon(hitResult.hitPose)) {
    // Valid placement: The point is inside the detected surface boundary
}
```

---

## 3. Hit-Testing & World Anchoring

### Raycasting Physical Surfaces (`Frame.hitTest`)
A hit-test projects a virtual 3D ray from a 2D screen coordinate into the physical environment and returns all intersections with real-world trackables:
```kotlin
// Tap event or center screen reticle raycast
val hitResults: List<HitResult> = frame.hitTest(screenX, screenY)

for (hit in hitResults) {
    val trackable = hit.trackable
    if (trackable is Plane && trackable.isPoseInPolygon(hit.hitPose)) {
        // Valid intersection found on a physical plane
        val anchor: Anchor = hit.createAnchor()
        attachModelToAnchor(anchor)
        break
    }
}
```

### Why World Anchors are Mandatory
* As a user walks through a room, ARCore continuously updates and refines its internal SLAM map.
* If a model is positioned using raw, static coordinates $(x = 0, y = 1, z = -2)$, the model will visibly drift, slide across the floor, or jump when ARCore refines its map.
* An `Anchor` tells ARCore: *"This coordinate is permanently attached to this physical spot."* ARCore automatically applies internal correction matrices so the visual object remains stationary in physical reality.

### Pose Transform Composition
The model's world-space transformation matrix is computed as:
$$T_{\text{world\_model}} = T_{\text{world\_anchor}} \times T_{\text{anchor\_model}}$$
Where:
* $T_{\text{world\_anchor}}$ is the dynamically corrected $4 \times 4$ pose matrix provided by ARCore.
* $T_{\text{anchor\_model}}$ is the model's local translation, rotation, and scale relative to its anchor.

---

## 4. How This Module Helps Our Engine

| Challenge in SpatialOS | How This Module Solves It |
| :--- | :--- |
| **Old Prototype Drift** | The old prototype used 2D screen projections that slid across the display when moving the camera. This module uses hardware VIO to keep the model locked to Euclidean space. |
| **Realistic Floor Placement** | Plane detection finds the actual floor elevation, ensuring an engine model sits firmly on the ground or workbench rather than hovering or clipping through surfaces. |
| **$360^\circ$ Walk-Around Inspection** | Anchors compensate for SLAM loop-closures and map adjustments, allowing the user to walk $360^\circ$ around an engine block without it wobbling or displacing. |
| **Placement Reticle** | Casting continuous hit-tests from the center of the camera screen allows drawing a 3D alignment ring that glides smoothly across floors and tables before the user confirms placement. |

