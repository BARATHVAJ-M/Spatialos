# Third-Party Notices

This file contains licensing and attribution notices for open-source repositories and libraries whose algorithms, architectures, or concepts influenced or were adapted into the SpatialOS AR Engine.

## AR.js
- **Repository URL**: https://github.com/AR-js-org/AR.js
- **License**: MIT License
- **Usage**: Reference material for QR pose estimation, world tracking concepts, and anchor lifecycle management. No raw source code copied; algorithms adapted to SpatialOS native Dart/Flutter abstractions.

## sceneview
- **Repository URL**: https://github.com/SceneView/sceneview-android
- **License**: Apache License 2.0
- **Usage**: Architectural reference for integrating native 3D rendering (`sceneform` / `filament` equivalents) with mobile surfaces. Influenced the design of `ITrackingProvider` and `IRenderer` interfaces.

## webxr-samples
- **Repository URL**: https://github.com/immersive-web/webxr-samples
- **License**: Apache License 2.0
- **Usage**: Used as a conceptual model for spatial anchoring and device pose matrices. Influenced the spatial mathematics within `SpatialTransform`.
