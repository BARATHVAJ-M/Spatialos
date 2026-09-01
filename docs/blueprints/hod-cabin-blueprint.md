# SpatialOS Service Master Blueprint

**Document Type:** Service Definition / Implementation Blueprint
**Platform:** SpatialOS
**Version:** V1
**Status:** Approved
**Service Name:** HOD Cabin
**Service Type:** hod-cabin
**Service Version:** 1.0.0

---

# 1. Service Identity

## 1.1 Basic Information

* Service ID: `hod-cabin`
* Service Name: HOD Cabin
* Service Type: Showcase
* Version: 1.0.0
* Description: HOD profile and department highlights.
* Purpose: Render an impressive summary of the Department Head and top achievements outside their office.
* Owner: Admin

---

# 2. Service Purpose

## 2.1 Problem
Nameplates outside cabins are static and lack context.

## 2.2 Objective
Create an interactive AR plaque outside the HOD's cabin that dynamically fetches their profile and highlights department achievements.

---

# 5. Service Structure

```text
HOD CABIN
│
├── HOD Profile (Reference)
├── Main Message (Text)
└── Department Achievements (Content Array)
```

---

# 7. Data Model

## Configuration Fields
* `hodStaffId` (String): Pointer to the Staff DB.
* `departmentDescription` (Text)
* `mainMessage` (String)

## Content Fields
* `achievements` (Array): `{ id, title, description, image }`

---

# 8. Shared / Reusable Data

## 8.1 Dependency

* Shared data source: Staff Directory Database
* Referenced entity: `StaffDirectory` Table
* Fields used: Full Profile.

## 8.2 Duplication Rules

* HOD Profile information strictly references the `hodStaffId`.

---

# 14. Business Logic

## Rule 1: Dynamic HOD Fetching
**Condition:** Service initializes or user requests profile.
**Action:** Backend uses `hodStaffId` from config to query `StaffDirectory`.
**Result:** Complete, up-to-date HOD data is served. If the HOD changes, the admin updates the global directory and it cascades here automatically.

---

# 17. User Actions

* `fetch_hod_profile`: Triggered instantly on load or tap. Retrieves HOD data.
* `view_achievement`: View specific achievement details.

---

# 20. Database Requirements

* `ServiceInstance` JSONB.
* `StaffDirectory` Postgres Table.

---

# 40. Acceptance Criteria

* [x] Schema configured.
* [x] Logic implemented.
* [x] Dynamically fetches HOD details via DI Repository.
