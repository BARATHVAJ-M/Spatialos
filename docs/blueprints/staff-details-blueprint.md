# SpatialOS Service Master Blueprint

**Document Type:** Service Definition / Implementation Blueprint
**Platform:** SpatialOS
**Version:** V1
**Status:** Approved
**Service Name:** Staff Details
**Service Type:** staff-details
**Service Version:** 1.0.0

---

# 1. Service Identity

## 1.1 Basic Information

* Service ID: `staff-details`
* Service Name: Staff Details
* Service Type: Staff
* Version: 1.0.0
* Description: Profile, contact, and timetable for a staff member.
* Purpose: Display a specific professor's profile outside their cabin.
* Owner: Admin

---

# 2. Service Purpose

## 2.1 Problem
Finding a specific professor's cabin, knowing if they are available, or getting their contact info requires asking around.

## 2.2 Objective
Anchored directly to their office door, this service acts as a dynamic digital nameplate.

---

# 5. Service Structure

```text
STAFF DETAILS
│
├── Profile (Photo, Name, Designation)
├── Contact Methods (Email, Ext)
└── Timetable (If configured)
```

---

# 7. Data Model

## Configuration Fields
* `staffId` (String): Reference to Staff DB.
* `displayTimetable` (Boolean)
* `displayContact` (Boolean)

## Content Fields
* None. (100% Referenced).

---

# 8. Shared / Reusable Data

## 8.1 Dependency

* Shared data source: Staff Directory Database
* Referenced entity: `StaffDirectory` Table

## 8.2 Duplication Rules

* THIS SERVICE STORES NO CONTENT. It is 100% reference-based.

---

# 14. Business Logic

## Rule 1: Reference Validation
**Condition:** App requests profile payload.
**Action:** Verify `staffId` exists in configuration and DB.
**Result:** Inject DB results into runtime payload. Filter out contact/timetable if booleans are false.

---

# 17. User Actions

* `fetch_profile`: AR app requests the payload associated with the `staffId`.

---

# 20. Database Requirements

* `ServiceInstance` JSONB (Config only).
* `StaffDirectory` Postgres Table (Data source).

---

# 40. Acceptance Criteria

* [x] Schema configured.
* [x] Logic implemented.
* [x] Purely references the Staff DB.
