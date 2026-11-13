# Module 02: Camera Pipeline, Frame Sharing & Matrix Synchronization

> **Official Documentation Sources**:
> - [Google ARCore Camera API Reference](https://developers.google.com/ar/reference/java/com/google/ar/core/Camera)
> - [ARCore CPU Image Access: Frame.acquireCameraImage()](https://developers.google.com/ar/reference/java/com/google/ar/core/Frame#acquireCameraImage())
> - [Android Camera2 / NDK Image Format Specification](https://developer.android.com/reference/android/graphics/ImageFormat#YUV_420_888)

---

## 1. The Single Camera Ownership Rule

### The Architectural Conflict
On mobile Android hardware, the underlying Camera HAL (Hardware Abstraction Layer) strictly enforces **mutual exclusion on physical camera sensors**.
* If an AR engine initializes an ARCore session to capture camera frames for 6-DoF tracking, ARCore locks the physical rear camera sensor.
* If a secondary library (e.g., CameraX, OpenCV, or an independent MediaPipe camera stream) attempts to open the same physical camera, the Android OS throws `CameraAccessException (CAMERA_IN_USE)` or causes the app to crash.

### The Solution: Shared Frame Extraction
ARCore must remain the **sole owner** of the physical rear camera. To feed frames into MediaPipe for hand tracking, we acquire the raw CPU camera frame directly from the active ARCore `Frame` buffer each tick.

---

## 2. CPU Image Acquisition: `acquireCameraImage()`

### Image Format & Pixel Layout
ARCore provides access to the raw uncompressed video frame via `frame.acquireCameraImage()`. The image is delivered in **`ImageFormat.YUV_420_888`**:
* **Y-plane (Luminance)**: Full resolution grayscale intensity data.
* **U-plane & V-plane (Chrominance)**: Subsampled by a factor of 2 horizontally and vertically.

### Strict Resource Management & Lifecycle
```kotlin
try {
    val image: Image = frame.acquireCameraImage()
    try {
        // Send frame asynchronously to MediaPipe hand tracking pipeline
        mediaPipeBridge.processFrame(image, SystemClock.uptimeMillis())
    } finally {
        // CRITICAL: Always release the buffer lock immediately
        image.close()
    }
} catch (e: NotYetAvailableException) {
    // Normal behavior during session startup or heavy frame drops; skip frame
} catch (e: DeadlineExceededException) {
    // Frame is stale; discard
} catch (e: ResourceExhaustedException) {
    // Too many images acquired without closing; throttle consumption
    Log.w("CameraPipeline", "CPU Image buffer pool exhausted")
}
```

### Critical Rules for Frame Sharing:
1. **Never Block on the Main Thread**: Image buffer conversion must occur off the main rendering thread.
2. **Immediate Buffer Close**: If `image.close()` is not called within $1\text{ to }2\text{ frames}$, ARCore's internal buffer pool (typically 3–4 frames deep) starves, freezing the camera stream completely.
3. **Handle Startup Latency**: `NotYetAvailableException` is routinely thrown for the first 5–10 frames while the camera sensor warms up.

---

## 3. Optical Matrix Synchronization

To render 3D models over the camera video background without sliding or perspective distortion, the 3D graphics engine's virtual camera must clone the physical camera's exact focal length, principal point, and field of view.

### View Matrix (`Camera.getViewMatrix`)
Transforms vertices from world space coordinates into camera-relative eye coordinates:
```kotlin
val viewMatrix = FloatArray(16)
camera.getViewMatrix(viewMatrix, 0)
```
* **Mathematical Definition**: The view matrix $V$ is the exact inverse of the camera's world pose matrix $M_{\text{camera}}$:
  $$V = (M_{\text{camera}})^{-1}$$

### Projection Matrix (`Camera.getProjectionMatrix`)
Transforms eye-space coordinates into Normalized Device Coordinates (NDC) / clip space:
```kotlin
val projectionMatrix = FloatArray(16)
camera.getProjectionMatrix(
    projectionMatrix, 
    offset = 0, 
    nearPlane = 0.1f,   // 10 cm minimum clipping boundary
    farPlane = 50.0f    // 50 meters maximum depth boundary
)
```
* **Intrinsics Adaptation**: ARCore dynamically updates this matrix every frame to compensate for:
  1. Physical camera lens distortion.
  2. Display resolution and aspect ratio (e.g., $16:9$, $20:9$).
  3. Screen orientation changes (Portrait $\leftrightarrow$ Landscape).

### Complete Vertex Rendering Formula
For any 3D vertex $P_{\text{local}}$ inside a GLB model attached to an anchor:
$$P_{\text{clip}} = P_{\text{projection}} \times V_{\text{view}} \times T_{\text{world\_anchor}} \times T_{\text{anchor\_model}} \times P_{\text{local}}$$

---

## 4. How This Module Helps Our Engine

| Challenge in SpatialOS | How This Module Solves It |
| :--- | :--- |
| **Dual-Camera Crash** | Solves the conflict between AR tracking and MediaPipe hand tracking by feeding ARCore's CPU frames into MediaPipe without opening a second camera session. |
| **Perspective Warping** | Eliminates visual stretching when the user rotates their phone between portrait and landscape by using ARCore's hardware-synchronized projection matrix. |
| **Memory Leaks & Freezes** | Implements strict `try-finally` lifecycle management around `acquireCameraImage()`, preventing `ResourceExhaustedException` and camera thread deadlocks. |
| **Optical Alignment** | Ensures that virtual 3D models appear to share the exact focal length and perspective of the physical smartphone camera lens. |

