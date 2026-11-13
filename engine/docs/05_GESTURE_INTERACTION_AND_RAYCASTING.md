# Module 05: Gesture Interaction, Raycasting & Spatial Math

> **Official Documentation & Technical Sources**:
> - [Real-Time 3D Computer Graphics Mathematics](https://www.khronos.org/opengl/wiki/GluUnProject_replace)
> - [Ray-Box Intersection Algorithms (Smits / Williams et al.)](https://www.scratchapixel.com/lessons/3d-basic-rendering/minimal-ray-tracer-rendering-simple-shapes/ray-box-intersection.html)
> - [Interaction Design: Spatial Hysteresis and Gesture State Machines](https://developer.android.com/design/ui/mobile/guides/patterns/gestures)

---

## 1. Coordinate Space Bridging: 2D Screen Ray to 3D World Ray

MediaPipe detects fingertips in 2D normalized camera coordinates $[0.0, 1.0]$. The engine must convert this point into a continuous 3D mathematical ray cast from the camera lens into the real world.

```
Fingertip (u, v) in Camera Image
               │
               ▼ Step 1: Compensate for Display Rotation & Crop
Fingertip (x_screen, y_screen) in Viewport Pixels
               │
               ▼ Step 2: Convert to Normalized Device Coordinates (NDC)
[-1.0 .. +1.0] in X, Y, Z
               │
               ▼ Step 3: Unproject using (ProjectionMatrix * ViewMatrix)^-1
3D World Ray: Origin (Camera Position) + Direction Vector
```

### Unprojection Algorithm (The Math)
1. **Convert to NDC**:
   $$x_{\text{ndc}} = \frac{2 \cdot x_{\text{viewport}}}{W_{\text{viewport}}} - 1, \qquad y_{\text{ndc}} = 1 - \frac{2 \cdot y_{\text{viewport}}}{H_{\text{viewport}}}$$
2. **Invert the View-Projection Matrix**:
   $$M_{\text{inv}} = (P_{\text{projection}} \times V_{\text{view}})^{-1}$$
3. **Compute Ray in World Space**:
   * Near Point (at depth 0): $\vec{P}_{\text{near}} = M_{\text{inv}} \times [x_{\text{ndc}}, y_{\text{ndc}}, -1, 1]^T$
   * Far Point (at depth 1): $\vec{P}_{\text{far}} = M_{\text{inv}} \times [x_{\text{ndc}}, y_{\text{ndc}}, +1, 1]^T$
   * Dehomogenize by dividing by $W$: $\vec{p} = \frac{\vec{P}_{xyz}}{P_w}$
   * **Ray Origin**: $\vec{R}_{\text{origin}} = \vec{p}_{\text{near}}$
   * **Ray Direction**: $\hat{d} = \text{normalize}(\vec{p}_{\text{far}} - \vec{p}_{\text{near}})$

---

## 2. Ray-Object Intersection: Oriented Bounding Box (OBB)

To determine whether the user is pinching *at the model* or in empty air, the ray $\vec{r}(t) = \vec{R}_{\text{origin}} + t \cdot \hat{d}$ is tested against the model's 3D Oriented Bounding Box using the **Slab Method**:

```kotlin
fun rayIntersectsOBB(ray: Ray, box: Box, modelMatrix: FloatArray): Boolean {
    // 1. Transform ray from World space into Model's local coordinate space
    val invModel = invert(modelMatrix)
    val localRay = ray.transform(invModel)

    // 2. Test intersection against Axis-Aligned Bounding Box (AABB) in local space
    val tMin = (box.min - localRay.origin) / localRay.direction
    val tMax = (box.max - localRay.origin) / localRay.direction

    val t1 = min(tMin, tMax)
    val t2 = max(tMin, tMax)

    val tNear = maxOf(t1.x, t1.y, t1.z)
    val tFar = minOf(t2.x, t2.y, t2.z)

    return tNear <= tFar && tFar >= 0.0f
}
```

---

## 3. Anatomically Normalized Pinch Math

### The Flaw of Pixel Thresholds
A hardcoded distance (e.g., $30\text{ pixels}$) fails in AR:
* A child's hand is physically smaller than an adult's hand.
* A hand $30\text{ cm}$ from the camera appears 4× larger than a hand $1.5\text{ m}$ away.

### Normalized Solution: Anatomical Hand Ratio
We normalize the distance between the thumb tip and index finger tip against the user's **Palm Reference Measurement** (distance between index knuckle and pinky knuckle):
$$\text{pinchRatio} = \frac{\|\vec{P}_{\text{THUMB\_TIP}} - \vec{P}_{\text{INDEX\_FINGER\_TIP}}\|}{\|\vec{P}_{\text{INDEX\_MCP}} - \vec{P}_{\text{PINKY\_MCP}}\|}$$

### Hysteresis Thresholding (Anti-Jitter)
To prevent the model from rapidly switching between pinched and released states when a user's fingers hover near the trigger point:
* **Trigger Pinch (Start)**: When $\text{pinchRatio} \le 0.28$.
* **Release Pinch (End)**: When $\text{pinchRatio} \ge 0.42$.

---

## 4. Multi-Hand Gestures: Scale, Rotate, Translate

### Gesture A: Single-Hand Drag (Orbit & Rotate)
* When one hand pinches while the ray hits the model:
  $$\Delta \theta_{\text{yaw}} = (x_{\text{current}} - x_{\text{start}}) \times K_{\text{rotation}}$$
  $$\Delta \theta_{\text{pitch}} = (y_{\text{current}} - y_{\text{start}}) \times K_{\text{rotation}}$$
* Rotates the 3D model around its local vertical axis.

### Gesture B: Two-Hand Pinch Scaling (Zoom)
* When both hands are detected and both are in a pinch state:
  $$\text{Initial Hand Distance} = D_0 = \|\text{PinchCenter}_1 - \text{PinchCenter}_2\|_0$$
  $$\text{Current Hand Distance} = D_t = \|\text{PinchCenter}_1 - \text{PinchCenter}_2\|_t$$
  $$\text{Scale Multiplier} = S_t = \frac{D_t}{D_0}$$
* Clamp scaling to safe boundaries: $S_{\text{clamped}} = \text{clamp}(S_t, 0.2\times, 5.0\times)$.

### Gesture C: Two-Hand Rotation
* The vector connecting the two pinch centers $\vec{v} = \text{PinchCenter}_2 - \text{PinchCenter}_1$.
* The change in angle $\Delta \phi = \text{atan2}(v_y, v_x)_t - \text{atan2}(v_y, v_x)_0$ rotates the model around the camera-facing axis.

---

## 5. Spatial Interaction State Machine

```
              ┌─────────────────────┐
              │   SEARCHING_SURFACE │
              └──────────┬──────────┘
                         │ Plane Detected
                         ▼
              ┌─────────────────────┐
              │   SURFACE_FOUND     │◄─────────┐
              └──────────┬──────────┘          │
                         │ User Tap            │ Reset
                         ▼                     │
              ┌─────────────────────┐          │
              │    MODEL_PLACED     ├──────────┤
              └──────────┬──────────┘          │
                         │ Hand Enters Frame   │
                         ▼                     │
              ┌─────────────────────┐          │
              │    HAND_DETECTED    │          │
              └──────────┬──────────┘          │
                         │ Pinch on Model OBB  │
                         ▼                     │
        ┌──────────────────────────────────┐   │
        │         OBJECT_SELECTED          │   │
        └───────┬──────────────────┬───────┘   │
 One Hand Pinch │                  │ Two Hand  │
                ▼                  ▼ Pinch     │
    ┌──────────────────┐    ┌──────────────────┐
    │ 1-HAND_ORBIT_ROT │    │ 2-HAND_PINCH_SCL │
    └──────────────────┘    └──────────────────┘
```

### Tracking Loss Rule: Freeze Transform
If hand detection is lost for $< 500\text{ ms}$, **do not jump the model to zero**. Freeze its last valid transform. If tracking returns, resume from that frozen state without sudden popping.

---

## 6. How This Module Helps Our Engine

| Challenge in SpatialOS | How This Module Solves It |
| :--- | :--- |
| **Inaccurate Taps in 3D Space** | Viewport unprojection converts 2D finger points into continuous 3D rays that test against the actual 3D bounding box of the engine. |
| **Pinch Flutter & Vibration** | Hysteresis thresholds ($0.28$ to trigger, $0.42$ to release) eliminate rapid vibrating between selected and unselected states. |
| **Hand-Size Invariance** | Normalizing against palm width guarantees pinch gestures work identically for small and large hands at different camera distances. |
| **Two-Hand Control** | Provides natural, physical scaling and rotation identical to interacting with real mechanical parts. |

