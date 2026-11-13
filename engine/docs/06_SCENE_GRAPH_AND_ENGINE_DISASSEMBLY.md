# Module 06: Scene Graph Architecture & Engine Disassembly (Exploded Views)

> **Official Documentation Sources**:
> - [Khronos glTF 2.0 Specification: Nodes and Hierarchy](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#nodes-and-hierarchy)
> - [Khronos glTF 2.0 Coordinate Systems and Units](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#coordinate-system-and-units)
> - [Filament TransformManager & Entity Hierarchy](https://google.github.io/filament/Filament.html#filament::TransformManager)

---

## 1. glTF 2.0 Scene Graph Tree Structure

A complex 3D mechanical model (e.g., an internal combustion engine or transmission) is not a single fused mesh. According to the glTF 2.0 specification, it is structured as a **Hierarchical Scene Graph Tree**:

```
[ Root_Engine_Assembly ]
 │
 ├── [ Engine_Block ]
 │     ├── [ Oil_Pan ]
 │     └── [ Crankshaft ]
 │
 └── [ Cylinder_Head ]
       ├── [ Valve_Cover ]
       ├── [ Camshaft_Exhaust ]
       ├── [ Camshaft_Intake ]
       └── [ Pistons_Group ]
             ├── [ Piston_Cylinder_1 ]
             ├── [ Piston_Cylinder_2 ]
             ├── [ Piston_Cylinder_3 ]
             └── [ Piston_Cylinder_4 ]
```

### Key glTF Structural Properties
* **`nodes`**: The building blocks of the scene. Each node has a numeric index, an optional `name` (e.g., `"Piston_1"`), a list of `children` node indices, and an attached `mesh`.
* **Right-Handed Coordinate System**:
  * $+X$: Points right.
  * $+Y$: Points up.
  * $+Z$: Points out of the screen (forward toward viewer).
  * Units: Strictly **meters**.

---

## 2. Local vs. Global Transformation Composition

### Local Transformation Matrix
Every node specifies its position relative to its immediate parent using either a $4 \times 4$ column-major matrix or separate **Translation ($T$)**, **Rotation ($R$)**, and **Scale ($S$)** properties:
$$M_{\text{local}} = T \times R \times S$$
* Where:
  * $T$ is derived from vector `[tx, ty, tz]`.
  * $R$ is derived from unit quaternion `[qx, qy, qz, qw]`.
  * $S$ is derived from scale vector `[sx, sy, sz]`.

### Global Matrix Accumulation
The absolute world-space position of any sub-component (e.g., `Piston_Cylinder_1`) is computed by multiplying all transform matrices from the root down to that leaf node:
$$M_{\text{world\_piston}} = M_{\text{root}} \times M_{\text{cylinder\_head}} \times M_{\text{pistons\_group}} \times M_{\text{piston\_1}}$$

* **Benefit of Tree Hierarchy**: If the user rotates or scales the entire `Root_Engine_Assembly`, every individual screw, piston, and valve automatically rotates and scales with it without needing individual recalculations.

---

## 3. Exploded View & Disassembly Mechanics

To disassemble an engine or show an exploded view in AR, we do **not** re-parse the 3D model. We mathematically manipulate the local translation matrix of target sub-nodes in Filament’s `TransformManager`.

### The Explosion Vector Equation
For any detachable engine part $i$, we define:
* $\vec{d}_i$: The disassembly direction unit vector (e.g., $[0, 1, 0]$ to pull vertically upward out of the block).
* $k_i$: The maximum exploded travel distance in meters (e.g., $0.25\text{ m}$).
* $\alpha \in [0.0, 1.0]$: The global disassembly progress slider ($0 = \text{assembled}$, $1 = \text{fully exploded}$).

The updated local translation vector $\vec{T}'_i$ becomes:
$$\vec{T}'_i = \vec{T}_{\text{original}, i} + (\alpha \cdot k_i \cdot \vec{d}_i)$$

```kotlin
class EngineDisassemblyController(
    private val transformManager: TransformManager,
    private val partEntities: Map<String, Int> // Name -> Filament Entity ID
) {
    // Disassembly vectors for each part
    private val explosionVectors = mapOf(
        "Valve_Cover"    to Vector3(0f, 0.20f, 0f),  // Lifts 20 cm up
        "Cylinder_Head"  to Vector3(0f, 0.35f, 0f),  // Lifts 35 cm up
        "Piston_1"       to Vector3(0f, 0.45f, 0f),  // Pulls out of bore
        "Oil_Pan"        to Vector3(0f, -0.25f, 0f), // Drops 25 cm down
        "Exhaust_Header" to Vector3(0.30f, 0f, 0f)   // Slides 30 cm right
    )

    fun applyExplodedProgress(progress: Float) {
        val clampedAlpha = progress.coerceIn(0.0f, 1.0f)
        
        for ((partName, offsetVector) in explosionVectors) {
            val entity = partEntities[partName] ?: continue
            val instance = transformManager.getInstance(entity)
            
            // Apply offset along local normal vector
            val currentLocalTransform = FloatArray(16)
            transformManager.getTransform(instance, currentLocalTransform)
            
            currentLocalTransform[12] += offsetVector.x * clampedAlpha // X translation
            currentLocalTransform[13] += offsetVector.y * clampedAlpha // Y translation
            currentLocalTransform[14] += offsetVector.z * clampedAlpha // Z translation
            
            transformManager.setTransform(instance, currentLocalTransform)
        }
    }
}
```

---

## 4. Part Selection, Highlighting & Outlines

When the user taps on or pinches an individual engine part:
1. **Ray-Mesh Hit Test**: The unprojected camera ray determines which specific entity was intersected.
2. **Visual Feedback (Emissive Glow / Outline)**:
   * Filament allows swapping or updating material parameters dynamically:
   ```kotlin
   // Highlight selected part with an emissive cyan accent
   val materialInstance = renderableManager.getMaterialInstanceAt(renderableInstance, 0)
   materialInstance.setParameter("emissiveFactor", 0.0f, 0.8f, 1.0f)
   ```
3. **Information Overlay**: The engine displays technical part specifications (e.g., `"Connecting Rod - Forged Steel - Torque Spec: 45 Nm"`).

---

## 5. How This Module Helps Our Engine

| Challenge in SpatialOS | How This Module Solves It |
| :--- | :--- |
| **Monolithic Model Limitation** | Standard AR apps treat a 3D model as one unchangeable lump. This module exposes the full glTF node tree so every screw, gear, and piston is independently controllable. |
| **Exploded View Animations** | Enables smooth, step-by-step assembly and disassembly animations driven by a simple slider or hand gesture. |
| **Part Inspection** | Allows the user to "pull" a piston out of the engine block in physical space, rotate it in mid-air to inspect wear, and snap it back into place. |
| **Reusable Industrial Platform** | Works for any mechanical system (car engines, gearboxes, pumps, medical equipment) as long as it is exported as a standard glTF 2.0 hierarchy. |

