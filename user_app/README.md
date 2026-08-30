# SpatialOS AR Engine (User App)

The **User App** is the mobile Augmented Reality engine for SpatialOS. It allows users to physically walk through the real world, scan spatial anchors (Places), and interact with 3D models and micro-apps (Services) deployed by the administrators.

## 🚀 Technology Stack
- **Framework:** Flutter (Dart)
- **AR Capabilities:** ARCore (Android) / ARKit (iOS) wrapper
- **State Management:** Riverpod / Provider (Custom architecture)
- **Local Storage:** Flutter Secure Storage (JWT/Caching)

## 🏗️ Core Responsibilities

1. **Spatial Tracking & QR Calibration**
   Uses the device's camera to establish an AR session. Scanning a physical SpatialOS QR code anchors the digital coordinate system to that exact real-world point.
2. **Dynamic Rendering (Experiences)**
   Fetches the "Scene Graph" from the Backend and renders objects (3D Models, Video Planes, and interactive Flutter Widgets) into the physical world at precise X, Y, Z coordinates.
3. **Binary Asset Caching**
   Optimized to cache heavy 3D assets and video files as binary data in local storage. This prevents frame drops and stops the app from downloading the same asset twice when walking around a Place.
4. **Interactive Services**
   Renders digital micro-apps (like Notice Boards or Menus) on physical walls that users can touch, scroll, and interact with in 3D space.

## 💻 Development
```bash
# Get Flutter dependencies
flutter pub get

# Run on a connected physical device (required for AR camera access)
flutter run
```
Note: AR features will crash on a standard emulator. You must build and run this app on a physical Android or iOS device with camera permissions enabled.
