# SPATIALOS — TOP BAR FEATURES BLUEPRINT (PROFILE, NOTIFICATIONS, ABOUT)

This document specifies the exact UI structure, workflows, business logic, and database/API requirements for the three global Top Bar components in the SpatialOS Admin Dashboard:
1. **User Profile Dropdown & Switcher**
2. **Notifications Drawer & Notification History**
3. **About / Help Panel & API Connection Status Checker**

---

## 1. User Profile Dropdown & Switcher

### A. Purpose
Allows the administrator to view current session metadata, switch between available workspaces/organizations, navigate to settings, and log out securely.

### B. UI Structure (Dropdown Menu)
- **Header Section:**
  - User avatar placeholder (Initials).
  - Full Name (`Sarah Connor`).
  - Active Role Badge (`Super Admin`).
  - Email Address (`sarah.c@spatialos.com`).
- **Workspace Switcher:**
  - Dropdown showing current Organization/Workspace context.
  - Options to switch between authorized workspaces (e.g., "Global Health Group", "Hospital East Wing").
- **Navigation Links:**
  - `Profile Settings` (Redirects to `/settings`).
  - `Billing & Usage` (If applicable, redirects to billing section).
- **Footer Section:**
  - `Logout` button (Red accent, triggers logout flow).

### C. Workflow & Business Logic
1. **Mounting:** On render, the profile details are retrieved from the auth state token parsed by the frontend.
2. **Switching Workspace:**
   - User clicks workspace dropdown inside the profile menu.
   - User selects a different Workspace ID.
   - Frontend triggers API request: `POST /auth/workspace/switch` with `{ workspaceId }`.
   - On success, the frontend updates the workspace cookie/header token and reloads the active route (e.g., redirecting to Overview).
3. **Logout Flow:**
   - User clicks `Logout`.
   - Client triggers client-side cleanup: removes JWT, local storage items, and cache.
   - Redirects to `/login`.

---

## 2. Notifications Drawer & History

### A. Purpose
Presents active warnings, platform validation failures, success statuses for scene compiles, and general platform notifications.

### B. UI Structure (Sliding Side Drawer)
- **Header:**
  - Title ("Notifications").
  - Action: `Mark all as read` button.
  - Close button (`X`).
- **Tabs:**
  - `All` (Shows all received messages).
  - `Unread` (Filtered list of active notifications).
- **Notification Item Cards:**
  - **Color Coding by Type:**
    - `Success` (Green icon): "Experience notice_board compiled successfully."
    - `Warning` (Yellow icon): "Place main_lobby is published but contains no experiences."
    - `Error` (Red icon): "Notice Board compile failed: 3D model banner.glb does not exist."
    - `Info` (Blue icon): "System maintenance scheduled for tonight at 23:00 UTC."
  - **Metadata:** Timestamp, entity category badge, short description.
  - **Clickable Anchor:** Links to the exact entity page (e.g., clicking the notice board error navigates to `/experiences/1`).
- **Footer:**
  - `View Notification Log` link (Navigates to `/monitoring?tab=audit`).

### C. Workflow & Business Logic
1. **Fetching:** Loads last 20 notifications via `GET /notifications` upon opening.
2. **Real-time Synchronization:** Listens to SSE (Server-Sent Events) or WebSockets at `/notifications/stream`. On event, increments the red count indicator in the top navbar and prepends the card to the list.
3. **Read Status Mutation:**
   - When a user clicks a notification card or the "Mark all as read" button:
   - Triggers `PATCH /notifications/read` with `{ notificationIds: [...] }`.
   - Updates local state indicators.

---

## 3. About / Support Drawer

### A. Purpose
Displays the platform versioning data, developer specifications, system limitations (e.g. maximum file upload sizes), and a connection check tool to verify api latency.

### B. UI Structure (Modal or Sliding Drawer)
- **Header:**
  - App Icon, App Name ("SpatialOS Control Plane"), Version metadata ("v2.5.4-Stable").
- **Section 1: Connection Health Check:**
  - Live indicator displaying Ping latency to the Nest.js API gateway.
  - `Run Latency Test` button.
- **Section 2: Platform Constraints & Storage:**
  - Active Storage quota bar (e.g. "12.4 GB / 50 GB Used").
  - System limits table:
    - Max Image upload: 10MB
    - Max Video upload: 50MB
    - Max 3D model (.glb): 25MB
- **Section 3: Reference Links:**
  - Link to API Documentation, Developer SDK Guide, and Support Desk Email.

### C. Workflow & Business Logic
1. **Latency Check:** Clicking `Run Latency Test` fires a lightweight `GET /health` request, measures the timestamp delta, and prints the result (e.g., "Connected (45ms)").
2. **Quota Check:** Fetches account storage limits from the settings endpoint.

---

## 4. UI → API Requirement Matrix

| Section | User Action | Target API | Method | Request Payload | Response Payload |
|---|---|---|---|---|---|
| Profile | Switch Workspace | `/auth/workspace/switch` | `POST` | `{ workspaceId: string }` | `{ success: boolean, token: string }` |
| Profile | Logout | `/auth/logout` | `POST` | None | `{ success: boolean }` |
| Notifications | Load List | `/notifications` | `GET` | None | `Notification[]` |
| Notifications | Mark Read | `/notifications/read` | `PATCH` | `{ ids: string[] }` | `{ success: boolean }` |
| About | Connection Health | `/health` | `GET` | None | `{ status: "ok", timestamp: number }` |

---
*END OF BLUEPRINT*
