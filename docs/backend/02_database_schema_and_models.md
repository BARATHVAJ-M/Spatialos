# Database Schema & Models

## 1. Database Philosophy & Technology
SpatialOS is fundamentally a data-driven application that requires strict relational integrity. To achieve this, the backend is built on top of **PostgreSQL**.

*   **ACID Compliance**: We rely on PostgreSQL's strict ACID guarantees to ensure that complex relationships (like tying an AR node to a specific experience version inside a specific location) are never orphaned or corrupted.
*   **Prisma ORM**: We use `Prisma` as our Object-Relational Mapper. Prisma provides a highly declarative `schema.prisma` file which serves as our single source of truth. It auto-generates a fully type-safe TypeScript client, drastically reducing runtime errors caused by mismatched database queries.
*   **UUIDs for Security**: Every primary key in the system (`id`) utilizes UUIDs (v4) rather than auto-incrementing integers. This prevents Insecure Direct Object Reference (IDOR) attacks, ensuring malicious users cannot simply guess the next incremental ID to scrape experiences or organizations.

---

## 2. Multi-Tenancy Design
SpatialOS is designed as a Multi-Tenant SaaS platform. 

The **`Organization`** model acts as the root boundary for tenancy. 
To guarantee data isolation, almost every core entity in the system—including `User`, `Place`, `Experience`, `ServiceInstance`, `ContentAsset`, and `StaffDirectory`—contains an `organizationId` foreign key. 
Backend services enforce this boundary heavily; users querying data will only ever receive records that match their verified `organizationId`.

---

## 3. Core Entity Relationships (The Data Dictionary)

Below is the breakdown of the core domains modeled in `prisma/schema.prisma`.

### Users & Security
*   **`User`**: The core authentication entity. Includes standard fields (`email`, `name`, `role`), alongside robust security fields for lockout mechanisms (`loginAttempts`, `lockedUntil`, `otpAttempts`, `otpLockedUntil`).
*   **`AuthAuditLog`**: An immutable ledger tracking login attempts (SUCCESS, FAILED, LOCKED) and capturing IP addresses for forensic security auditing.

### Spatial Mapping
*   **`Place`**: Represents a physical location in the real world. It supports a hierarchical structure (via `parentId`) allowing nested locations (e.g., A building containing multiple rooms). Critical fields include `latitude`, `longitude`, and `qrTargetId` (the physical anchor trigger).
*   **`Experience`**: An AR Experience tied to a specific `Place`. Experiences are version-controlled (`version` integer) and go through a `PublishStatus` lifecycle (`DRAFT`, `PUBLISHED`, `ARCHIVED`).

### AR Engine Models
*   **`SpatialNode`**: The fundamental building block of the 3D world. It stores the precise 3D math required by the AR engines (Flutter/ARCore/ARKit):
    *   **Position**: `positionX`, `positionY`, `positionZ`
    *   **Rotation**: `rotationX`, `rotationY`, `rotationZ`
    *   **Scale**: `scaleX`, `scaleY`, `scaleZ`
*   **`NodeType` Enum**: Defines what the SpatialNode actually *is*. Current values include `MEDIA` (photos/videos), `UI_PANEL` (Flutter UI overlays), and `TRIGGER` (invisible collision zones).

### Service & App Engine
These tables power the "Mini Apps" and dynamic logic injected into the AR experiences.
*   **`ServiceDefinition`**: The blueprint of an available app (e.g., "Weather App v1"). Contains JSON schemas dictating what configuration is allowed.
*   **`ServiceInstance`**: An actual deployment of a `ServiceDefinition` injected into a specific `Experience`.
*   **`ActionDefinition`**: Action triggers (like webhooks) that a service can execute when interacted with in AR.

### Asset Management
*   **`ContentAsset`**: Centralized registry for all uploaded files. It stores the `assetType` (e.g., IMAGE, VIDEO) and the absolute `url` to where the generic Storage Adapter placed the file.

---

## 4. Indexing & Performance Strategy
To ensure rapid query execution as tables grow to millions of rows, strategic indexes are defined directly in the Prisma schema:

*   **Tenant Scoping Indexes**: `@@index([organizationId])` is placed on heavily queried tables like `User`, `Place`, and `StaffDirectory` to drastically speed up multi-tenant filtering.
*   **Compound Unique Constraints**: `@@unique([placeId, status, version])` on the `Experience` table ensures that a specific physical place cannot have duplicate "Published" versions of the exact same experience.
*   **Cascade Deletions**: The schema utilizes `onDelete: Cascade` aggressively. For example, if an `Experience` is deleted, all its `SpatialNode` and `ServiceInstance` children are automatically destroyed by PostgreSQL, preventing orphaned data buildup.

---

## 5. Prisma Migration Workflow (Developer Runbook)

When modifying the database structure, backend developers must follow this strict workflow to prevent data loss:

1.  **Modify Schema**: Edit the `prisma/schema.prisma` file.
2.  **Generate Migration**: Run `npx prisma migrate dev --name <descriptive_name>`.
    *   *Do not* manually run `npx prisma db push` in production; `db push` is for rapid prototyping and circumvents migration history.
3.  **Deploy**: The deployment pipeline will automatically run `npx prisma migrate deploy` to safely apply the SQL migration scripts to the production database without dropping tables.
