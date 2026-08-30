# SPATIALOS — COMPLETE ADMIN DASHBOARD UI/UX + WORKFLOW BLUEPRINT

This document serves as the comprehensive UI/UX, Information Architecture, and Workflow Blueprint for the SpatialOS Admin Dashboard. It defines the control plane for managing Places, Experiences, Content, and Services before they are published to the user-facing AR Engine.

---

## 1. Dashboard Architecture

The Dashboard answers five critical questions for any SpatialOS environment:
1. **WHERE** is something? (Places)
2. **WHAT** experience exists there? (Experiences)
3. **WHAT** content is shown? (Content)
4. **WHAT** service can the user perform? (Services)
5. **IS** it currently published and working? (Publishing & Monitoring)

**Core Entity Relationship:**
`PLACE → EXPERIENCE → CONTENT / SERVICE → PUBLISH → USER EXPERIENCE`

---

## 2. Sidebar Structure

The primary navigation follows a logical flow from physical spaces to abstract configurations and operational health.

```text
┌───────────────────────────────┐
│ SpatialOS                     │
├───────────────────────────────┤
│ Overview                      │
│ Places                        │
│ Experiences                   │
│ Services                      │
│ Content                       │
│ Users                         │
│ Publishing                    │
│ Monitoring                    │
│ Settings                      │
├───────────────────────────────┤
│ Help                          │
│ Profile                       │
│ Logout                        │
└───────────────────────────────┘
```

---

## 3. Global Components

### App Shell
- **Top Navigation:** Contains Sidebar collapse toggle, Global Search, Notifications bell, Current Organization/Workspace dropdown, and User Profile.
- **Main Workspace:** The primary content area for lists, forms, and detail views.
- **Global Search (Omnibar):** Searches across all entities. Results are strictly categorized (e.g., `[PLACE] Main Entrance`, `[SERVICE] Complaint Box`).
- **Notifications Panel:** Toast/Drawer showing recent Success, Warning, Error, and Info events.
- **System Status Indicator:** A persistent footer/header dot (Green=Healthy, Yellow=Warning, Red=Error).

---

## 4. Overview/Home Page

**Purpose:** Provide an immediate understanding of the entire SpatialOS environment.

- **A. Summary Cards:**
  - Total/Active Places, Total/Published Experiences, Total/Active Services, Total Content, Total Users.
  - *Click Action:* Navigates to the respective filtered list.
- **B. Publishing Summary:**
  - Status counts for Draft, Ready, Published, Unpublished, Failed.
- **C. Recent Activity:**
  - Timeline of recent creation, updates, uploads, or publishing events across the platform.
- **D. System Health:**
  - Status pills for Backend, Database, Storage, APIs, AR Engine.
- **E. Quick Actions:**
  - Buttons: `Create Place`, `Create Experience`, `Add Content`, `Configure Service`, `Publish Changes`.
- **F. Recent Places / G. Recent Experiences:**
  - Mini-tables showing the last 5 modified items.
- **H. Recent Errors:**
  - High-priority list of operational failures requiring attention.

---

## 5. Places

**Purpose:** Manage physical locations in the SpatialOS world.

**Screen Structure:**
- **Header:** Title ("Places"), Global `[Create Place]` button.
- **Filters:** Search by name/ID, Filter by Type, Status (Active/Draft/Archived), Parent Place.
- **Table Columns:** Name, Type, Parent, Status, Experiences (Count), Services (Count), Last Updated, Actions.
- **Row Actions:** View, Edit, Configure, Open (in AR preview), Archive/Delete.

---

## 6. Create Place (Form)**

**Fields:**
- `Name` (Text, Required)
- `Place Type` (Select: Generic/Extensible e.g., Building, Floor, Room, Outdoor Area)
- `Description` (Textarea)
- `Parent Place` (Select/Search existing places)
- `Location` (Lat/Long or Local coordinates)
- `Identifier` (Unique text)
- `QR/Spatial Identifier` (String encoded in QR/Anchor)
- `Status` (Draft/Active)

**Buttons:** `Cancel`, `Save Draft`, `Create`, `Create & Configure`

---

## 7. Place Details

**Header:** Place Name, Type badge, Status badge, Actions (`Edit`, `Add Experience`, `Add Service`, `Publish`, `Archive`).
**Tabs:**
1. **Overview:** Basic info, hierarchy map.
2. **Experiences:** List of attached experiences.
3. **Services:** List of directly attached services.
4. **Content:** Associated generic content.
5. **Spatial Configuration:** Maps/anchors/QR data.
6. **Activity:** Audit log for this specific place.

---

## 8. Experiences

**Purpose:** Defines what the user sees/interacts with at a place.

**Screen Structure:**
- **Header:** Title ("Experiences"), `[Create Experience]` button.
- **Filters:** Search, Filter by Type, Place, Status, Publishing Status.
- **Table Columns:** Name, Type, Place, Status, Services (Count), Content (Count), Publishing Status, Last Updated, Actions.
- **Row Actions:** View, Edit, Duplicate, Configure, Publish, Unpublish, Archive.

---

## 9. Create Experience (Form)**

**Fields:**
- `Name` (Text, Required)
- `Experience Type` (Select: Content-only, Service, Interactive, Mixed)
- `Description` (Textarea)
- `Place` (Reference/Search to Place)
- `Availability` (Always/Scheduled)
- `Status` (Draft/Active)

**Buttons:** `Cancel`, `Save Draft`, `Create`, `Create & Configure`

---

## 10. Experience Details

**Tabs:**
1. **Overview:** Metadata, assignments.
2. **Content:** Attached images, 3D models, text.
3. **Services:** Attached services (e.g., Notice Board plugin).
4. **Spatial:** AR Placement Canvas (Visual node editor assigning coordinates to content).
5. **Configuration:** Specific variable overrides.
6. **Preview:** Web-based rendering of the AR layout.
7. **Publishing:** State of the compiler output.
8. **Activity:** Audit log.

---

## 11. Services & 12. Service Registry

**Purpose:** Reusable functional capabilities (e.g., Menu, Timetable, Complaint Box).
**Registry Screen:**
- Lists all globally available Service Types provided by developers.
- Columns: Name, Description, Version, Supported Capabilities.
- Actions: View, Configure, Enable, Disable.

---

## 13. Service Instances

**Purpose:** Actual deployed/configured services attached to Places or Experiences.
- **Table Columns:** Service Name, Type, Place, Experience, Status, Version, Publishing State, Last Updated.
- **Actions:** Configure, Enable, Disable, Duplicate, Publish, Delete.

---

## 14. Service Configuration (Dynamic Form)

**Purpose:** Generic form rendering JSON schemas defined by the Service.
- Must dynamically render Text, Number, Boolean, Selection, Date/time, Lists, References, Images.
- **Buttons:** `Save`, `Save Draft`, `Reset`, `Publish`.

---

## 15. Content & 16. Content Details

**Purpose:** Manage raw assets (Images, Text, future 3D/Audio).
- **Grid/List View:** Preview thumbnail, Name, Type, Size, Status, Usage Count, Created, Updated.
- **Actions:** View, Edit, Replace, Assign, Download, Delete.
- **Details Page:** Shows full metadata, preview, and relational lists of all Places/Experiences using this asset.

---

## 17. Upload Workflow

1. Click `Add Content`
2. Select type (Image/Video/Text)
3. Select file/Input text
4. **Validate:** Check size/format.
5. **Upload:** Progress bar.
6. **Create Record:** Save to database.
7. **Attach:** (Optional) Select Experience/Place.
8. **Save:** Returns to Content list.

---

## 18. Users & 19. User Details

**Purpose:** Manage platform administrators and authorized operators.
- **List:** Name, Email, Role, Status, Last Activity.
- **Actions:** View, Edit, Activate, Deactivate.
- **Tabs (Details):** Profile, Roles, Permissions, Activity.
- *Note:* Backend enforces security; UI strictly reflects authorized capabilities.

---

## 20. Publishing

**Purpose:** Separate control-plane function to compile and push Drafts to Live.
- **Tabs/Filters:** Draft, Ready, Published, Unpublished, Failed.
- **Table:** Entity Name, Type, Target Place, Version, Status, Updated, Published By.
- **Actions:** Validate, Publish, Unpublish, View, Compare (Diff).
- **Workflow:** Draft → Validate (Checks dependencies) → Ready → Publish → Live (Available to AR App).

---

## 21. Monitoring

**Purpose:** Operational visibility.
- **System Health:** Visual graphs/pills for DB, API, Storage.
- **Activity Feed:** Global event log.
- **Errors:** Stack traces or user-friendly API failure logs.
- **Usage:** Metrics on Active users, Experience loads, Service interactions.

---

## 22. Settings

**Purpose:** System configuration.
- **Groups:** General, Organization Profile, Users & Access, Security, Storage Quotas, Integrations.

---

## 23. Global Entity Workflow (The Golden Path)

1. **CREATE PLACE:** Define physical constraints (e.g., "Hospital Reception").
2. **CREATE EXPERIENCE:** Create a "Welcome Experience".
3. **ADD CONTENT:** Upload a welcome video.
4. **ADD SERVICE:** Instantiate an "Appointment Booking" service.
5. **CONFIGURE:** Set 3D coordinates in the Visual Editor.
6. **VALIDATE:** System checks if content exists and service is configured.
7. **SAVE DRAFT:** Save progress.
8. **PUBLISH:** Compile to standard `SceneGraphPayload`.
9. **USER APP:** AR Engine retrieves payload and renders.

*(This exact flow works identically for a College, Mall, or Museum without changing the UI architecture).*

---

## 24. Generic Service/Experience Relationship

- **Hierarchy:** `Place` contains `Experiences` and `Services`. `Experiences` contain `Content` and `Services`.
- **UI Implication:** Detail pages must use clear breadcrumbs (`Mall > Store > Product Showcase`) and relational tables to show these links.

---

## 25. Entity Action Standard

- **Consistency:** Every list and detail page must use the standard action set: `View`, `Edit`, `Duplicate`, `Archive/Delete`, `Assign`, `Configure`, `Publish`, `Unpublish`.
- **Destructive Actions:** Require a modal confirmation typing the entity name.
- **State Feedback:** Loading spinners, Success toasts, Failure alerts.

---

## 26. Form Standard

- **Standard Elements:** Asterisks for required fields, helper text below inputs, inline error messages.
- **Button Clarity:** Use verb-noun pairings (e.g., `Create Place`, `Save Draft`, `Publish Experience`), NEVER just "Submit".

---

## 27. UI States

Every screen component must account for:
- **INITIAL:** Default view.
- **LOADING:** Skeletons or spinners during fetch.
- **SUCCESS:** Action completed cleanly.
- **EMPTY:** "No Places found. Create your first Place." with an actionable button.
- **ERROR:** "Failed to load Data. [Retry]"
- **PARTIAL:** Some data loaded, some failed.
- **DISABLED:** Read-only mode for unauthorized fields.
- **UNAUTHORIZED:** "You do not have permission to view this."

---

## 28. Notifications

- **Success (Green):** "Experience 'Main Hall' published successfully."
- **Warning (Yellow):** "Content is assigned but Place is not published."
- **Error (Red):** "Upload failed: File exceeds 50MB."
- **Info (Blue):** "System maintenance scheduled in 2 hours."

---

## 29. Confirmation Workflows

- Triggered on: Delete, Archive, Unpublish, Remove Association.
- **Modal Content:** "Are you sure you want to unpublish 'Notice Board'? Users currently at this location will no longer see this experience."
- **Buttons:** `Cancel` (Default), `Unpublish` (Destructive/Red).

---

## 30. Preview Workflow

- Accessible before Publishing.
- Renders a WebGL/CSS representation of the spatial layout (Visual Editor) or a JSON payload inspector.
- **Rule:** Previews fetch Draft state data, never modifying Production data.

---

## 31. Audit / Activity Workflow

- Present globally and on entity detail pages.
- **Data structure:** `[Timestamp] [Actor Name] performed [Action] on [Entity]`.
- Clickable links to the Actor and the Entity.

---

## 32. Dashboard Permissions

- UI elements (Buttons, Tabs, Pages) dynamically hide or disable based on the user's backend-provided roles.
- E.g., `VIEWER` can see Places but the `[Create Place]` button is completely omitted from the DOM.

---

## 33. Responsive / Usability Structure

- **Desktop-First:** Designed for wide screens (data tables, 2D canvases).
- **Navigation:** Persistent left sidebar, sticky top header.
- **Modals vs Pages:** Use distinct pages for complex forms (Create Experience). Use side-drawers for quick edits (Edit Content Name).

---

## 34. Final Sidebar

*(See Section 2)*

---

## 35. Final UI → BACKEND CONTRACT (Requirement Matrix)

### Places
- **Screen:** List Places → **Action:** Load → **API:** `GET /places` → **Response:** `Place[]`
- **Screen:** Create Place → **Action:** Submit → **API:** `POST /places` → **Req:** `CreatePlaceDto` → **Perm:** `CREATE_PLACE`

### Experiences
- **Screen:** List Experiences → **Action:** Load → **API:** `GET /experiences` → **Response:** `Experience[]`
- **Screen:** Create Experience → **Action:** Submit → **API:** `POST /experiences` → **Req:** `CreateExperienceDto`
- **Screen:** Spatial Editor → **Action:** Update Node → **API:** `PATCH /experiences/:id/nodes` → **Req:** `UpdateNodesDto`

### Services
- **Screen:** Registry → **Action:** Load → **API:** `GET /services/registry` → **Response:** `ServiceDefinition[]`
- **Screen:** Instance Config → **Action:** Save → **API:** `POST /services/instances` → **Req:** `JSON Config`

### Content
- **Screen:** Upload → **Action:** Upload File → **API:** `POST /content/upload` → **Req:** `multipart/form-data` → **Response:** `AssetURL`

### Publishing
- **Screen:** Publish Action → **Action:** Click Publish → **API:** `POST /publish/:entityType/:id` → **Response:** `PublishResult (Success/ValidationErrors)`

---

## 36. Future Extensibility Rules

- **No Hardcoded Types:** Enums like "Building" or "Hospital" belong in database seed data or configuration, NOT hardcoded in React components.
- **Dynamic Forms:** Service configurations must rely on JSON Schema definitions provided by the backend to render forms automatically.
- **Plugin Architecture:** Future asset types (3D models, Audio) require backend validation logic extensions without rewriting the entire frontend upload component.

---
*END OF BLUEPRINT*
