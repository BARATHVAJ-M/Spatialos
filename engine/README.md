# SpatialOS XR Engine

> **Mission**: Build an industrial-grade, hardware-backed 3D Spatial Engine with real Visual-Inertial Odometry (6-DoF SLAM), real surface plane detection, physical anchor locking, and Physically Based 3D Rendering (PBR).

---

## 🏗️ Technical Stack
* **Tracking & SLAM Provider**: Google ARCore Android SDK
  * 6-DoF camera pose estimation ($X, Y, Z$ translation + Quaternion rotation)
  * Real horizontal & vertical plane detection ($Ax + By + Cz + D = 0$)
  * Hit-testing against real surfaces
  * Persistent world anchors ($T_{\text{world\_model}} = T_{\text{world\_anchor}} \times T_{\text{anchor\_model}}$)
* **3D Graphics & Rendering**: Google Filament / SceneView (Kotlin)
  * Physically Based Rendering (PBR)
  * Real-time GLB / glTF 2.0 loader
  * Direct camera projection matrix synchronization
  * Hierarchical scene graph (enabling sub-part manipulation & disassembly in Phase 2)
* **Hand Tracking (Phase 2)**: Google MediaPipe Tasks Vision
  * 21 hand landmarks processed on ARCore camera frames asynchronously
  * Normalized pinch ratio: $\text{distance}(\text{thumb}, \text{index}) / \text{palmWidth}$
  * Two-hand scale, rotation, and translation

---

## 🎯 Phase 1 Objectives
1. **Real-Time Environment Tracking**: Move around a room; the camera calculates real Euclidean world positions without screen-pixel approximations.
2. **Surface Plane Detection & Reticle**: Visually detect physical floors and tables; project a 3D placement reticle that hugs the floor.
3. **Rock-Solid Anchor Locking**: Tap to place a `.glb` model. Walk around it $360^\circ$, step back 5 meters, crouch down. The model stays permanently pinned in real space with zero drift or sliding.
4. **Hierarchical Part Access**: Prepare the model scene graph so parts can be programmatically selected, highlighted, and exploded in Phase 2.

