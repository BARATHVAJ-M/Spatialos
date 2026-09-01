# SpatialOS Service Master Blueprint

**Document Type:** Service Definition / Implementation Blueprint
**Platform:** SpatialOS
**Version:** V1
**Status:** Approved
**Service Name:** Classroom
**Service Type:** classroom
**Service Version:** 1.0.0

---

# 1. Service Identity

## 1.1 Basic Information

* Service ID: `classroom`
* Service Name: Classroom
* Service Type: Academic
* Version: 1.0.0
* Description: Timetable parsing and live class reminders.
* Purpose: Show students what class is currently happening and what is next.
* Owner: Admin
* Status: Live

## 1.2 Service Category

* Academic
* Information

---

# 2. Service Purpose

## 2.1 Problem

Students struggle to know which class is currently ongoing in a physical room without interrupting.

## 2.2 Objective

Provide a live AR dashboard anchored to a physical classroom door that dynamically displays the ongoing class and upcoming reminders based on the server's clock.

## 2.3 V1 Scope

* Real-time timetable evaluation (Current Class / Next Class).
* Display active reminders for that specific room.

## 2.4 Out of Scope

* Live attendance tracking.
* Dynamic schedule changes (V1 relies on static timetable uploads).

---

# 3. Placement

## 3.1 Where Can This Service Be Used?

* Place types: Classrooms, Labs, Lecture Halls.
* Experience types: Room Experiences.
* Restrictions: Anchored to physical doors or room markers.

---

# 4. User Experience

## 4.1 Entry Point

QR Scan at Classroom Door -> Renders UI next to the door.

## 4.2 Initial View

Displays "Current Class: [Subject]" and a countdown or simple layout showing the professor's name and the upcoming class.

---

# 5. Service Structure

```text
CLASSROOM
│
├── Main Information (Class Name)
├── Dynamic Content (Current/Next Class Calculation)
└── Secondary Information (Reminders)
```

---

# 6. Service Sections

## Section: Timetable View

### Purpose

Calculate live class status.

### User Actions

* `get_current_status`: Sent by the AR app on load.

### Result

Backend calculates exact time and returns Current/Next.

### Content Required

JSON Timetable array.

---

# 7. Data Model

## Configuration Fields

* `className` (String): e.g. "III IT A"
* `displayOptions` (JSON): `{ showReminders: boolean, showNextClass: boolean }`

## Content Fields

* `timetable` (Array): `{ day, time, subject, staff }`
* `reminders` (Array): `{ id, title, description, active, expirationDate }`

---

# 8. Shared / Reusable Data

Uses local timetable JSON payload. Does not query global Staff Directory yet (to keep V1 simple).

---

# 14. Business Logic

## Rule 1: Class Calculation
**Condition:** `currentTime >= classStartMins && currentTime < classEndMins`
**Action:** Set as `currentClass`.

## Rule 2: Expired Reminders
**Condition:** `expirationDate < now`
**Action:** Filter out of payload.

---

# 19. API Contract Requirements

## Runtime Action
`POST /api/v1/services/actions` -> payload: `{ action: 'get_current_status' }`
Returns `{ currentClass, nextClass, reminders }`
