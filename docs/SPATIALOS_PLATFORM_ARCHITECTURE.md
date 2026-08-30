# SPATIALOS PLATFORM ARCHITECTURE

This document is the official high-level architecture and structural definition of the SpatialOS platform. It serves as the definitive guide to the generic platform skeleton, defining what the platform contains, module responsibilities, their interrelationships, and the mechanisms by which SpatialOS connects the physical and digital worlds.

---

## 1. PLATFORM PURPOSE

SpatialOS is a **generic spatial computing platform** designed to connect digital information, interactive services, and spatial experiences directly to physical places. 

At its core, the platform operates on this concept:
**Physical Place → Experience → Components → Content / Services → Spatial Scene → Publish → User App / AR Engine**

The platform is designed to be completely agnostic to any specific industry. While it can be deployed in colleges, hospitals, malls, restaurants, museums, or airports, these are merely examples of organizations utilizing the platform. The architecture is explicitly built around **generic abstractions** rather than hardcoded use cases.

---

## 2. CORE PLATFORM PRINCIPLE

> "Do not build the platform around industries. Build the platform around reusable capabilities."

The platform is built on fundamental primitives:

- **PLACE**: A physical location in the real world. A college classroom, a hospital emergency ward, and a mall store are all "Places". They use the exact same platform abstraction.
- **EXPERIENCE**: What a user receives or interacts with at a Place.
- **COMPONENT**: A reusable UI or spatial building block (e.g., an information card, a button).
- **CONTENT**: The underlying data/assets (text, images, 3D models) injected into Components.
- **SERVICE**: A business operation that can be executed (e.g., booking, ordering, requesting).
- **SPATIAL SCENE**: The 3D arrangement of digital objects in a physical space.
- **SPATIAL OBJECT**: A specific digital entity (e.g., a plane, a video, a 3D model) existing in the scene.
- **ACTION**: An interaction triggered by the user (e.g., tap, select, submit).
- **PUBLISH**: The mechanism of deploying an experience to make it live for end-users.
- **VERSION**: An immutable snapshot of an experience or scene.
- **USER**: An individual consuming or managing the platform.
- **ORGANIZATION**: The tenant managing the Places, Experiences, and Users.

---

## 3. HIGH-LEVEL SYSTEM ARCHITECTURE

The SpatialOS Platform is composed of five high-level systems:

```text
SPATIALOS PLATFORM
│
├── ADMIN DASHBOARD
├── BACKEND / PLATFORM SERVICES
├── USER APP
├── AR ENGINE
└── PHYSICAL WORLD
```

### Module Responsibilities

**ADMIN DASHBOARD**
- Manages the platform visually.
- Creates and updates Places, configures Experiences, and manages Content/Services.
- Manages users, access, spatial configuration, and publishing/versioning.
- Monitors platform health.

**BACKEND / PLATFORM SERVICES**
- The central orchestration layer.
- Owns business rules, persistence orchestration, authorization, and publishing.
- Owns experience configuration, content metadata, and service operations.
- Communicates with infrastructure (databases, storage) through abstractions.

**USER APP**
- The user-facing application (client).
- Discovers Places, requests Experiences, displays information, and interacts with Services.
- Communicates with the AR Engine to display spatial data.

**AR ENGINE**
- An independent spatial computing subsystem.
- Responsible for detection, world tracking, localization, anchors, and spatial coordinates.
- Handles scene management, rendering, object placement, and environment understanding.
- **IMPORTANT**: The AR Engine must NOT contain organization-specific business logic.

---

## 4. ADMIN DASHBOARD ARCHITECTURE

The Admin Dashboard provides the management interface for the entire platform.

```text
ADMIN DASHBOARD
│
├── OVERVIEW
├── PLACES
├── EXPERIENCES
├── COMPONENTS
├── CONTENT
├── SERVICES
├── USERS & ACCESS
├── SPATIAL / AR
├── PUBLISH
└── MONITOR
```

- **OVERVIEW**: High-level platform metrics and active deployments.
- **PLACES**: Manages physical locations and coordinates. Does not manage the actual 3D rendering.
- **EXPERIENCES**: Composes Components, Services, and Scenes. Does not hardcode industries.
- **COMPONENTS**: Configures reusable building blocks.
- **CONTENT**: Manages raw assets (images, 3D models). Independent of Experiences.
- **SERVICES**: Configures business operations (e.g., booking endpoints).
- **USERS & ACCESS**: Manages identities, roles, and permissions.
- **SPATIAL / AR**: Defines spatial anchors and scene graphs. Does not execute rendering.
- **PUBLISH**: Manages drafts, validations, previews, and deployments.
- **MONITOR**: Observability for platform health, usage, and errors.

---

## 5. PLACES

> "Where an experience exists in the physical world."

```text
PLACE
├── Identity
├── Name
├── Type
├── Parent Place
├── Physical Location
├── Spatial Identity
├── QR / Localization Identity
├── Status
└── Assigned Experiences
```

A Place is strictly generic and supports parent/child hierarchies. 
- **College Example**: Department Entrance → Classroom → Staff Room
- **Hospital Example**: Emergency → Pharmacy → Reception
- **Mall Example**: Entrance → Store → Food Court

*These examples must never become hardcoded platform types.*

---

## 6. EXPERIENCES

> "Experience = what a user receives at a Place."

```text
EXPERIENCE
├── Identity
├── Configuration
├── Components
├── Content References
├── Service References
├── Spatial Scene
├── Interaction Rules
├── Permissions
├── Version
└── Status
```

Experiences are merely configurations. A "Hospital Experience" and a "Mall Experience" use the same core implementation, differing only in the Components, Content, and Services they reference.

---

## 7. COMPONENT SYSTEM

Components are reusable building blocks that present information, expose interactions, reference content, and trigger actions/services. They can exist in standard 2D UI or spatial 3D UI.

**Conceptual Examples**:
Information, Announcement, Faculty Card, Doctor Card, Product Card, Menu, Form, Button, Media, Navigation, AI Assistant.

*These are examples of component types, not hardcoded limitations. Experiences are composed of these reusable Components.*

---

## 8. COMPONENT DEFINITIONS / METADATA

To ensure the platform remains extensible without modifying the AR Engine or User App binaries, Components rely on a definition layer:

```text
PLATFORM DEFINITIONS
│
├── Component Definitions
├── Service Definitions
├── Experience Definitions
├── Object Definitions
└── Validation Rules
```

A "Faculty Card" and a "Doctor Card" may look structurally identical but represent different data. The platform allows these definitions to be configured generically, ensuring new use cases don't require core codebase rewrites.

---

## 9. CONTENT SYSTEM

> "Content = information/assets used by Experiences and Components."

```text
CONTENT
├── Text
├── Image
├── Video
├── 3D Asset
├── Document
├── Structured Data
└── Other Supported Assets
```

Content is strictly separated from Experience definitions. 
An "Achievement Component" simply references "Achievement Content". This separation allows admins to update text or replace a video without having to rebuild or republish the entire Experience architecture.

---

## 10. SERVICE SYSTEM

> "Service = something the user can perform rather than merely view."

Services contain business operations and rules.

**Conceptual Examples**:
Complaint, Booking, Ordering, Registration, Request, Token, Appointment.

- **Canteen Experience**: Uses the Menu Component to trigger an *Ordering Service*.
- **Classroom Experience**: Uses the Information Component to trigger a *Task Service*.
- **Hospital Experience**: Uses the Doctor Component to trigger an *Appointment Service*.

**IMPORTANT**: Services and business logic belong in the Backend/Platform layer. They must never be hardcoded into the AR Engine.

---

## 11. ACTION SYSTEM

Actions bridge the gap between UI Components and backend Services.

- **COMPONENT** = What is presented.
- **ACTION** = What the user does (e.g., Open, Select, Submit, Book, Order).
- **SERVICE** = What business operation happens after the action.

*Example:* Menu Component → Select Action → Ordering Service.

---

## 12. SPATIAL / AR SYSTEM

Spatial represents the mathematical and visual connection between digital objects and physical space.

```text
SPATIAL
├── Spatial Identity
├── Localization
├── Detection
├── World Tracking
├── Anchors
├── Coordinates
├── Spatial Scene
├── Spatial Objects
├── Placement
└── Spatial Interaction
```

The **AR Engine** owns the mathematical and computational execution (tracking, detection). The **Backend/Dashboard** owns the configuration (where things should go).

---

## 13. SPATIAL SCENE

> "Spatial Scene = the spatial arrangement of digital objects belonging to an Experience."

```text
SPATIAL SCENE
│
├── Root
│   └── Plane / Spatial Container
│       ├── Image
│       ├── Video
│       ├── Text
│       ├── 3D Object
│       ├── Button
│       └── Mini App
│
└── Spatial Relationships
```

The scene defines parent/child hierarchies, transforms (position, rotation, scale), visibility, and spatial identities. The scene definition is declarative and entirely independent of the underlying rendering framework.

---

## 14. SPATIAL OBJECT SYSTEM

Generic elements that exist within a Spatial Scene.

Every Spatial Object conceptually maintains:
- Identity, Type, Transform, Parent, Children, Visibility, Content Reference, Interaction Capability, State, and Permissions.

*Examples include Planes, Images, 3D Objects, Forms, and Mini Apps. No rendering code is defined at this architectural level.*

---

## 15. MINI-APP ARCHITECTURE

Mini Apps are optional, interactive micro-experiences running securely inside SpatialOS.

- A Mini App is an Experience/Component capability (e.g., Coffee ordering, Token generation).
- It may utilize Services, Content, and Spatial UI.
- **Crucially**, it remains strictly isolated from the AR Engine core. The AR Engine provides the rendering sandbox, while the business rules execute outside the renderer.

---

## 16. USER SYSTEM

```text
USERS & ACCESS
├── Identity
├── Authentication
├── Roles
├── Permissions
├── Organizations
├── Memberships
└── Activity
```

User identity and authorization are platform-level concerns. Roles such as "Student", "Doctor", or "Patient" are not hardcoded platform entities; they are configurable roles assigned based on Organization policies.

---

## 17. ORGANIZATION MODEL

```text
ORGANIZATION
│
├── Users
├── Places
├── Experiences
├── Content
├── Services
└── Policies
```

SpatialOS is natively multi-tenant. A single platform deployment can simultaneously support a College, Hospital, Mall, Museum, and Airport through isolated Organization configurations, requiring zero modifications to the core platform.

---

## 18. PUBLISH SYSTEM

```text
DRAFT → VALIDATE → PREVIEW → PUBLISH → LIVE
```

Publishing is explicitly isolated from live editing. 
- Administrators edit "Draft" versions.
- Changes are validated and previewed before being "Published".
- The platform maintains version identity, change history, and rollback capabilities, ensuring in-progress edits do not break live environments.

---

## 19. MONITORING

```text
MONITOR
├── Platform Health
├── Backend Health
├── Experience Usage
├── Service Activity
├── Errors
├── Performance
├── Storage
├── Database
└── Audit
```

Monitoring extends beyond CPU/RAM infrastructure. It measures whether Experiences load successfully, if AR detection succeeds, if Services complete properly, and audits administrator actions.

---

## 20. VERSIONING

Everything mutable requires versioning: Experiences, Spatial Scenes, Components, Services, and Content.
Versioning guarantees that a User App requesting an Experience receives a consistent, immutable snapshot, preventing live edits from corrupting an active user session.

---

## 21. MODULE OWNERSHIP

Clear ownership guarantees modularity.

**Example: AR ENGINE**
- **May**: Receive scene definitions, render objects, track environment, process gestures.
- **Must NOT**: Modify business databases, implement booking rules, contain college-specific logic, or directly depend on the Admin Dashboard.

---

## 22. SEPARATION OF CONCERNS

- **ADMIN DASHBOARD**: Management
- **BACKEND**: Platform & Business Orchestration
- **CONTENT**: Information & Assets
- **SERVICE**: Business Operations
- **EXPERIENCE**: Composition & Configuration
- **SPATIAL SCENE**: Spatial Arrangement
- **AR ENGINE**: Spatial Computation & Rendering
- **USER APP**: User-facing Application
- **PUBLISH**: Deployment & Version Control
- **MONITOR**: Observability

These boundaries ensure the platform never becomes a tightly coupled monolith.

---

## 23. DEPENDENCY DIRECTION

Dependencies must flow towards abstractions, not concrete implementations.

- **Admin Dashboard** → Platform APIs → Domain Abstractions
- **User App** → Platform APIs → Experience/Content Data
- **AR Engine** → Engine Interfaces → Spatial Scene Contracts

Direct coupling is forbidden (e.g., the AR Engine must never communicate directly with a database or storage provider). All infrastructure is accessed via strict Backend abstractions.

---

## 24. GENERIC EXTENSIBILITY RULE

> **"Adding a new industry should primarily require new configuration, components, content definitions, services, and experiences—not modification of the core AR Engine."**

**Proof of Concept:**
- **COLLEGE**: Classroom (Place) → Lecture Details (Experience) → Faculty Card (Component) → Registration (Service)
- **HOSPITAL**: Ward (Place) → Patient Portal (Experience) → Doctor Card (Component) → Appointment (Service)
- **MALL**: Storefront (Place) → Promo Viewer (Experience) → Product Card (Component) → Ordering (Service)

No separate architectures are created for these verticals.

---

## 25. FUTURE EXTENSIBILITY

The architecture treats future enhancements (AI Assistants, Navigation, Digital Twins, IoT integrations, advanced XR headsets) as modular capabilities. They are added as new Components, Services, or Engine subsystem plugins, completely preserving the core platform architecture.

---

## 26. COMPLETE FINAL STRUCTURE

```text
SPATIALOS PLATFORM
│
├── ORGANIZATION
│
├── PLACES
│
├── EXPERIENCES
│   ├── Components
│   ├── Content References
│   ├── Service References
│   ├── Spatial Scene
│   ├── Actions
│   └── Configuration
│
├── COMPONENT SYSTEM
│   └── Component Definitions
│
├── CONTENT
│
├── SERVICES
│
├── ACTIONS
│
├── SPATIAL
│   ├── Spatial Identity
│   ├── Detection
│   ├── Localization
│   ├── Tracking
│   ├── Anchors
│   ├── Coordinates
│   ├── Scenes
│   └── Spatial Objects
│
├── USERS & ACCESS
│
├── PUBLISH & VERSIONING
│
├── MONITORING
│
├── ADMIN DASHBOARD
│
├── BACKEND / PLATFORM SERVICES
│
├── USER APP
│
└── AR ENGINE
```

---

## 27. NEW-DEVELOPER EXPLANATION

- **PLACE** = Where?
- **EXPERIENCE** = What does the user get here?
- **COMPONENT** = What reusable piece is shown?
- **CONTENT** = What information does it contain?
- **ACTION** = What can the user do?
- **SERVICE** = What business operation happens?
- **SPATIAL SCENE** = Where are the digital objects positioned?
- **AR ENGINE** = How are those objects detected, tracked, positioned, rendered, and interacted with in the physical world?
- **PUBLISH** = Which version is live?
- **USER** = Who is using it?
- **ORGANIZATION** = Who manages it?
- **MONITOR** = Is everything working?

### How It Works Together
An **Organization** manages **Places** through the **Admin Dashboard**, assigning **Experiences** to them. These Experiences are built by composing reusable **Components** that display **Content** and trigger business **Services** via **Actions**. When ready, the Experience is **Published**. A **User** opens the **User App** at a physical Place, prompting the **AR Engine** to localize the environment. The backend provides the **Spatial Scene** definition, allowing the AR Engine to accurately render and track the digital objects in the physical world, all while the **Monitor** ensures the platform remains healthy.
