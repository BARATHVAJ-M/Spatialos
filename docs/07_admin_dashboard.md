arkdown
# SpatialOS Implementation Specification: Admin Dashboard & Visual Builder

**Document ID:** 07_Admin_Dashboard_Architecture  
**Target Audience:** Frontend Web Developers (React/Next.js)  
**Objective:** Define the architecture for the web-based Admin Dashboard. This system provides a WYSIWYG (What You See Is What You Get) editor that generates the abstract JSON payloads (`UIPayload` and `MediaPayload`) and saves them to the Prisma database.

---

## 1. The Core Philosophy: "The JSON Generator"

The Admin Dashboard is fundamentally a visual JSON editor. 
A non-technical user drags a "Button" onto a canvas and types "Place Order." The React application translates this into the `{ "type": "BUTTON", "label": "Place Order" }` JSON structure and saves it to the `ComponentTemplate` table.

### Technology Stack
* **Framework:** Next.js (App Router) + React
* **Styling:** Tailwind CSS + Shadcn/UI (for clean, rapid admin components)
* **State Management:** Zustand (Crucial for managing deeply nested JSON tree states during editing)
* **Drag and Drop:** `@hello-pangea/dnd` (Formally react-beautiful-dnd)

---

## 2. Directory Structure (Admin App)

*Developer Instruction: Place this inside `apps/admin-dashboard/` in the monorepo.*

```text
apps/admin-dashboard/src/
├── app/
│   ├── (auth)/             # Login/Signup
│   ├── dashboard/
│   │   ├── places/         # QR Code & Location management
│   │   ├── experiences/    # The Visual Editor (The core feature)
│   │   └── actions/        # Defining Webhooks
├── components/
│   ├── builder/            # The Visual AR Builder components
│   │   ├── CanvasArea.tsx  # The visual phone simulator
│   │   ├── NodeSidebar.tsx # Drag-and-drop toolbox (Video, Form, Text)
│   │   └── PropEditor.tsx  # Edit selected node (change text, colors)
├── store/
│   └── useBuilderStore.ts  # Zustand store holding the draft JSON
3. State Management (The Brain of the Builder)
When a user is editing an AR Scene, the React app must hold the entire SceneGraphPayload (from Doc 03) in memory. We use Zustand for fast, boilerplate-free state management.

TypeScript
import { create } from 'zustand';
import { SpatialNode, UIElement } from '@spatialos/types/scene-graph';

interface BuilderState {
  // The current working draft of the scene
  draftNodes: SpatialNode[];
  selectedNodeId: string | null;
  
  // Actions
  addNode: (node: SpatialNode) => void;
  updateNodeTransform: (id: string, x: number, y: number, z: number) => void;
  updateUIElement: (nodeId: string, updatedElement: UIElement) => void;
  setSelectedNode: (id: string) => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  draftNodes: [],
  selectedNodeId: null,

  addNode: (node) => set((state) => ({ 
    draftNodes: [...state.draftNodes, node] 
  })),

  updateNodeTransform: (id, x, y, z) => set((state) => ({
    draftNodes: state.draftNodes.map(node => 
      node.nodeId === id 
        ? { ...node, transform: { ...node.transform, position: { x, y, z } } }
        : node
    )
  })),
  
  // ... other update methods
}));
4. The Visual Builder Architecture (WYSIWYG)
The visual builder consists of three main panels: The Sidebar (Toolbox), the Canvas (Simulator), and the Properties Panel.

A. The Toolbox (Dragging items onto the scene)
Users drag abstract components (like "Media" or "Interactive Panel") onto the screen.

TypeScript
// components/builder/NodeSidebar.tsx
export function NodeSidebar() {
  const addNode = useBuilderStore(state => state.addNode);

  const handleAddVideo = () => {
    addNode({
      nodeId: generateId(),
      type: 'MEDIA',
      transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      mediaPayload: { assetType: 'VIDEO', url: '', loop: true }
    });
  };

  return (
    <div className="w-64 border-r p-4">
      <h3>Add to AR Scene</h3>
      <button onClick={handleAddVideo}>+ Floating Video</button>
      <button onClick={handleAddUIPanel}>+ Interactive Form</button>
    </div>
  );
}
B. The Property Editor (Modifying JSON values safely)
When a user clicks on the "Interactive Form" in the canvas, the right-side panel opens to let them edit the JSON values without seeing the code.

TypeScript
// components/builder/PropEditor.tsx
export function PropEditor() {
  const selectedNode = useBuilderStore(state => 
    state.draftNodes.find(n => n.nodeId === state.selectedNodeId)
  );

  if (selectedNode?.type === 'MEDIA') {
    return (
      <div className="p-4 border-l">
        <label>Video URL (MP4)</label>
        <input 
          type="text" 
          value={selectedNode.mediaPayload.url}
          onChange={(e) => updateMediaUrl(selectedNode.nodeId, e.target.value)} 
        />
        <Toggle label="Auto-Play" checked={selectedNode.mediaPayload.autoPlay} />
      </div>
    );
  }

  if (selectedNode?.type === 'UI_PANEL') {
    // Renders inputs for Button Labels, Dropdown options, etc.
    return <UIPanelEditor payload={selectedNode.uiPayload} />;
  }
}
5. Saving the Experience (The DB Write)
Once the cafe owner has visually designed their floating menu, they click "Save & Publish."

The Admin Dashboard takes the Zustand draftNodes array and maps it to the Backend APIs we defined in Doc 02 and 04.

TypeScript
// utils/api.ts
async function publishExperience(placeId: string, draftNodes: SpatialNode[]) {
  
  // 1. Create the Experience Record
  const experience = await api.post(`/experiences`, { placeId, name: "New Scene" });
  
  // 2. Loop through draft nodes and create Database records
  for (const node of draftNodes) {
    
    // If it's a UI Panel, we save the JSON layout to ComponentTemplate first
    let referenceId = "";
    if (node.type === 'UI_PANEL') {
      const template = await api.post(`/components`, { uiLayout: node.uiPayload.layout });
      referenceId = template.id;
    } 
    else if (node.type === 'MEDIA') {
      const asset = await api.post(`/content`, { url: node.mediaPayload.url });
      referenceId = asset.id;
    }

    // 3. Save the spatial coordinates to the DB
    await api.post(`/spatial-nodes`, {
      experienceId: experience.id,
      nodeType: node.type,
      referenceId: referenceId,
      positionX: node.transform.position.x,
      // ... passing Y, Z, Rotation, Scale
    });
  }
  
  // 4. Mark as Published! The AR Engine can now see it.
  await api.post(`/experiences/${experience.id}/publish`);
}
6. End-to-End Workflow (The Non-Technical User Journey)
Create Place: The Admin clicks "Add Location." The system generates a UUID and a printable QR code graphic (QR_CAFE_01).

Build Scene: The Admin opens the Visual Editor for that Place. They drag a "Video" and a "Dropdown Form" onto the visual canvas.

Configure Actions: They select the "Submit" button in the form and attach an Action (e.g., "Send to Cafe POS Webhook").

Publish: They click Publish. The React app translates the visual canvas into the SpatialNode and ComponentTemplate PostgreSQL tables.

Live AR: Instantly, any student who scans the QR code at the cafe sees the new video and form.


***

### The Complete Platform Architecture is Now Finalized.

We have successfully generated the entire developer documentation stack for **SpatialOS V1**:

1.  **`01_Core_Architecture_&_Stack`** (Monorepo, NestJS, Typescript rules)
2.  **`02_Database_Schema`** (Prisma tables, JSONB columns, Multi-tenancy)
3.  **`03_API_Contracts`** (The generic JSON structure for UI/3D)
4.  **`04_The_Compiler_Engine`** (Backend code that turns DB rows into JSON)
5.  **`05_The_Action_Broker`** (Backend code that processes button taps in AR)
6.  **`06_AR_Client_SDK`** (Mobile code that parses JSON and draws UI without hardcoding)
7.  **`07_Admin_Dashboard`** (React Web App that lets users build AR scenes visually)

With these 7 documents, a full-stack engineering team can begin writing production code immediately. Everything is decoupled, scalable, and completely industry-agnostic. 

You have successfully designed a true **Spatial Operating System.**