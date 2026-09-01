# SpatialOS Service Master Blueprint

**Document Type:** Service Definition / Implementation Blueprint
**Platform:** SpatialOS
**Version:** V1
**Status:** Approved
**Service Name:** Department Entrance
**Service Type:** entrance
**Service Version:** 1.0.0

---

# 1. Service Identity

## 1.1 Basic Information

* Service ID: `entrance`
* Service Name: Department Entrance
* Service Type: Navigation & Showcase
* Version: 1.0.0
* Description: Information and achievements for a department entrance.
* Purpose: Welcome students/guests and provide a high-level overview of the department's top achievements and core staff.
* Owner: Admin/HOD
* Status: Live

---

# 2. Service Purpose

## 2.1 Problem

Visitors and students lack context about the department they are entering. Physical trophy cases are expensive and rigid.

## 2.2 Objective

Provide a grand, welcoming AR overlay anchored to the department entrance doors highlighting the department's vision, top faculty, and recent achievements.

## 2.3 V1 Scope

* Display Welcome Message & Video/Image.
* Display Array of Achievements.
* Link to global Staff Directory to display core faculty.

---

# 3. Placement

* Place types: Corridors, Lobbies.
* Restrictions: Anchored specifically to department main entrances.

---

# 4. User Experience

## 4.1 Initial View

A large spatial rendering containing a welcome video, department description, and floating tiles representing achievements and top staff.

---

# 5. Service Structure

```text
ENTRANCE
│
├── Main Media (Welcome Video)
├── Description
├── Staff Showcase (References)
└── Achievements Showcase
```

---

# 6. Service Sections

## Section: Core Staff

### Purpose
Introduce key faculty members.

### User Actions
* `view_staff`: Tap on a staff member to see details.

### Result
Backend queries `StaffDirectory` and returns the full profile.

---

# 7. Data Model

## Configuration Fields

* `departmentName` (String)
* `description` (Text)
* `mainImage` (URL)
* `mainVideo` (URL)
* `message` (String)
* `staffIds` (Array of Strings): References `StaffDirectory.staffId`.

## Content Fields

* `achievements` (Array): `{ id, title, description, image }`
* `academicBest` (Array): `{ id, title, details }`

---

# 8. Shared / Reusable Data

## 8.1 Dependency

* Shared data source: Staff Directory Database (`schema.prisma`)
* Referenced entity: `StaffDirectory` Table
* Fields used: Name, Photo, Designation, Contact.

## 8.2 Duplication Rules

* Do not store staff photos, names, or designations in the Entrance config. Just reference the `staffId`.

---

# 10. Configuration Schema

```text
Field: staffIds
Type: Array
Required: Yes
Purpose: Links the Entrance to the central Staff Directory.
```

---

# 14. Business Logic

## Rule 1: Validate Staff IDs
**Condition:** AR App sends `view_staff` with a `staffId`.
**Action:** Verify `staffId` exists in `instanceData.configuration.staffIds`. Fetch from DB.
**Result:** Returns staff profile or throws BadRequest. Prevents unauthorized viewing of non-department staff.

---

# 16. Runtime Behavior

```text
AR Engine Loads Entrance
   ↓
Backend sends Configuration and Achievements
   ↓
User taps on Staff Member Tile
   ↓
Backend queries `StaffDirectory` dynamically
   ↓
Returns Staff details for expansion
```

---

# 17. User Actions

```text
Action: view_staff
Trigger: Tap on staff tile
Processing: db.staffDirectory.findUnique({ staffId })
Success Result: { status: 'success', data: { name, photo, designation, ... } }
```

---

# 20. Database Requirements

* `ServiceInstance` JSONB for config and achievements.
* `StaffDirectory` Postgres Table for staff resolution.

---

# 40. Acceptance Criteria

* [x] Schema configured.
* [x] Logic implemented.
* [x] `view_staff` properly queries `StaffRepository`.

---

# 44. Developer Instruction

Do not hardcode or duplicate staff JSON inside this service. You MUST use the injected `StaffRepository` to dynamically resolve the `staffId`.
