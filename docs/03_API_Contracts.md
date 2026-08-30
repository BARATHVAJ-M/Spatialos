SpatialOS Implementation Specification: API & JSON Data Contracts

**Document ID:** 03_API_Contracts
**Target Audience:** Mobile/AR Frontend Developers, Backend API Engineers
**Objective:** Define the strict TypeScript interfaces and JSON schemas used for Server-Driven UI and Spatial Node rendering. 

---

## 1. The Core Philosophy: "The Thin Client"

The Mobile AR App must be entirely "thin." It does not fetch a menu, it does not fetch a notice board. It ONLY fetches a **Scene Graph**. 

### The Primary Endpoint
**Request:** `GET /api/v1/scene?qr_id={qrTargetId}`
**Header:** `Authorization: Bearer {user_token}`

This single endpoint replaces 100 different industry-specific APIs. It returns the `SceneGraphPayload`.

---

## 2. Shared TypeScript Interfaces (The Contract)

*Developer Instruction: Place these in `packages/types/scene-graph.ts`. Both the NestJS Backend and the Mobile App codebase will rely on these.*

```typescript
// ------------------------------------------------------
// PLATFORM DEFINITIONS (The Metadata/Schema Layer)
// ------------------------------------------------------
export interface ComponentDefinition {
  id: string;
  name: string; // e.g., "Faculty Card"
  schema: JSONSchema; // Defines required fields: name, designation, photo
}

export interface ServiceDefinition {
  id: string;
  name: string; // e.g., "Complaint Service"
  payloadSchema: JSONSchema; 
}

// ------------------------------------------------------
// ROOT SCENE GRAPH (Instance Layer)
// ------------------------------------------------------
export interface SceneGraphPayload {
  version: "1.0.0";
  placeId: string;
  experienceName: string;
  theme: "LIGHT" | "DARK";
  spatialNodes: SpatialNode[];
}

// ------------------------------------------------------
// SPATIAL NODES (3D Placement)
// ------------------------------------------------------
export interface SpatialNode {
  nodeId: string;
  type: "MEDIA" | "UI_PANEL" | "TRIGGER";
  transform: Transform3D;
  
  // The payload depends on the 'type'
  mediaPayload?: MediaPayload;
  uiPayload?: UIPayload;
}

export interface Transform3D {
  position: { x: number; y: number; z: number }; // Meters relative to QR anchor
  rotation: { x: number; y: number; z: number }; // Euler angles
  scale:    { x: number; y: number; z: number }; // Multiplier
}

// ------------------------------------------------------
// MEDIA PAYLOADS (Photos, Videos, 3D)
// ------------------------------------------------------
export interface MediaPayload {
  assetType: "IMAGE" | "VIDEO" | "3D_GLB";
  url: string;
  loop?: boolean;       // For Video
  autoPlay?: boolean;   // For Video
}

// ------------------------------------------------------
// SERVER-DRIVEN UI PAYLOADS (The Interface Canvas)
// ------------------------------------------------------
export interface UIPayload {
  layout: UIElement; // The root container (usually a VSTACK)
}

// Polymorphic UI Element
export type UIElement = 
  | UIText 
  | UIButton 
  | UIStack 
  | UIDropdown 
  | UIInput;

export interface UIText {
  type: "TEXT";
  text: string;
  style: "HEADER" | "SUBTITLE" | "BODY";
  color?: string; // Optional override, otherwise uses theme
}

export interface UIButton {
  type: "BUTTON";
  label: string;
  buttonStyle: "PRIMARY" | "SECONDARY" | "DANGER";
  actionId: string; // The UUID sent back to the server when tapped
}

export interface UIDropdown {
  type: "DROPDOWN";
  id: string; // Used to collect form data
  placeholder: string;
  options: { label: string; value: string }[];
}

export interface UIStack {
  type: "VSTACK" | "HSTACK"; // Vertical or Horizontal flex layout
  spacing: number;
  children: UIElement[];
}
3. Example JSON: The "Golden Payload" in Action
If a student scans the QR code on Canteen Table 05, the Backend Compiler queries the DB, formats the data, and returns this exact JSON.

Notice how the AR Engine just reads this and draws a Floating Video and a Floating Form panel, 0.5 meters apart.

JSON
{
  "version": "1.0.0",
  "placeId": "plc_abc123",
  "experienceName": "Table Express Order",
  "theme": "DARK",
  "spatialNodes": [
    {
      "nodeId": "node_media_99",
      "type": "MEDIA",
      "transform": {
        "position": { "x": 0.0, "y": 0.5, "z": -0.2 },
        "rotation": { "x": 0.0, "y": 0.0, "z": 0.0 },
        "scale": { "x": 1.0, "y": 1.0, "z": 1.0 }
      },
      "mediaPayload": {
        "assetType": "VIDEO",
        "url": "[https://cdn.spatialos.com/assets/coffee_pour.mp4](https://cdn.spatialos.com/assets/coffee_pour.mp4)",
        "loop": true,
        "autoPlay": true
      }
    },
    {
      "nodeId": "node_ui_100",
      "type": "UI_PANEL",
      "transform": {
        "position": { "x": 0.0, "y": 0.0, "z": 0.0 },
        "rotation": { "x": -15.0, "y": 0.0, "z": 0.0 },
        "scale": { "x": 1.0, "y": 1.0, "z": 1.0 }
      },
      "uiPayload": {
        "layout": {
          "type": "VSTACK",
          "spacing": 16,
          "children": [
            {
              "type": "TEXT",
              "text": "Order from Table 05",
              "style": "HEADER"
            },
            {
              "type": "DROPDOWN",
              "id": "drink_selection",
              "placeholder": "Select Beverage",
              "options": [
                { "label": "Filter Coffee", "value": "item_fc" },
                { "label": "Cold Coffee", "value": "item_cc" }
              ]
            },
            {
              "type": "BUTTON",
              "label": "Place Order - ₹40",
              "buttonStyle": "PRIMARY",
              "actionId": "act_submit_cafe_order_05"
            }
          ]
        }
      }
    }
  ]
}
4. The Action Execution Contract (Interacting with the World)
When the user selects "Filter Coffee" and taps the "Place Order" button in AR, the mobile app does NOT run any business logic. It gathers the data and posts it back to the Backend's Action Broker.

The Execution Endpoint
Request: POST /api/v1/actions/execute
Header: Authorization: Bearer {user_token}

Request Body Schema:

TypeScript
export interface ActionExecutionRequest {
  actionId: string;       // From the UIButton payload
  context: {
    placeId: string;      // The current QR location
    formValues?: Record<string, string>; // Maps dropdown/input IDs to selected values
  }
}
Example Client Payload sent from AR Engine:

JSON
{
  "actionId": "act_submit_cafe_order_05",
  "context": {
    "placeId": "plc_abc123",
    "formValues": {
      "drink_selection": "item_fc"
    }
  }
}
Server Response Concept
The Backend routes this to the external Cafe POS system via Webhook, and returns an abstract UI update instruction to the AR Engine (e.g., "Replace the button with a Success Checkmark").

JSON
{
  "status": "SUCCESS",
  "uiFeedback": {
    "type": "REPLACE_NODE",
    "nodeId": "node_ui_100",
    "newLayout": {
      "type": "TEXT",
      "text": "Order Confirmed! Wait time 4 mins.",
      "style": "HEADER"
    }
  }
}

***

### What we have accomplished so far:
1. **Core Architecture (`01`):** Defined how the Backend, Compiler, and AR Engine are completely decoupled.
2. **Database (`02`):** Built the generic `Places` and `SpatialNodes` tables using Prisma.
3. **API Contracts (`03`):** Defined the exact JSON bridge between the Database and the Mobile AR App.

### Next Logical Step
To make the Database (`02`) talk to the Mobile JSON (`03`), we need to build the Backend's brain.

Shall we proceed to **`04_The_Compiler_Engine.md`**? This file will show th