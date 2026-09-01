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
* Description: Information and achievements for a department entrance.
* Purpose: Welcome students/guests and provide an overview of the department's top achievements and core staff.

---

# 8. Shared / Reusable Data

## 8.1 Dependency

* Shared data source: Staff Directory Database
* Referenced entity: `StaffDirectory` Table
* Fields used: Name, Photo, Designation.

## 8.2 Duplication Rules

* Do not store staff photos in the Entrance config. Just reference the `staffId`.

---

# 14. Business Logic

## Rule 1: Validate Staff IDs
**Condition:** AR App sends `view_staff` with a `staffId`.
**Action:** Verify `staffId` exists in `instanceData.configuration.staffIds`. Fetch from DB.
**Result:** Returns staff profile or throws BadRequest.

---

# 17. User Actions

* `view_staff`: Fetch a staff member's profile.
* `view_achievement`: Expand a specific department achievement.
