# SpatialOS Service Master Blueprint

**Document Type:** Service Definition / Implementation Blueprint
**Platform:** SpatialOS
**Version:** V1
**Status:** Approved
**Service Name:** Complaint Box
**Service Type:** complaint-box
**Service Version:** 1.0.0

---

# 1. Service Identity

## 1.1 Basic Information

* Service ID: `complaint-box`
* Service Name: Complaint Box
* Service Type: Complaint
* Description: A secure, anonymous gateway for student complaints.
* Purpose: Allow students to submit grievances without fear of tracking.

---

# 2. Service Purpose

## 2.1 Problem
Students fear physical complaint boxes are monitored, and emails lack anonymity.

## 2.2 Objective
Provide an AR portal to a 3rd party secure form (Google Forms).

## 2.3 V1 Scope
* Pass-through gateway to a configured URL.

## 2.4 Out of Scope
* Storing complaints in SpatialOS Database (Strictly prohibited for privacy).

---

# 7. Data Model

## Configuration Fields
* `title` (String)
* `description` (Text)
* `privacyMessage` (String)
* `googleFormUrl` (URL)

---

# 14. Business Logic

## Rule 1: No Storage
**Condition:** User taps submit.
**Action:** Return URL payload.
**Result:** AR App natively opens system browser. Zero data logged.

---

# 27. Privacy

SpatialOS acts ONLY as a spatial router. No PII, device IDs, or complaint contents are stored in the database.
