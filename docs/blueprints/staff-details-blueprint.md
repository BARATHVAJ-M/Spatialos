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
* Description: Profile, contact, and timetable for a staff member.
* Purpose: Display a specific professor's profile outside their cabin.

---

# 8. Shared / Reusable Data

## 8.1 Dependency

* Shared data source: Staff Directory Database
* Referenced entity: `StaffDirectory` Table

## 8.2 Duplication Rules

* THIS SERVICE STORES NO CONTENT. It is 100% reference-based.

---

# 10. Configuration Schema

## Service-Specific Configuration
* `staffId` (String, required)
* `displayTimetable` (Boolean, default true)
* `displayContact` (Boolean, default true)

## Content
* `{}` (Empty)

---

# 17. User Actions

* `fetch_profile`: AR app requests the payload associated with the `staffId`.
