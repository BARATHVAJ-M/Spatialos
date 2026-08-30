# SpatialOS Implementation Specification: Admin Website UI/UX Architecture

**Document ID:** 18_Admin_Website_UI_UX_Architecture
**Target Audience:** Frontend React/Next.js Developers, UI/UX Designers
**Objective:** Define the explicit page layouts, user journey, and Information Architecture (IA) for the SpatialOS Admin Website. This ensures developers know exactly what screens to build and how the user flows from Login to Publishing an AR scene.

---

## 1. Information Architecture (The Sitemap)

The website consists of **6 primary pages**.

```text
(Public)
 └── /login                   [Authentication]

(Private Dashboard)
 ├── /dashboard               [Home / Overview Analytics]
 ├── /dashboard/places        [Physical Locations Management]
 ├── /dashboard/experiences   [AR Scene Management]
 ├── /dashboard/components    [UI Element / Action Definitions]
 └── /dashboard/editor/[id]   [The 3D Visual Drag-and-Drop Builder]
```

---

## 2. Page-by-Page Layout Definitions

### A. The Login Page (`/login`)
- **Layout:** Centered card on a dark, modern background.
- **UI Elements:**
  - SpatialOS Logo.
  - Email Input & Password Input.
  - "Sign In" Button.
- **Workflow:** On click, calls `POST /api/v1/auth/login`. On success, stores the JWT in `localStorage` or `cookies` and redirects to `/dashboard`.

### B. The Home Dashboard (`/dashboard`)
- **Layout:** Standard Web App layout (Left Sidebar Navigation, Top Navbar with User Profile, Main Content Area).
- **UI Elements:**
  - **Welcome Banner:** "Welcome back, Admin."
  - **Quick Stats Cards (Top Row):**
    - "Total Active Places" (e.g., 12)
    - "Total Scans Today" (e.g., 1,450)
    - "Most Active Action" (e.g., "Ordered Coffee")
  - **Recent Activity Table:** Shows the latest AR experiences published.

### C. Places Management (`/dashboard/places`)
- **Layout:** Data Grid / Table view.
- **UI Elements:**
  - **Header:** "Physical Places" + [ + Add New Place ] button.
  - **Table Columns:** Place Name, Linked Experience, Status, QR Code.
  - **Row Action:** 
    - [ Edit ] -> Opens a modal to rename the place.
    - [ Delete ] -> Soft deletes the place.
    - [ Download QR ] -> Downloads the physical cryptographically signed QR code so the admin can print it.
- **Workflow:** Clicking "Add New Place" opens a simple modal asking for the Place Name.

### D. Experiences Management (`/dashboard/experiences`)
- **Layout:** Card Grid view.
- **UI Elements:**
  - **Header:** "AR Experiences" + [ + Create Draft ] button.
  - **Cards:** Each card represents an AR Scene (e.g., "Library Desk V2"). Shows the Status badge (`DRAFT`, `PUBLISHED`, `ARCHIVED`).
  - **Row Actions:** 
    - [ Edit Details ] -> Rename the experience.
    - [ Delete ] -> Deletes the draft.
    - [ Edit in Visual Builder ] -> Routes to `/dashboard/editor/[id]`
    - [ Publish ] -> Makes it live instantly.

### E. The Visual Builder (`/dashboard/editor/[id]`)
*(Deeply detailed in Doc 07. This is the core spatial editor).*
- **Layout:** Full screen (No sidebars).
- **UI Elements:**
  - **Left Panel:** Component library (Buttons, Videos, 3D Models).
  - **Center Canvas:** The 3D view representing the real world.
  - **Right Panel:** Property editor (X/Y/Z coordinates, colors, Action ID linking).
  - **Top Bar:** [ Save Draft ] and [ Exit ] buttons.

### F. Component & Content Management (`/dashboard/components`)
- **Layout:** List view.
- **UI Elements:**
  - **Tabs:** [ UI Blocks ] | [ Action Webhooks ] | [ Media Assets ]
  - Here, admins define what happens when a button is clicked by entering a target Webhook URL, or they upload heavy 3D `.glb` files using the direct-to-S3 upload system (Doc 13).

---

## 3. The Core User Journey (How it all connects)

To prove the business logic connects perfectly, here is exactly how a user operates the website on Day 1:

1. **Log In:** Admin logs into `/login`.
2. **Create a Location:** Goes to `/dashboard/places`. Clicks "Add New Place". Types "Cafe Table 1". Prints the generated QR Code.
3. **Create Content:** Goes to `/dashboard/experiences`. Clicks "Create Draft" and links it to "Cafe Table 1".
4. **Design the AR:** Clicks "Edit". The Visual Builder (`/editor/[id]`) opens. They drag a `BUTTON` onto the screen, change the text to "Order Espresso", and assign it `Action ID: cafe_order_1`. They click Save.
5. **Go Live:** They return to `/dashboard/experiences` and click **Publish**.

**The result?** The system is instantly live. If a student walks up to "Cafe Table 1" with their phone and scans the QR code, the AR engine fetches the layout, displays the "Order Espresso" button, and handles the logic flawlessly.

---

## Conclusion
The Web UX architecture is explicitly defined. A frontend web developer can read this document alongside the folder structure (Doc 15) and immediately start writing the Next.js UI components.
