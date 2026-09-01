# SpatialOS Service Master Blueprint

**Document Type:** Service Definition / Implementation Blueprint
**Platform:** SpatialOS
**Version:** V1
**Status:** Approved
**Service Name:** Notice Board
**Service Type:** notice-board
**Service Version:** 1.2.0

---

# 1. Service Identity

## 1.1 Basic Information

* Service ID: `notice-board`
* Service Name: Notice Board
* Service Type: Information
* Version: 1.2.0
* Description: A hovering digital notice board for department announcements and college-wide alerts.
* Purpose: Instantly broadcast textual and media-based notices to students passing by specific spatial nodes.
* Owner: Admin/HOD
* Status: Live

## 1.2 Service Category

* Information
* Communication

---

# 2. Service Purpose

## 2.1 Problem

Physical notice boards are easily ignored, get cluttered, and require manual paper updates. Students miss important announcements.

## 2.2 Objective

Provide a real-time, zero-friction, spatially anchored digital notice board that students can see natively in AR without digging through emails.

## 2.3 V1 Scope

* Display a list of active notices.
* Show title, description, and post date.
* Optional media attachment (image URL).
* Admin ability to add, edit, and delete notices via dashboard.
* Automatic archiving based on configured days.

## 2.4 Out of Scope

* Push notifications to student phones (Not in V1).
* Video playback natively inside the notice tile (V1 uses static images).
* Student comments or replies on notices.

---

# 3. Placement

## 3.1 Where Can This Service Be Used?

* Place types: Department Corridors, Main Entrance, College Lobby.
* Experience types: Department Overviews, General Campus Navigation.
* Allowed locations: Any spatial node.
* Restrictions: None.

## 3.2 Experience Relationship

```text
Place
  └── Experience
        └── Service Instance (Notice Board)
```

## 3.3 Instance Rules

* One service per experience: No (A place could have multiple notice boards for different categories).
* Multiple instances allowed: Yes.
* Reusable across places: Yes.
* Reusable across experiences: Yes.

---

# 4. User Experience

## 4.1 Entry Point

```text
Walk into Spatial Zone / QR Scan
   ↓
SpatialOS Core
   ↓
Experience Loads
   ↓
Notice Board Renders in 3D Space
```

## 4.2 Initial View

A floating, stylized glass panel displaying the `boardTitle` and a scrolling/paginated list of the top 3-5 most recent notices.

## 4.3 Primary Information

* Board Title (e.g., "CSE Announcements").
* Notice Titles.
* Notice Post Dates.
* 'Important' tag highlight.

## 4.4 Optional Information

* Full description of the notice (revealed on tap).
* Attached image (rendered on tap or expanded view).

## 4.5 User Interaction Level

* Low

V1 should prefer the minimum interaction required to complete the purpose. Users just read and walk away.

---

# 5. Service Structure

```text
NOTICE BOARD
│
├── Main Information (Board Title)
├── Content
│   ├── Notice 1 (Title, Date, Important Flag)
│   ├── Notice 2
│   └── Notice N
├── Actions
│   └── Tap to Expand Notice
└── Secondary Information
    └── Notice Full Description & Media
```

---

# 6. Service Sections

## Section: Notice List

### Purpose

Provide an overview of all active announcements.

### Visible Information

Board Title, Notice Titles, Dates.

### Optional Information

Expanded description on click.

### User Actions

* `view_notice` (Tap on a specific notice).

### Result

AR Engine expands the notice to show the full description and media attachment.

### Data Required

Array of `notices`.

### Content Required

Notice text, optional images.

### Permissions

Admin (to create), User (to view).

---

# 7. Data Model

| Field           | Type    | Required | Editable | Description                                  |
| --------------- | ------- | -------: | -------: | -------------------------------------------- |
| ID              | UUID    |      Yes |       No | Unique identifier                            |
| Title           | String  |      Yes |      Yes | Notice headline                              |
| Description     | Text    |      Yes |      Yes | Full body of the announcement                |
| DatePosted      | Date    |      Yes |      Yes | When it was posted                           |
| Important       | Boolean |       No |      Yes | Flags the notice with high priority styling  |
| MediaUrl        | URL     |       No |      Yes | Optional attached image                      |

---

# 8. Shared / Reusable Data

## 8.1 Dependency

* Shared data source: None. (Notices are specific to the board instance in V1).

## 8.2 Duplication Rules

Notices are bound to the specific Service Instance content. No shared dependencies to avoid cross-department clutter.

---

# 9. Content Requirements

## Supported Content

* Text
* Image (via URL)

## Content Rules

* Format: JPEG / PNG for images.
* Maximum size: 2MB (enforced by AR engine streaming limits).
* Required/optional: Images are optional.
* Validation: Must be a valid URL starting with `https://`.
* Where it appears: Expanded notice view.

---

# 10. Configuration Schema

## General

* Title: Notice Board
* Status: Active / Inactive

## Service-Specific Configuration

```text
Field: boardTitle
Type: String
Required: Yes
Default: "Department Notices"
Editable: Yes
Validation: Max 50 characters
Purpose: The header text hovering above the board.

Field: themeColor
Type: Color (Hex)
Required: No
Default: "#0F172A"
Editable: Yes
Validation: Valid Hex Code
Purpose: To color-match the board to the department.

Field: autoArchiveDays
Type: Number
Required: No
Default: 30
Editable: Yes
Validation: > 0
Purpose: Prevents stale notices from cluttering the board indefinitely.
```

---

# 11. Admin Editing

## Editable Fields

* Board Title
* Theme Color
* Auto Archive Days
* Notices Array (Add, Edit, Remove)

## Read-Only Fields

* Service ID
* Instance ID

## Add

* New Notices (Title, Description, Date, Important Flag, Media).

## Edit

* Existing notice text and media.

## Remove

* Delete old notices.

## Reorder

* N/A (Automatically ordered by DatePosted descending).

## Enable / Disable

* Board visibility can be toggled.

---

# 12. Admin Workflow

```text
Open Service (Dashboard)
    ↓
Load Configuration (boardTitle, theme)
    ↓
Add/Edit Notices in Array
    ↓
Validate Dates and URLs
    ↓
Save Draft
    ↓
Publish
    ↓
Live in AR
```

---

# 13. Service Actions

| Action  | Actor | Input         | Validation     | Result       | API Operation |
| ------- | ----- | ------------- | -------------- | ------------ | ------------- |
| Save    | Admin | Configuration | Valid config   | Draft saved  | PATCH         |
| Publish | Admin | Draft         | Publish checks | Live version | POST          |

---

# 14. Business Logic

## Rule 1

**Condition:**
Notice `DatePosted` is older than `autoArchiveDays`.

**Action:**
Do not return the notice to the AR client.

**Result:**
Stale notices automatically disappear.

---

# 15. Validation

## Configuration Validation

* `boardTitle` must be string.

## Data Validation

* `notices` array items must have `title` and `description`.
* `datePosted` must be a valid Date string.

## Content Validation

* `mediaUrl` must be a valid HTTP/HTTPS URI.

---

# 16. Runtime Behavior

```text
Service Load
   ↓
Load Configuration
   ↓
Filter Notices by autoArchiveDays
   ↓
Sort Notices by DatePosted (Desc)
   ↓
Render Service Glass Panel
   ↓
Accept User Tap (`view_notice`)
   ↓
Expand Specific Notice
```

---

# 17. User Actions

```text
Action: view_notice
Trigger: Tap on notice tile
Required Input: noticeId
Validation: noticeId exists in instance data
Processing: Fetch full description and mediaUrl
Success Result: Returns full notice payload to AR Engine
Failure Result: Returns "Notice not found" error
Next State: Expanded Notice View
```

---

# 18. External Integrations

None for V1. (Uses internal content).

---

# 19. API Contract Requirements

## Read

```text
GET /api/v1/services/instances/:id
Purpose: Fetch the board configuration and active notices for the AR App.
```

## Runtime Action

```text
POST /api/v1/services/actions
Purpose: Process `view_notice` clicks.
Request: { action: 'view_notice', noticeId: 'uuid' }
Response: { status: 'success', data: { title, description, mediaUrl } }
```

---

# 20. Database Requirements

* Uses the existing `ServiceInstance` table.
* Configuration is saved in the `configuration` JSONB column.
* Notices are saved in the `content` JSONB column.

---

# 21. State Management

```text
DRAFT
  ↓
PUBLISHED
```

---

# 22. Publishing Rules

## Draft

* Edits to notices live in Draft until the Admin publishes the Experience.

## Validation

* Schema validation must pass.

## Live

* AR app receives the latest JSON configuration.

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
Error: Notice Not Found
Cause: User taps a notice that was just deleted by admin.
System Behavior: Throw BadRequestException.
User Behavior: AR app shows a brief "Notice unavailable" toast.
Recovery: AR App refreshes board data.
```

---

# 25. Empty / Missing Data

* **No announcements**: Render a placeholder text "No new announcements" in the AR panel.
* **No media URL**: Do not render the image placeholder to save UI space.

---

# 26. Security

* Admin routes protected by JWT.
* AR fetch routes protected by Application Keys / JWT.
* No sensitive PII stored.

---

# 27. Privacy

* Does not track which specific student read which notice in V1.

---

# 28. Performance

* Initial loading target: < 500ms
* Maximum payload: < 50KB JSON.
* Caching: AR Engine caches images aggressively.

---

# 29. Offline / Network Failure

* **Offline**: AR Engine displays cached notices from last successful fetch. Shows a "Offline Mode" icon.

---

# 30. Caching

* Images cached on-device by Flutter.

---

# 31. Analytics

* Service Opened
* `view_notice` Clicked

---

# 32. Logging / Audit

* Log when the Service Instance is published by an Admin.

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

* Service Type: `notice-board`
* Render a floating UI panel matching `themeColor`.
* Render scrolling list for notices.

---

# 35. Spatial Object Requirements

* Anchoring requirements: Fixed spatial node, floating at eye level (approx 1.5m Y-axis).

---

# 36. Accessibility

* Text must be high contrast (white text on dark glass).
* Touch targets for notices must be at least 48x48 dp.

---

# 37. Version Compatibility

* Service version: 1.2.0

---

# 38. Migration / Update Rules

* V1 to V2 will be automatically migrated (adding new fields to JSONB without breaking old keys).

---

# 39. Testing Requirements

* Unit test `autoArchiveDays` filter logic.
* Ensure schema validation catches missing Titles.

---

# 40. Acceptance Criteria

* [x] Service template is registered
* [x] Configuration schema exists
* [x] Runtime loading works
* [x] User actions work (`view_notice`)

---

# 41. V1 Scope Control

### MUST HAVE

* View notice list
* Open notice details

### SHOULD HAVE

* Auto archive based on dates

### FUTURE

* Video notices
* Push notifications

---

# 42. Final Service Definition

## Service Summary

A fast, floating AR notice board for department announcements.

## Core Business Rules

* Discard notices older than auto-archive limit at runtime.

---

# 43. Implementation Boundary

The service owns filtering logic and payload generation.
The AR Engine owns the glass UI rendering and scroll physics.
The Dashboard owns the form UI for adding notices.

---

# 44. Developer Instruction

Do not build custom database tables for notices. Use the `content` JSONB field inside `ServiceInstance`.
