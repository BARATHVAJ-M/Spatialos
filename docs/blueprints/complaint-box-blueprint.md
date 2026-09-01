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
* Version: 1.0.0
* Description: A secure, anonymous gateway for student complaints.
* Purpose: Allow students to submit grievances without fear of physical tracking.
* Owner: Admin/Management
* Status: Live

## 1.2 Service Category

* Complaint
* Communication

---

# 2. Service Purpose

## 2.1 Problem

Students fear physical complaint boxes are monitored by cameras, and emails lack anonymity. Physical boxes are also rarely checked by administration.

## 2.2 Objective

Provide an AR portal anchored to a physical location that passes the user to a secure 3rd party form (e.g. Google Forms) to guarantee anonymity while digitizing the collection process.

## 2.3 V1 Scope

* Display a privacy statement.
* Provide a single button to open the configured URL.

## 2.4 Out of Scope

* Storing complaints in SpatialOS Database (Strictly prohibited for privacy).
* Building custom form UIs inside the AR engine.

---

# 3. Placement

## 3.1 Where Can This Service Be Used?

* Place types: Private Corridors, Restroom exteriors, Main Office.
* Restrictions: Should be anchored in areas with low camera surveillance to encourage use.

---

# 4. User Experience

## 4.1 Entry Point

QR Scan -> AR Engine renders a discreet floating portal.

## 4.2 Initial View

A clean interface showing the `title`, `description`, and `privacyMessage`. A prominent "Submit Grievance" button is displayed.

---

# 5. Service Structure

```text
COMPLAINT BOX
│
├── Main Information (Title, Description)
├── Privacy Assurance (Privacy Message)
└── Actions
    └── Open External URL
```

---

# 6. Service Sections

## Section: Gateway

### Purpose
To reassure the user and route them securely.

### Visible Information
Privacy Message.

### User Actions
* `submit_complaint`: Tap button.

### Result
Backend returns the URL payload. AR Engine opens system web browser.

---

# 7. Data Model

## Configuration Fields

* `title` (String): e.g., "Anonymous Complaint Box"
* `description` (Text): e.g., "Submit your grievances securely."
* `privacyMessage` (String): e.g., "SpatialOS does not track or store your details."
* `googleFormUrl` (URL): e.g., "https://forms.google.com/..."

## Content Fields

* None (No content stored).

---

# 8. Shared / Reusable Data

* None.

---

# 9. Content Requirements

* None.

---

# 10. Configuration Schema

## General

* Title: Complaint Box
* Status: Active / Inactive

## Service-Specific Configuration

```text
Field: googleFormUrl
Type: URL
Required: Yes
Editable: Yes
Validation: Must be valid HTTP/HTTPS URL.
Purpose: The destination to route the user.
```

---

# 11. Admin Editing

## Editable Fields

* Title
* Description
* Privacy Message
* Google Form URL

---

# 12. Admin Workflow

```text
Open Service
    ↓
Paste Google Form URL
    ↓
Save Draft
    ↓
Publish
```

---

# 13. Service Actions

| Action  | Actor | Input         | Validation     | Result       |
| ------- | ----- | ------------- | -------------- | ------------ |
| Save    | Admin | Configuration | Valid config   | Draft saved  |
| Publish | Admin | Draft         | Publish checks | Live version |

---

# 14. Business Logic

## Rule 1: Zero Storage Passthrough
**Condition:** User taps "Submit Complaint".
**Action:** Return URL payload without logging PII.
**Result:** AR App natively opens system browser. Zero data logged in SpatialOS DB.

---

# 15. Validation

## Configuration Validation

* `googleFormUrl` must be a valid URL string.

---

# 16. Runtime Behavior

```text
Service Load
   ↓
Render UI with Privacy Text
   ↓
Accept User Tap (`submit_complaint`)
   ↓
Fetch URL from Backend Configuration
   ↓
Launch URL in OS Browser
```

---

# 17. User Actions

```text
Action: submit_complaint
Trigger: Button Tap
Success Result: Returns { status: 'success', action: 'open_url', url: '...' }
```

---

# 18. External Integrations

* **Google Forms** (or any 3rd party form provider): SpatialOS simply links to it.

---

# 19. API Contract Requirements

## Runtime Action

```text
POST /api/v1/services/actions
Request: { action: 'submit_complaint' }
Response: { status: 'success', action: 'open_url', url: 'https://...', privacyMessage: '...' }
```

---

# 20. Database Requirements

* Uses the `ServiceInstance` table. Configuration only.

---

# 21. State Management

```text
DRAFT -> PUBLISHED
```

---

# 22. Publishing Rules

* URL is required to publish.

---

# 23. Permissions

| Operation | Super Admin | Editor | Viewer |    User |
| --------- | ----------: | -----: | -----: | ------: |
| View      |         Yes |    Yes |    Yes | Runtime |
| Edit      |         Yes |    Yes |     No |      No |

---

# 24. Error Handling

```text
Error: URL Not Configured
Cause: Admin forgot to paste the link.
System Behavior: Backend throws BadRequestException.
```

---

# 25. Empty / Missing Data

* If no URL is present, service cannot be published.

---

# 26. Security

* Admin routes protected by JWT.

---

# 27. Privacy

SpatialOS acts ONLY as a spatial router. No PII, device IDs, or complaint contents are stored in the database. 
Explicitly offloads privacy liability to the 3rd party form provider.

---

# 28. Performance

* Highly lightweight. Instant response.

---

# 29. Offline / Network Failure

* Needs internet to open the external form.

---

# 30. Caching

* N/A

---

# 31. Analytics

* Click events on `submit_complaint` can be counted (without attaching user IDs) to track usage volume.

---

# 32. Logging / Audit

* Log configuration updates by Admin.

---

# 33. Dependencies

```text
Backend API -> AR Engine -> OS Browser
```

---

# 34. AR Engine Requirements

* Render a lock icon or shield icon to emphasize security.

---

# 35. Spatial Object Requirements

* Anchored to a wall or discreet plaque.

---

# 36. Accessibility

* Large contrasting button.

---

# 37. Version Compatibility

* V1

---

# 38. Migration / Update Rules

* N/A

---

# 39. Testing Requirements

* Verify URL is strictly returned.
* Verify absolutely no DB insert statements happen during the `submit_complaint` action.

---

# 40. Acceptance Criteria

* [x] Schema configured.
* [x] Logic implemented.
* [x] `submit_complaint` successfully returns open_url action.

---

# 41. V1 Scope Control

### MUST HAVE

* Pass-through URL.

### OUT OF SCOPE

* Native Form UI.

---

# 42. Final Service Definition

## Core Business Rules

* Absolute privacy via Zero-Storage passthrough.

---

# 43. Implementation Boundary

Backend serves URL. AR Engine handles opening the OS Web Browser via native platform channels (URL Launcher).

---

# 44. Developer Instruction

Under no circumstances should the backend log the payload or the user who requested the complaint URL.
