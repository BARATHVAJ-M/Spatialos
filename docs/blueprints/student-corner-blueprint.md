# SpatialOS Service Master Blueprint

**Document Type:** Service Definition / Implementation Blueprint
**Platform:** SpatialOS
**Version:** V1
**Status:** Approved
**Service Name:** Student Corner
**Service Type:** student-corner
**Service Version:** 1.0.0

---

# 1. Service Identity

## 1.1 Basic Information

* Service ID: `student-corner`
* Service Name: Student Corner
* Service Type: Showcase
* Version: 1.0.0
* Description: Showcase of student achievements and projects.
* Purpose: Highlight student talent across physical campus spaces.
* Owner: Admin/Students Council

---

# 2. Service Purpose

## 2.1 Problem
Student projects, artwork, and achievements are often hidden in labs or forgotten.

## 2.2 Objective
Create a spatial portfolio gallery where users can walk up, browse different categories of student work, and view media.

---

# 5. Service Structure

```text
STUDENT CORNER
│
├── Main Title
├── Categories Navigation
└── Items Portfolio Array
```

---

# 7. Data Model

## Configuration Fields
* `title` (String): e.g. "Innovation Hub"
* `allowedCategories` (Array of Strings): e.g. `['Achievements', 'Projects', 'Arts', 'Events']`

## Content Fields
* `items` (Array):
  * `id`
  * `title`
  * `description`
  * `category`
  * `date`
  * `image` / `video`

---

# 14. Business Logic

## Rule 1: Category Filtering (Handled by AR)
**Condition:** User taps a category tab.
**Action:** AR Engine filters the `items` array locally.
**Result:** Smooth, instant tab switching without backend lag.

---

# 16. Runtime Behavior

```text
Service Load
   ↓
Return full `items` array to AR Engine
   ↓
AR Engine locally groups by `allowedCategories`
   ↓
Render UI
```

---

# 17. User Actions

* `get_all`: Fetch the entire portfolio.
* `view_item`: Tap into a specific project to expand image/video.

---

# 20. Database Requirements

* `ServiceInstance` JSONB.

---

# 40. Acceptance Criteria

* [x] Schema configured.
* [x] Logic implemented.
* [x] `view_item` successfully expands specific content.
