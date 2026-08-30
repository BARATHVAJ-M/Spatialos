# SpatialOS Implementation Specification: Development Workflow & Git Rules

**Document ID:** 16_Development_Workflow_&_Git_Rules
**Target Audience:** All Software Engineers, Engineering Managers
**Objective:** Define the strict rules of engagement for modifying the SpatialOS codebase, ensuring architectural purity, high stability, and zero regressions.

---

## 1. Branching Strategy (Trunk-Based Development)

We use a fast, Trunk-Based Git workflow. No long-lived feature branches.

- **`main`**: The sacred production branch. Code here is actively running on the production servers.
- **`feat/ticket-name`**: For adding new capabilities (e.g., `feat/add-dropdown-component`).
- **`fix/ticket-name`**: For patching bugs (e.g., `fix/ar-canvas-crash`).

### The Golden Rule:
Developers **cannot** push directly to `main`. All changes must go through a Pull Request (PR) and pass automated CI checks.

---

## 2. The PR Checklist (Automated CI Gates)

Before a Pull Request can be merged into `main`, the Turborepo CI pipeline automatically runs. It will block the merge if any of these checks fail:

1. **Type Checking:** `npx turbo run typecheck`. (If the backend changes a field from `buttonStyle` to `variant`, the AR Engine types will instantly break, catching the error before it hits production).
2. **Linting:** `npx turbo run lint`. Ensures code style consistency using ESLint and Prettier.
3. **Database Migration Sync:** If a developer alters `schema.prisma`, they MUST commit the generated SQL migration file. The CI will fail if the schema is out of sync with the migrations folder.

---

## 3. The "No Industry Hacks" Rule

The most critical architectural law of SpatialOS (defined in Doc 00 and 01) is that the core system must remain generic.

**Code Reviewers MUST reject a PR if it contains code like this:**
```typescript
// ❌ REJECTED: Hardcoded industry logic inside the core engine
if (place.name === "College Classroom") {
  showAttendanceButton();
}
```

**How to approve it:**
```typescript
// ✅ APPROVED: Data-Driven architecture
if (spatialNode.nodeType === 'UI_PANEL') {
  renderComponent(spatialNode.uiPayload.layout);
}
```
*If a college wants an attendance button, the Admin drags and drops it in the Visual Editor. The core code never changes.*

---

## 4. Prisma Migration Workflow

If a backend developer needs to add a new column to the database (e.g., adding `backgroundColor` to the `ComponentTemplate` table):

1. Edit `packages/database/prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name add_background_color`.
3. This generates a SQL file in the `/migrations` folder.
4. **Commit both the schema and the SQL file.** 
5. When the CI/CD script runs on the production server (Doc 09), it will run `npx prisma migrate deploy` to safely apply the SQL to the live PostgreSQL database.

---

## 5. Releasing Mobile Updates

Because SpatialOS uses a **Server-Driven UI (SDUI)** architecture, you rarely need to release updates to the iOS App Store or Google Play Store.

- **New UI, New Workflows, New Content:** No mobile app update needed. The Admin publishes it, and the AR client fetches the new JSON instantly.
- **Mobile Updates are ONLY for:** Upgrading the underlying AR renderer (e.g., Unity engine version bumps), fixing native Bluetooth/Camera bugs, or adding entirely new primitive capabilities (like supporting a brand new type of sensor).

By adhering to these Git workflows and architectural boundaries, a small team can securely support thousands of organizations on the platform without drowning in technical debt.
