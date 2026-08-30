# SpatialOS Blueprint: IAM, Policy, and Generic CRUD

**Document ID:** 19_IAM_Policy_&_Generic_CRUD  
**Target Audience:** Core Backend Engineers, Security Architects  
**Objective:** Define the Identity & Access Management (IAM), Policy Enforcement, and Generic CRUD blueprints. These capabilities ensure strict tenant isolation and generic data manipulation without hardcoding domain-specific rules.

---

## 1. IAM (Identity & Access Management)

**Purpose:** Verify *Who* is making the request (Identity) and what permissions they hold (Roles/Scopes).  
**Responsibilities:** Authentication, Tenant (Organization) identification, Role assignment, Session management.  
**Non-Responsibilities:** Policy enforcement (IAM identifies the actor; Policy decides the action).

### Components & Data Flow
- **Identity Provider (IdP):** Issues JWT tokens. Can be standard email/password or OAuth.
- **Actor Context:** Extracted from the JWT on every request:
  ```typescript
  interface ActorContext {
    userId: string;
    organizationId: string; // The strictly enforced tenant boundary
    role: "SYSTEM_ADMIN" | "ORG_ADMIN" | "EDITOR" | "VIEWER";
    serviceIdentity?: boolean; // True if invoked by internal system
  }
  ```
- **Authentication Flow:** 
  Request → `AuthGuard` (Validates JWT) → Attaches `ActorContext` to `req.user`.

### Security & Boundaries
- **Tenant Isolation:** A user from `org_A` must *never* be able to act upon resources in `org_B`. This boundary is injected immediately after authentication.
- **Dependency Direction:** Every module (CRUD, Search, Reporting) depends on the IAM `ActorContext`. IAM depends on nothing.

---

## 2. Policy Enforcement

**Purpose:** Evaluate if the authenticated `ActorContext` is allowed to perform a specific `Action` on a `Resource`.  
**Responsibilities:** ABAC/RBAC evaluation, Allow/Deny resolution.  
**Non-Responsibilities:** Authentication (IAM's job), Resource fetching (CRUD's job).

### Policy Model
- **Subject:** The `ActorContext` (User).
- **Action:** e.g., `experience:publish`, `place:delete`.
- **Resource Context:** The entity being modified (must match the actor's `organizationId`).

### Policy Enforcement Workflow
Instead of hardcoding checks inside CRUD controllers (`if (user.role === 'ADMIN')`), we use abstract Policy Interceptors/Guards.

```typescript
// Example Implementation Rule
@UseGuards(JwtAuthGuard, PoliciesGuard)
@CheckPolicies((ability: AppAbility) => ability.can(Action.Delete, Place))
@Delete(':id')
async deletePlace(@Param('id') id: string) { ... }
```

### Failure Handling
- If Policy evaluation fails, the system immediately throws a `403 Forbidden` exception. This error is standardized globally.
- The rejection is *logged* but *not audited* as a domain event, as no state mutation occurred.

---

## 3. Generic CRUD Abstraction

**Purpose:** Provide a uniform, generic persistence layer for creating, reading, updating, and deleting resources, strictly adhering to IAM and Policy boundaries.  
**Responsibilities:** Database transaction boundaries, validation, pagination, sorting, filtering, and lifecycle hook emission.  
**Non-Responsibilities:** Business logic (handled by Action Broker), Event publishing logic (handled by Event Bus).

### Generic Interfaces
All CRUD operations must accept a standardized query context to prevent duplicate logic.

**Input Context:**
```typescript
interface CrudRequestContext<T> {
  actor: ActorContext; // Enforces tenant boundary
  filters?: Partial<T>;
  sort?: { field: string, order: 'ASC' | 'DESC' };
  pagination?: { limit: number, offset: number };
}
```

### The Universal CRUD Workflow
1. **Validate:** Check input payload against DTO schema.
2. **Authenticate:** (Handled upstream by IAM Guard).
3. **Authorize:** (Handled upstream by Policy Guard).
4. **Tenant Check (Crucial):** Inject `where: { organizationId: actor.organizationId }` into the persistence abstraction (e.g., Prisma).
5. **Execute:** Perform the database transaction.
6. **Emit Event:** On success, emit a generic Domain Event (e.g., `RESOURCE_CREATED`).
7. **Return:** Standardized response.

### Error Handling, Idempotency & Concurrency Locks
- **Not Found (404):** Returned if the resource doesn't exist *or* belongs to a different tenant.
- **Conflict (409):** Returned on unique constraint violations.
- **Idempotency Keys:** `PUT` and `DELETE` requests must naturally be idempotent. For critical `POST` actions (like executing a Service), the backend mandates an `Idempotency-Key` header to prevent double-charging or double-submissions caused by user double-clicks or network retries.
- **Distributed Locking (Mutex):** To prevent race conditions, any heavy or state-critical mutation (e.g., "Publishing an Experience") must acquire a distributed lock (like a Redis Mutex) keyed to the `resourceId`. If a concurrent request arrives while the lock is held, it is instantly rejected.

### Testing Blueprint
- **Authorization Testing:** Verify that a user from `org_A` attempting to `GET` a resource from `org_B` receives a `404 Not Found` (preventing data leakage).
- **Policy Testing:** Verify that a user with `VIEWER` role receives a `403 Forbidden` when executing `DELETE`.

---

## 4. Integration Summary

**Flow:** Request → `IAM (AuthGuard)` → `Policy (PoliciesGuard)` → `Generic CRUD Controller` → `Database` → `Event Bus` (Covered in Doc 20).

By keeping CRUD generic and extracting Policy logic, we ensure that adding a new resource (e.g., `Floorplans`) requires zero new security code—it automatically inherits tenant isolation and role-based access.
