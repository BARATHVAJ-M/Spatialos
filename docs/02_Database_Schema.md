# SpatialOS Implementation Specification: Database & Data Models

**Document ID:** 02_Database_Schema
**Target Audience:** Backend Engineers, Database Administrators
**Objective:** Define the exact PostgreSQL + Prisma ORM schema required to build the abstracted, server-driven SpatialOS platform. 

## 1. Database Design Principles
To achieve maximum abstraction (writing 20 lines instead of 100), the database strictly follows these rules:
* **Multi-Tenancy by Default:** Every core table includes an `organizationId`. A single database serves all clients (Colleges, Hospitals, Malls) with strict row-level separation.
* **Polymorphic Spatial Nodes:** We do NOT have tables for `CanteenMenu` or `NoticeBoard`. We have a single `SpatialNode` table. The `nodeType` defines what it is, and the `JSONB` payload defines how it looks.
* **Soft Deletes:** Nothing is ever `DELETE`d. We use `deletedAt` timestamps to preserve historical AR analytics and scene states.
* **UUIDv4 Primary Keys:** Essential for offline syncing, distributed systems, and security against ID-guessing.

---

## 2. The Complete `schema.prisma` Blueprint

*Developer Instruction: Place this in `packages/database/prisma/schema.prisma`.*

```prisma
// ------------------------------------------------------
// 1. DATABASE CONFIGURATION
// ------------------------------------------------------
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ------------------------------------------------------
// 2. ENUMS (System Constants)
// ------------------------------------------------------
enum PublishStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum NodeType {
  MEDIA       // Image, Video, 3D Object
  UI_PANEL    // Server-Driven UI (Forms, Buttons, Text)
  TRIGGER     // Invisible spatial zone that triggers an action
}

// ------------------------------------------------------
// 3. CORE TENANT & AUTHENTICATION
// ------------------------------------------------------
model Organization {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @db.VarChar(255)
  slug        String   @unique @db.VarChar(100)
  createdAt   DateTime @default(now())
  
  // Relations
  places      Place[]
  experiences Experience[]
  content     ContentAsset[]

  @@map("organizations")
}

model User {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @db.Uuid
  email          String       @unique
  role           String       @default("VIEWER") // SYSTEM_ADMIN, ORG_ADMIN, CREATOR, VIEWER
  
  organization   Organization @relation(fields: [organizationId], references: [id])

  @@index([organizationId])
  @@map("users")
}

// ------------------------------------------------------
// 4. PHYSICAL WORLD DEFINITION
// ------------------------------------------------------
model Place {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @db.Uuid
  parentId       String?  @db.Uuid // For Hierarchy (e.g., College -> CSE Dept -> Lab 3)
  name           String   @db.VarChar(255)
  qrTargetId     String   @unique @db.VarChar(255) // The actual string encoded in the QR
  
  // Geospatial limits (Optional: to prevent scanning QR from miles away)
  latitude       Float?
  longitude      Float?

  organization   Organization @relation(fields: [organizationId], references: [id])
  parent         Place?       @relation("PlaceHierarchy", fields: [parentId], references: [id])
  children       Place[]      @relation("PlaceHierarchy")
  experiences    Experience[] // One place can have multiple experiences over time

  @@index([organizationId])
  @@index([qrTargetId])
  @@map("places")
}

// ------------------------------------------------------
// 5. THE EXPERIENCE (The AR Wrapper)
// ------------------------------------------------------
model Experience {
  id             String        @id @default(uuid()) @db.Uuid
  organizationId String        @db.Uuid
  placeId        String        @db.Uuid
  name           String        @db.VarChar(255)
  version        Int           @default(1)
  status         PublishStatus @default(DRAFT)
  
  // Relations
  organization   Organization  @relation(fields: [organizationId], references: [id])
  place          Place         @relation(fields: [placeId], references: [id])
  spatialNodes   SpatialNode[] // The actual 3D items inside this experience

  @@unique([placeId, status, version]) // Only one PUBLISHED experience per place at a time
  @@map("experiences")
}

// ------------------------------------------------------
// 6. SPATIAL SCENE GRAPH (The Abstract Render Layer)
// ------------------------------------------------------
// IMPORTANT: This table is what makes the AR Engine "Dumb".
// It holds EVERYTHING in the 3D space, regardless of what it is.
model SpatialNode {
  id             String     @id @default(uuid()) @db.Uuid
  experienceId   String     @db.Uuid
  nodeType       NodeType
  
  // Transform Matrix (Position, Rotation, Scale relative to QR anchor)
  positionX      Float      @default(0)
  positionY      Float      @default(0)
  positionZ      Float      @default(0)
  rotationX      Float      @default(0)
  rotationY      Float      @default(0)
  rotationZ      Float      @default(0)
  scaleX         Float      @default(1)
  scaleY         Float      @default(1)
  scaleZ         Float      @default(1)

  // Abstract References
  // If nodeType == MEDIA, this points to ContentAsset
  // If nodeType == UI_PANEL, this points to ComponentTemplate
  referenceId    String     @db.Uuid 

  experience     Experience @relation(fields: [experienceId], references: [id], onDelete: Cascade)

  @@index([experienceId])
  @@map("spatial_nodes")
}

// ------------------------------------------------------
// 7. PLATFORM DEFINITIONS (The Schema Layer)
// ------------------------------------------------------
model ComponentDefinition {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @db.Uuid
  name           String       @db.VarChar(255) // e.g., "Doctor Card"
  schema         Json         @db.JsonB        // The strict metadata requirements
  
  organization   Organization @relation(fields: [organizationId], references: [id])
  components     ComponentTemplate[]

  @@map("component_definitions")
}

model ServiceDefinition {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @db.Uuid
  name           String       @db.VarChar(255) // e.g., "Appointment Booking"
  payloadSchema  Json         @db.JsonB
  
  organization   Organization @relation(fields: [organizationId], references: [id])
  actions        ActionDefinition[]

  @@map("service_definitions")
}

// ------------------------------------------------------
// 8. CONTENT & UI INSTANCES
// ------------------------------------------------------
model ContentAsset {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @db.Uuid
  assetType      String       // IMAGE, VIDEO, 3D_GLB, AUDIO
  url            String       @db.Text
  metadata       Json?        // { "duration": 15, "resolution": "1080p" }

  organization   Organization @relation(fields: [organizationId], references: [id])

  @@map("content_assets")
}

model ComponentTemplate {
  id                    String              @id @default(uuid()) @db.Uuid
  componentDefinitionId String              @db.Uuid
  name                  String              @db.VarChar(255)
  
  // Conforms strictly to the ComponentDefinition schema
  uiLayout              Json                @db.JsonB 
  
  definition            ComponentDefinition @relation(fields: [componentDefinitionId], references: [id])
  
  @@map("component_templates")
}

// ------------------------------------------------------
// 9. ACTIONS (Interaction Webhooks)
// ------------------------------------------------------
model ActionDefinition {
  id                  String             @id @default(uuid()) @db.Uuid
  serviceDefinitionId String             @db.Uuid
  name                String             @db.VarChar(255)
  serviceType         String             // WEBHOOK, INTERNAL_MUTATION
  targetUrl           String?            @db.Text
  
  // The actual payload mapping for this specific action
  payloadMap          Json?              @db.JsonB 

  service             ServiceDefinition  @relation(fields: [serviceDefinitionId], references: [id])

  @@map("action_definitions")
}
3. Deep Dive: How the Abstraction Works (The Magic)
A developer might ask: "Where is the table for Canteen Menu?"
Answer: There isn't one. The platform uses the ComponentTemplate and the JSONB field to construct it dynamically.

Example: Storing a Form in the Database
Instead of writing 100 lines of Android/iOS UI code, the Admin Dashboard inserts this JSON into the ComponentTemplate.uiLayout field:

JSON
{
  "type": "VERTICAL_STACK",
  "background": "surface_dark",
  "children": [
    {
      "type": "TEXT_HEADER",
      "value": "Table 5 Express Order"
    },
    {
      "type": "DROPDOWN",
      "id": "item_selection",
      "dataSource": "[https://api.canteen.com/menu](https://api.canteen.com/menu)" 
    },
    {
      "type": "BUTTON",
      "label": "Place Order",
      "actionId": "action_uuid_for_booking_webhook"
    }
  ]
}
The Developer Workflow:
The DB Admin runs this schema.

The Backend Engineer writes the "Compiler" to read Experience -> SpatialNode -> ComponentTemplate and sends the compiled JSON to the phone.

The AR Engineer writes a generic parser that loops through "children" and draws a Unity/SwiftUI Button on the screen if it reads "type": "BUTTON".

4. Querying the Database (Developer Implementation Example)
When the AR Engine scans a QR Code (e.g., QR_CAFE_01), the Backend Engineer writes this exact Prisma query to fetch the entire scene in one database trip:

TypeScript
// Fetching the master scene payload efficiently
const sceneData = await prisma.place.findUnique({
  where: { qrTargetId: 'QR_CAFE_01' },
  include: {
    experiences: {
      where: { status: 'PUBLISHED' },
      include: {
        spatialNodes: true // Gets all X,Y,Z coordinates and component reference IDs
      }
    }
  }
});

***

### How is this level of detail? 
This is exactly what a backend developer needs to scaffold the PostgreSQL database today. 

The next step is **`03_API_Contracts.md`**. This will define the exact JSON payload that the