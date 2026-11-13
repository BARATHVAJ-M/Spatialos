# Module 04: Hand Tracking & Asynchronous Inference (Google MediaPipe)

> **Official Documentation Sources**:
> - [Google MediaPipe Tasks Vision: Hand Landmarker](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)
> - [MediaPipe Hand Landmarker Android Guide](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker/android)
> - [MediaPipe 21 Hand Landmarks Topology Reference](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker#models)

---

## 1. MediaPipe Tasks Vision Architecture

### Two-Stage Machine Learning Pipeline
MediaPipe’s Hand Landmarker uses a high-speed, two-stage deep neural network optimized for mobile GPUs and NPUs:
1. **Palm Detector (BlazePalm)**: Operates on the full camera image to identify oriented hand bounding boxes. Once a hand is detected, this detector is skipped in subsequent frames until tracking is lost.
2. **Hand Landmarker Model**: Crops the hand region and predicts the exact 3D coordinates of **21 anatomical landmarks** along with handedness (Left vs. Right) and presence confidence.

---

## 2. The 21 Hand Landmarks Topology

Every detected hand provides an array of 21 keypoints:

```
        8 (INDEX_TIP)    12 (MIDDLE_TIP)   16 (RING_TIP)
        |                      |                 |           20 (PINKY_TIP)
        7 (INDEX_DIP)    11 (MIDDLE_DIP)   15 (RING_DIP)     |
        |                      |                 |           19 (PINKY_DIP)
  4     6 (INDEX_PIP)    10 (MIDDLE_PIP)   14 (RING_PIP)     |
(THUMB) |                      |                 |           18 (PINKY_PIP)
   \    5 (INDEX_MCP)     9 (MIDDLE_MCP)   13 (RING_MCP)     |
    3          \               |                /            17 (PINKY_MCP)
     \          \              |               /            /
      2          \             |              /            /
       \          \____________|_____________/____________/
        1                              |
         \                             |
          0 ───────────────────────────┘ (WRIST)
```

### Landmark Indices Table
| Index | Landmark Name | Anatomical Description | Primary Role in Engine |
| :---: | :--- | :--- | :--- |
| **0** | `WRIST` | Base of the hand / wrist joint | Hand base position |
| **1–4** | `THUMB_CMC`, `MCP`, `IP`, `THUMB_TIP` | Complete thumb skeletal chain | **Landmark 4 (`THUMB_TIP`)** is used for pinch calculation |
| **5–8** | `INDEX_MCP`, `PIP`, `DIP`, `INDEX_TIP` | Index finger skeletal chain | **Landmark 8 (`INDEX_TIP`)** is used for pinch calculation |
| **9–12**| `MIDDLE_MCP`, `PIP`, `DIP`, `MIDDLE_TIP`| Middle finger skeletal chain | Center hand stability |
| **13–16**|`RING_MCP`, `PIP`, `DIP`, `RING_TIP` | Ring finger skeletal chain | Hand posture context |
| **17–20**|`PINKY_MCP`, `PIP`, `DIP`, `PINKY_TIP` | Pinky finger skeletal chain | **Landmark 17 (`PINKY_MCP`)** used for palm width normalization |

---

## 3. `RunningMode.LIVE_STREAM` Implementation

### Asynchronous Execution Pattern
In `RunningMode.LIVE_STREAM`, MediaPipe processes frames on a dedicated background thread pool and invokes an asynchronous callback when inference completes:

```kotlin
val baseOptions = BaseOptions.builder()
    .setModelAssetPath("hand_landmarker.task")
    .setDelegate(Delegate.GPU) // Hardware acceleration
    .build()

val options = HandLandmarker.HandLandmarkerOptions.builder()
    .setBaseOptions(baseOptions)
    .setRunningMode(RunningMode.LIVE_STREAM)
    .setNumHands(2) // Track both hands simultaneously
    .setMinHandDetectionConfidence(0.5f)
    .setMinHandPresenceConfidence(0.5f)
    .setMinTrackingConfidence(0.5f)
    .setResultCallback { result: HandLandmarkerResult, inputImage: MPImage ->
        // Executes on a background worker thread
        gestureController.processLandmarks(result, inputImage.timestamp)
    }
    .setErrorListener { error ->
        Log.e("MediaPipe", "Inference error: ${error.message}")
    }
    .build()

val handLandmarker = HandLandmarker.createFromOptions(context, options)
```

### Monotonically Increasing Timestamps Rule
MediaPipe strictly requires that every frame sent via `detectAsync()` has a millisecond timestamp greater than the preceding frame:
```kotlin
val frameTimestampMs = SystemClock.uptimeMillis()
handLandmarker.detectAsync(mpImage, frameTimestampMs)
```
* Using `System.currentTimeMillis()` can cause negative steps if the system clock synchronizes with NTP. Always use `SystemClock.uptimeMillis()`.

---

## 4. Frame Rate Decoupling (Render Thread Safety)

```
[ ARCore Camera Stream: 60 FPS ]
               │
               ├────────────────────────────────────────┐
               ▼ (Main Render Thread)                   ▼ (Asynchronous Worker Thread)
     [ Filament 3D Draw Loop ]                 [ MediaPipe ML Inference ]
     • 60 FPS sustained                        • Runs at ~20-30 FPS
     • Unstalled, zero wait                    • Drops incoming frame if busy
               ▲                                        │
               └────────── Latest Filtered Pose ────────┘
```

1. **Zero Render Stalls**: If the device GPU/NPU takes $35\text{ ms}$ to process a hand pose, the Filament rendering engine continues drawing the 3D model at $60\text{ FPS}$ without dropping a frame.
2. **Automatic Frame Dropping**: In `LIVE_STREAM` mode, if a new camera frame arrives while MediaPipe is still executing inference on the previous frame, MediaPipe automatically drops the frame, keeping latency near zero.

---

## 5. Normalized vs. World Coordinates

* **`result.landmarks()`**: Returns normalized coordinates where $x \in [0.0, 1.0]$ and $y \in [0.0, 1.0]$ relative to image width and height. $z$ represents landmark depth relative to the wrist.
* **`result.worldLandmarks()`**: Returns metric 3D landmarks in meters centered at the hand's geometric center (not real room space).
* **Rule**: Neither of these coordinates represent ARCore world space. They must be unprojected into an ARCore camera ray (see Module 05).

---

## 6. How This Module Helps Our Engine

| Challenge in SpatialOS | How This Module Solves It |
| :--- | :--- |
| **Touchless Control** | Enables users to interact with floating machinery using their physical hands in front of the camera instead of tapping a 2D glass screen. |
| **Two-Hand Capability** | Supports detecting up to 2 hands at once, enabling two-handed pinch-scaling (zooming) and rotation of 3D models. |
| **Thermal & Battery Protection** | MediaPipe's `LIVE_STREAM` mode drops frames under heavy load and uses GPU delegates, preventing phone overheating during extended AR sessions. |
| **Smooth UI Rendering** | Decoupling inference onto a worker thread guarantees that the 3D graphics loop maintains a buttery 60 FPS. |

