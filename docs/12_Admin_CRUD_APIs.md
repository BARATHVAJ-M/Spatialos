# SpatialOS Implementation Specification: Admin CRUD APIs

**Document ID:** 12_Admin_CRUD_APIs
**Target Audience:** Backend API Engineers, Frontend (Admin) Engineers
**Objective:** Define the standard REST API endpoints required by the Next.js Admin Dashboard to create, read, update, and delete configuration data (Places, Experiences, Components, and Users).

---

## 1. Context: The Two API Paradigms

SpatialOS uses two very different API patterns:
1. **The AR Client APIs (`/scene`, `/actions`)**: Heavily optimized, deeply nested, compiled, and highly cacheable. (Covered in Docs 03, 04, 05).
2. **The Admin Dashboard APIs (`/api/v1/admin/*`)**: Standard, relational REST CRUD (Create, Read, Update, Delete). These endpoints write directly to the Prisma database tables.

This document defines the **Admin Dashboard APIs**.

---

## 2. API Global Standards

- **Base Route:** `/api/v1/admin/`
- **Authentication:** All routes require an `Authorization: Bearer <token>` header belonging to a user with `ORG_ADMIN` or `SYSTEM_ADMIN` roles.
- **Tenancy:** Every request automatically extracts the `organizationId` from the JWT token. The backend *must* append `where: { organizationId: req.user.orgId }` to every Prisma query to prevent data leakage.

---

## 3. Platform Definitions API (`/definitions`)

Manages the metadata schemas (Component & Service Definitions) that dictate what fields are available to component instances.

### `POST /definitions/components`
- **Purpose:** Create a new schema definition (e.g., "Doctor Card").
- **Body:**
  ```json
  {
    "name": "Doctor Card",
    "schema": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "specialization": { "type": "string" },
        "photo": { "type": "string", "format": "uri" }
      },
      "required": ["name", "specialization"]
    }
  }
  ```
- **Result:** Returns definition `id` used when creating Component Instances.

### `POST /definitions/services`
- **Purpose:** Create a new service definition (e.g., "Appointment Booking").
- **Body:** `{ "name": "Appointment Booking", "payloadSchema": { ... } }`

---

## 4. Places API (`/places`)

Manages the physical locations and generates the QR code configurations.

### `GET /places`
- **Purpose:** List all physical locations for the organization.
- **Response:**
  ```json
  [
    {
      "id": "plc_123",
      "name": "Canteen Table 5",
      "qrTargetId": "spatialos://resolve?id=plc_123&sig=abcd",
      "activeExperienceCount": 1
    }
  ]
  ```

### `POST /places`
- **Purpose:** Create a new physical location.
- **Body:** `{ "name": "Canteen Table 5", "parentId": null }`
- **Action:** The backend generates a secure `qrTargetId` (Doc 08) and saves it via Prisma.

### `PATCH /places/:id`
- **Purpose:** Edit an existing place (e.g., rename it).
- **Body:** `{ "name": "Canteen Table 6" }`

### `DELETE /places/:id`
- **Purpose:** Delete a physical location (Soft delete to preserve analytics).

---

## 5. Experiences API (`/experiences`)

Manages the wrappers that hold spatial scenes for a specific place.

### `POST /experiences`
- **Purpose:** Create a new draft experience for a Place.
- **Body:** `{ "placeId": "plc_123", "name": "Lunch Menu Demo" }`
- **Result:** Creates an Experience in `DRAFT` status.

### `POST /experiences/:id/publish`
- **Purpose:** Make a draft experience live.
- **Action:** 
  1. Finds any existing `PUBLISHED` experience for that `placeId` and marks it `ARCHIVED`.
  2. Updates this experience status to `PUBLISHED`.
  3. Purges the Redis cache for this `placeId` so AR Clients immediately see the new version.

---

## 6. Spatial Nodes API (`/spatial-nodes`)

The endpoints used by the Visual Builder (Doc 07) to save the 3D X/Y/Z positions of components.

### `PUT /experiences/:id/nodes`
- **Purpose:** Bulk-save the entire spatial layout when the Admin clicks "Save" in the visual editor.
- **Body:**
  ```json
  {
    "nodes": [
      {
        "nodeType": "UI_PANEL",
        "referenceId": "tpl_999",
        "position": { "x": 0, "y": 0.5, "z": -1 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "scale": { "x": 1, "y": 1, "z": 1 }
      }
    ]
  }
  ```
- **Action:** The backend executes a Prisma transaction: `deleteMany` existing nodes for the experience, then `createMany` with the new array.

---

## 7. Components API (`/components`)

Manages the generic JSON configurations for Server-Driven UI.

### `POST /components`
- **Purpose:** Save a new UI Layout block.
- **Body:**
  ```json
  {
    "componentDefinitionId": "def_12345",
    "name": "Order Button Panel",
    "uiLayout": {
      "type": "BUTTON",
      "label": "Place Order",
      "actionId": "act_8899"
    }
  }
  ```
- **Result:** Returns the `id` (e.g., `tpl_999`) which is then used as the `referenceId` in the Spatial Nodes payload.

---

## 8. Next Steps

With the CRUD APIs defined, developers can build the frontend Dashboard forms. But what happens when an Admin uploads a 50MB `.mp4` video for an AR scene? 
That cannot be sent as a standard JSON payload. It requires a dedicated multipart workflow. Proceed to **13_Asset_Upload_System.md**.
