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
* Description: HOD profile and department highlights.
* Purpose: Render an impressive summary of the Department Head and top achievements outside their office.

---

# 8. Shared / Reusable Data

## 8.1 Dependency

* Shared data source: Staff Directory Database
* Referenced entity: `StaffDirectory` Table
* Fields used: Full Profile.

## 8.2 Duplication Rules

* HOD Profile information strictly references the `hodStaffId`.

---

# 10. Configuration Schema

## Service-Specific Configuration
* `hodStaffId` (String, required): Pointer to the Staff DB.
* `departmentDescription` (Text)
* `mainMessage` (String)

## Content
* `achievements` (Array)

---

# 17. User Actions

* `fetch_hod_profile`: Triggered instantly on load or tap. Retrieves HOD data.
* `view_achievement`: View specific achievement details.
