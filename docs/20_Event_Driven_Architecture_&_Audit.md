# SpatialOS Blueprint: Event-Driven Architecture and Audit

**Document ID:** 20_Event_Driven_Architecture_&_Audit  
**Target Audience:** Core Backend Engineers, Security Architects  
**Objective:** Define the internal Domain Event Bus and the immutable System Audit Ledger. This ensures decoupled asynchronous processing and guarantees traceability of all system actions.

---

## 1. Events (Event-Driven Architecture)

**Purpose:** Decouple system modules by broadcasting "Something happened" (Domain Events) rather than using direct function calls between modules.  
**Responsibilities:** Event generation, asynchronous dispatch, retry handling, dead-letter queues.  
**Non-Responsibilities:** Synchronous API responses (Events are "fire and forget").

### The Event Model
An event represents a fact that has already occurred. It is immutable.

```typescript
interface DomainEvent {
  eventId: string;           // UUIDv4
  eventType: string;         // e.g., 'EXPERIENCE_PUBLISHED'
  timestamp: string;         // ISO8601
  actor: ActorContext;       // Copied from IAM Context
  resourceId: string;        // ID of the mutated resource
  payload: any;              // Delta or before/after state
  correlationId: string;     // To track the root API request
}
```

### Dispatch and Workflow
1. **Trigger:** A Generic CRUD operation succeeds.
2. **Dispatch:** The CRUD module pushes a `DomainEvent` to the internal Event Bus (e.g., Redis Pub/Sub, Kafka, or Node Event Emitter).
3. **Consumption:** Independent background workers subscribe to `eventType`s. 
   - *Example:* The Search Indexer subscribes to `PLACE_CREATED`. The Audit Ledger subscribes to `*`.

### Idempotency & Failure Handling
- **Consumer Rules:** All event consumers *must* be idempotent. If the Bus delivers `EXPERIENCE_PUBLISHED` twice, the consumer must gracefully handle the duplicate without corrupting data.
- **Failures:** If a consumer fails to process an event, the Bus implements exponential backoff. After max retries, it moves the event to a Dead-Letter Queue (DLQ).

---

## 2. Audit (The System Ledger)

**Purpose:** Maintain a strict, immutable, append-only ledger of "Who did what, to which resource, and when."  
**Responsibilities:** Action tracking, compliance, historical state queries.  
**Non-Responsibilities:** Analytics (Analytics tracks *users scanning AR*; Audit tracks *admins changing the system*).

### The Audit Workflow
The Audit module is entirely decoupled. It acts as an omnipresent listener on the Event Bus.

1. **Listen:** The Audit Worker subscribes to all system mutation events (`*:CREATED`, `*:UPDATED`, `*:DELETED`).
2. **Transform:** It wraps the `DomainEvent` into an `AuditRecord`.
3. **Persist:** It writes to a highly secured, append-only data store (e.g., a specific Postgres table where `UPDATE` and `DELETE` SQL permissions are revoked at the database level).

### Audit Record Structure
```prisma
model AuditRecord {
  id             String   @id @default(uuid()) @db.Uuid
  correlationId  String   @db.Uuid
  organizationId String   @db.Uuid  // For strict tenant filtering
  actorId        String   // Who did it
  actorRole      String   // Their role at the time
  action         String   // e.g., 'PLACE_DELETED'
  resourceId     String   // The place ID
  beforeState    Json?    // State before mutation
  afterState     Json?    // State after mutation
  timestamp      DateTime @default(now())

  @@index([organizationId, resourceId])
}
```

### Security & Integrity
- **Immutability:** Even a `SYSTEM_ADMIN` must not have application-level API endpoints to edit or delete an `AuditRecord`.
- **Tenant Isolation:** When an `ORG_ADMIN` views their audit log, the query is strictly bounded by `where: { organizationId: actor.organizationId }`.

---

## 3. Integration & Dependency Direction

**Flow:** `CRUD` → (Emits) → `Event Bus` → (Subscribes) → `Audit Worker` → (Writes to) → `Audit DB`.

- **CRUD depends on:** Event Bus Interface (to emit).
- **Audit depends on:** Event Bus Interface (to listen).
- **Crucially:** CRUD *does not* depend on Audit. If the Audit database goes down, CRUD operations continue successfully, and events queue up in the Bus to be audited later. This guarantees high availability for the core API.
