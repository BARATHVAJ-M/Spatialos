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
* Description: Real-time timetable parsing and live class reminders.
* Purpose: Show students exactly what class is ongoing, what is coming up next, and active classroom-specific reminders without needing to interrupt a session.
* Owner: Admin/HOD
* Status: Live

## 1.2 Service Category

* Information
* Academic

---

# 2. Service Purpose

## 2.1 Problem

Students struggle to know which class is currently ongoing in a physical room without interrupting the class or checking a physical, often outdated piece of paper on the door.

## 2.2 Objective

Provide a live AR dashboard anchored to a physical classroom door that dynamically displays the ongoing class, upcoming schedule, and critical reminders based on the server's real-time clock.

## 2.3 V1 Scope

* Display the current class based on exact time matching.
* Display the next upcoming class.
* Display active, non-expired reminders specific to that room (e.g., "Bring Lab Coats").
* Timetable data is statically uploaded via Dashboard JSON format.

## 2.4 Out of Scope

* Live attendance tracking or biometrics.
* Dynamic schedule changes integrated with third-party university APIs (V1 uses static uploads).
* Real-time push notifications to student phones.

---

# 3. Placement

## 3.1 Where Can This Service Be Used?

* Place types: Classrooms, Laboratories, Lecture Halls, Seminar Rooms.
* Experience types: Department Corridors, Room Experiences.
* Allowed locations: Must be anchored to physical doors or exterior room markers.
* Restrictions: Should not be placed inside the room (to prevent distraction).

## 3.2 Experience Relationship

```text
Place (CSE Department)
  └── Experience (3rd Floor Corridor)
        └── Service Instance (Classroom: Room 301)
```

## 3.3 Instance Rules

* One service per experience: No (A corridor experience can have multiple classroom services, one for each door).
* Multiple instances allowed: Yes.
* Reusable across places: Yes.
* Reusable across experiences: Yes.

---

# 4. User Experience

## 4.1 Entry Point

```text
Walk down hallway / QR Scan at Classroom Door
   ↓
SpatialOS Core
   ↓
Experience Loads
   ↓
Classroom Service renders next to the door
```

## 4.2 Initial View

A clean, modern floating AR panel titled with the `className` (e.g., "III IT A"). The panel is split into two halves: the "Now" section highlighting the current subject and staff, and the "Next" section showing the upcoming class.

## 4.3 Primary Information

* Class Name.
* Current Subject & Staff Name.
* Next Subject & Staff Name.

## 4.4 Optional Information

* Full timetable for the day (visible on tap).
* Important Reminders (e.g., "Assignment Due").

## 4.5 User Interaction Level

* Low. 
V1 is highly automated. The user just reads the dynamically calculated time and walks away.

---

# 5. Service Structure

```text
CLASSROOM SERVICE
│
├── Main Information (Class Name)
├── Dynamic Content
│   ├── Current Class (Subject, Staff, Time)
│   └── Next Class (Subject, Staff, Time)
├── Actions
│   └── View Full Timetable
└── Secondary Information
    └── Active Reminders
```

---

# 6. Service Sections

## Section: Live Status Dashboard

### Purpose
Calculates and displays the live class status based on time.

### Visible Information
Class Name, Current Subject, Next Subject.

### Optional Information
Full Day Timetable.

### User Actions
* `get_current_status`: Sent automatically on load.
* `view_timetable`: Tap to expand schedule.

### Result
Backend calculates exact time and returns Current/Next.

### Data Required
JSON Timetable array.

### Content Required
Textual data (Subject, Time, Staff).

### Permissions
Admin (Edit Timetable), User (View Status).

---

# 7. Data Model

| Field       | Type   | Required | Editable | Description         |
| ----------- | ------ | -------: | -------: | ------------------- |
| ID          | UUID   |      Yes |       No | Unique identifier   |
| Title       | String |      Yes |      Yes | Service title       |
| Description | Text   |       No |      Yes | Service description |

*Service-specific fields are stored inside JSONB configuration/content columns in V1.*

---

# 8. Shared / Reusable Data

## 8.1 Dependency

* Shared data source: None for V1.
* V1 uses a standalone timetable JSON payload rather than linking to a massive global schedule database to keep it simple.

## 8.2 Duplication Rules

* The Staff name is currently a simple string in the timetable. 
*(Future versions will link this to the `StaffDirectory` for dynamic photo retrieval).*

---

# 9. Content Requirements

## Supported Content

* Text (Subjects, Staff Names, Reminders).

## Content Rules

* Format: Plain Text.
* Maximum size: Short strings (< 100 characters).
* Required/optional: Subject and Staff are required.
* Where it appears: Main UI panel.

---

# 10. Configuration Schema

## General

* Title: Classroom
* Description: Room status and schedule.
* Status: Active / Inactive

## Service-Specific Configuration

```text
Field: className
Type: String
Required: Yes
Default: ""
Editable: Yes
Validation: Max 20 characters
Purpose: The physical name of the room (e.g., "III IT A").

Field: displayOptions
Type: JSON
Required: Yes
Default: { showReminders: true, showNextClass: true }
Editable: Yes
Validation: Valid Boolean Object
Purpose: Toggles visibility of UI sections.
```

## Content

```text
Field: timetable
Type: Array
Items: { day: 'string', time: 'string', subject: 'string', staff: 'string' }

Field: reminders
Type: Array
Items: { id: 'uuid', title: 'string', description: 'text', active: 'boolean', expirationDate: 'date' }
```

---

# 11. Admin Editing

## Editable Fields

* Class Name
* Display Options
* Timetable Array (Add/Edit rows)
* Reminders Array (Add/Edit alerts)

## Read-Only Fields

* None

## Add

* New timetable entries (Day, Time, Subject, Staff).
* New reminders (Title, Expiration Date).

## Edit

* Existing timetable times and subjects.

## Remove

* Delete old reminders or dropped classes.

## Enable / Disable

* `showReminders` flag.

---

# 12. Admin Workflow

```text
Open Service
    ↓
Set Class Name
    ↓
Upload / Manually Enter Timetable Array
    ↓
Add Active Reminders
    ↓
Validate Configuration
    ↓
Save Draft
    ↓
Preview
    ↓
Publish
```

---

# 13. Service Actions

| Action  | Actor | Input         | Validation     | Result       | API Operation |
| ------- | ----- | ------------- | -------------- | ------------ | ------------- |
| Save    | Admin | Configuration | Valid config   | Draft saved  | PATCH         |
| Publish | Admin | Draft         | Publish checks | Live version | POST          |

---

# 14. Business Logic

## Rule 1: Current Class Calculation
**Condition:** `currentTime >= classStartMins` AND `currentTime < classEndMins`
**Action:** Set the timetable object as `currentClass`.
**Result:** Renders in the "Now" UI slot.

## Rule 2: Next Class Calculation
**Condition:** `currentTime < classStartMins` and no next class is currently selected.
**Action:** Set the timetable object as `nextClass`.
**Result:** Renders in the "Next" UI slot.

## Rule 3: Expired Reminders
**Condition:** `expirationDate < now`
**Action:** Filter out of payload.
**Result:** Do not return to the AR Engine.

---

# 15. Validation

## Configuration Validation

* `className` is required.

## Data Validation

* `timetable` times must follow a strict "HH:MM" format to allow integer time calculation.
* `reminders` dates must be valid ISO date strings.

---

# 16. Runtime Behavior

```text
Service Load
   ↓
AR Engine calls `get_current_status`
   ↓
Backend receives payload
   ↓
Filter timetable to `todaysClasses` based on Node.js Server Day
   ↓
Calculate `currentClass` and `nextClass` based on Server Time
   ↓
Filter active reminders
   ↓
Return strictly filtered subset to AR Engine
   ↓
Render Service
```

---

# 17. User Actions

```text
Action: get_current_status
Trigger: Automatic on load
Required Input: None
Processing: Backend calculates exact time and extracts Current/Next.
Success Result: Returns { currentClass, nextClass, reminders }
```

```text
Action: view_timetable
Trigger: User taps "View Schedule"
Required Input: None
Processing: Backend returns the full JSON timetable array.
Success Result: Returns full timetable list.
```

---

# 18. External Integrations

* None.

---

# 19. API Contract Requirements

## Runtime Action

```text
POST /api/v1/services/actions
Purpose: Fetch dynamically calculated room status.
Request: { action: 'get_current_status' }
Response: 
{ 
  status: 'success', 
  data: { 
    currentClass: { subject: 'Math', time: '10:00' }, 
    nextClass: null, 
    reminders: [] 
  } 
}
```

---

# 20. Database Requirements

* Uses the `ServiceInstance` table.
* Stores config and timetable in `configuration` and `content` JSONB columns.

---

# 21. State Management

```text
DRAFT
  ↓
PUBLISHED
```

---

# 22. Publishing Rules

## Validation

* Timetable JSON structure must pass validation before publishing.

## Live

* Timetable is securely saved in DB and served to AR engine.

---

# 23. Permissions

| Operation | Super Admin | Editor | Viewer |    User |
| --------- | ----------: | -----: | -----: | ------: |
| View      |         Yes |    Yes |    Yes | Runtime |
| Edit      |         Yes |    Yes |     No |      No |
| Publish   |         Yes |     No |     No |      No |

---

# 24. Error Handling

```text
Error: Invalid Time Format
Cause: Admin typed "10 AM" instead of "10:00".
System Behavior: Backend fails mathematical comparison.
User Behavior: UI fails to show current class.
Recovery: Add rigorous validation in Dashboard UI to force "HH:MM" selection.
```

---

# 25. Empty / Missing Data

* **No class currently running**: Display "Room Available" or "No Class".
* **No next class**: Hide the "Next" UI section.
* **No reminders**: Collapse the reminders panel entirely.

---

# 26. Security

* Admin updates protected by JWT.
* Runtime payload is public information (no PII).

---

# 27. Privacy

* No user tracking on who viewed the timetable.

---

# 28. Performance

* Initial loading target: < 300ms.
* The mathematical payload calculation happens on the backend so the Flutter AR Engine doesn't have to write complex date-parsing Dart code.

---

# 29. Offline / Network Failure

* **Offline**: AR app should cache the full timetable locally on first load and fall back to on-device time calculation if the backend is unreachable.

---

# 30. Caching

* Cache duration: 1 hour in AR Engine.

---

# 31. Analytics

* Service Opened

---

# 32. Logging / Audit

* Log when the timetable is updated.

---

# 33. Dependencies

```text
Service
│
├── Backend API
├── Database (ServiceInstance JSONB)
└── AR Engine
```

---

# 34. AR Engine Requirements

* Service Type: `classroom`
* Position: Flat against the physical wall/door.
* Scale: Large enough to be read from 1 meter away.
* UI Elements: Bold typography for "Current Class", smaller font for "Next".

---

# 35. Spatial Object Requirements

* Anchoring requirements: Image Tracking Marker (QR Code or Room Plaque).

---

# 36. Accessibility

* High contrast text. Large numerical fonts for times.

---

# 37. Version Compatibility

* Service version: 1.0.0

---

# 38. Migration / Update Rules

* N/A for V1.

---

# 39. Testing Requirements

## Unit Tests

* Test the backend calculation algorithm by mocking `currentTime` to exactly 10:30 and verifying the correct current and next classes are returned.

---

# 40. Acceptance Criteria

* [x] Service template is registered
* [x] Configuration schema exists
* [x] Admin editing works (Timetable Array)
* [x] Current/Next mathematical calculation works
* [x] Error handling works
* [x] Empty states work

---

# 41. V1 Scope Control

### MUST HAVE

* Calculate Current and Next class.

### SHOULD HAVE

* Active Reminders overlay.

### FUTURE

* Dynamic Global Staff Directory Integration.

---

# 42. Final Service Definition

## Service Summary

A mathematically intelligent AR dashboard that tells students exactly what is happening in a room right now.

## Core Business Rules

* Exact time parsing to display dynamic status.
* Expiration filtering on reminders.

## Required Actions

* `get_current_status`

---

# 43. Implementation Boundary

The backend strictly calculates the mathematics of the timetable. The AR Engine strictly paints the results to the wall.

---

# 44. Developer Instruction

Do not pass the raw timetable to the AR engine and force the AR engine to calculate times. The backend `classroom.service.ts` must perform the calculations to ensure timezones and server-time consistency.
