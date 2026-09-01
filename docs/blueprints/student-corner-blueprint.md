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
* Description: Showcase of student achievements and projects.
* Purpose: Highlight student talent across physical campus spaces.

---

# 7. Data Model

## Configuration Fields
* `title` (String)
* `allowedCategories` (Array of Strings): Defines tabs in AR.

## Content Fields
* `items` (Array):
  * `id`
  * `title`
  * `description`
  * `category`
  * `date`
  * `image` / `video`

---

# 17. User Actions

* `get_all`: Fetch the entire portfolio.
* `view_item`: Tap into a specific project.
