# Module 03: Physically Based 3D Rendering (Google Filament & gltfio)

> **Official Documentation Sources**:
> - [Google Filament Engine Documentation](https://google.github.io/filament/)
> - [Filament gltfio Library Reference](https://google.github.io/filament/gltfio.html)
> - [Khronos glTF 2.0 Specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)

---

## 1. Filament Engine Architecture & ECS

### What is Filament?
**Filament** is a real-time, physically based rendering (PBR) engine developed by Google for Android, Linux, macOS, and WebGL. It is designed specifically for mobile hardware to deliver high-performance visual fidelity with minimal CPU/GPU overhead.

### Entity-Component-System (ECS) Architecture
Filament avoids monolithic scene graph classes. Instead, every visual object is an **Entity** (a simple integer ID):
* **`Engine`**: The central factory that allocates and manages all GPU resources, materials, textures, and entities.
* **`Scene`**: A container holding entities to be rendered together.
* **`View`**: Defines a rendering viewport, camera parameters, post-processing effects, and shadow options.
* **`Renderer`**: Orchestrates the frame draw loop on the GPU surface.

### Core Managers
* **`TransformManager`**: Manages $4 \times 4$ transformation matrices for entities, supporting parent-child hierarchies in local and world space.
* **`RenderableManager`**: Attaches vertex buffers, index buffers, primitive topologies, materials, and bounding boxes to an entity to make it visible.

---

## 2. glTF 2.0 / GLB Ingestion via `gltfio`

### Why GLB?
glTF 2.0 binary (`.glb`) packages 3D geometry meshes, PBR material parameters, skeleton rigs, animations, and binary texture buffers (PNG/JPEG/KTX2) into a **single self-contained binary file**.

### Loading Pipeline using `AssetLoader`
`gltfio` parses GLB files and directly instantiates Filament entities:
```kotlin
// 1. Initialize Loader with Engine and Material Provider
val materialProvider = UbershaderProvider(engine)
val assetLoader = AssetLoader(engine, materialProvider, EntityManager.get())

// 2. Parse binary buffer into FilamentAsset
val asset: FilamentAsset = assetLoader.createAsset(glbByteBuffer)
    ?: throw IllegalStateException("Failed to parse GLB model")

// 3. Populate GPU textures and buffers
val resourceLoader = ResourceLoader(engine)
resourceLoader.asyncBeginLoad(asset)

// 4. Add root entities to the active Scene
scene.addEntities(asset.entities)
```

### Instancing with `FilamentInstance`
When loading a model that appears multiple times (or instantiating sub-assemblies):
* `FilamentAsset`: Owns the heavy GPU vertex arrays and textures.
* `FilamentInstance`: Represents an independent transform hierarchy. You can render multiple copies of a model at different room locations with zero texture/mesh memory duplication.

---

## 3. Physically Based Shading & Lighting (PBR)

### Metallic-Roughness Shading Model
Filament uses the standard microfacet Cook-Torrance specular BRDF:
1. **Base Color (Albedo)**: Represents diffuse color for dielectrics, or specular reflectance for pure metals.
2. **Roughness**: Measures microscopic surface roughness. A roughness of $0.0$ represents a mirror; $1.0$ represents completely diffuse matte chalk.
3. **Metallic**: Defines whether a surface is an electrical conductor (metal = $1.0$) or an insulator (dielectric = $0.0$).
4. **Normal Mapping**: Simulates micro-surface details (bolts, grooves, seams) without adding extra polygon vertices.

### Environmental Image-Based Lighting (IBL)
To blend virtual models realistically into physical rooms:
* An **Indirect Light** component provides diffuse irradiance and specular radiance calculated from spherical harmonics.
* A directional light casts dynamic, sharp contact shadows onto a transparent shadow-catcher plane on the floor beneath the model.

---

## 4. Real-World Metric Scaling

### glTF Standard Units
According to the Khronos glTF specification:
$$\text{Standard Unit of Length} = 1.0\text{ meter}$$
* If an engineering model of a car engine is authored at $0.8\text{ m} \times 0.6\text{ m} \times 0.7\text{ m}$, Filament renders it at that exact physical scale in the room.
* **No Arbitrary Resizing**: The engine preserves the true authored dimensions. A reset button allows returning to $1.0\times$ true scale after a user inspects it.

### Calculating Bounding Boxes
```kotlin
val boundingBox: Box = asset.boundingBox
val center = boundingBox.center
val halfExtent = boundingBox.halfExtent

val widthMeters = halfExtent[0] * 2f
val heightMeters = halfExtent[1] * 2f
val depthMeters = halfExtent[2] * 2f
```

---

## 5. How This Module Helps Our Engine

| Challenge in SpatialOS | How This Module Solves It |
| :--- | :--- |
| **Photorealism on Mobile** | Filament uses production-grade PBR shaders, making machine parts (brushed steel, aluminum, rubber) look real in mobile AR without draining the battery. |
| **Efficient Model Ingestion** | `gltfio` loads `.glb` files asynchronously directly from binary memory without needing custom file format parsers or manual OpenGL vertex buffer code. |
| **Hierarchy Access** | Exposes individual part entities via `asset.entities`, enabling Phase 2 to isolate sub-parts (pistons, cylinder head) for disassembly and exploded views. |
| **Ground Shadows** | Filament renders contact shadows onto the detected floor surface, visually grounding the 3D model so it does not look like it is floating in air. |

