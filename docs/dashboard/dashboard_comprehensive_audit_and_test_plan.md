# Master Dashboard Audit & Real-Flow Verification Plan

**Project**: SpatialOS Admin Dashboard (`dashboard/`)  
**Stack**: Next.js 16.3.1 (App Router), React 19.2.8, Tailwind CSS v4, Lucide React, Jest 30.5  
**Audit Standard**: Senior Frontend Architect & Systems Reliability Review  
**Date**: October 2026

---

## 1. Executive Summary & Objective

This plan establishes an exhaustive, line-by-line inspection and automated validation framework for the **SpatialOS Dashboard** web application. It mirrors the senior-level verification executed on the backend to guarantee:
1. **0 Broken API / Network Flows**: Every request/response matches the NestJS backend contracts precisely.
2. **Elimination of Ghosted Links & Hardcoded Mock Identifiers**: Dynamic IDs and operational routing across all 14 routes.
3. **Flawless Layer 4 / Layer 3 Architecture**: Unified HTTP client, backward-compatible API adapter, strongly typed Result patterns, and resilient error propagation.
4. **Crisp OLED Dark Theme & Layout Stability**: Compliance with `AGENTS.md` guidelines (`#0F172A` deep space dark background, `#1E293B` containers, high contrast cyan/indigo accents, no conflicting Tailwind classes).
5. **Automated Verification Harness**: Native Jest integration testing verifying full client-to-backend request/response flows and 100% build pass.

---

## 2. Audit Scope & Component Inventory

| Layer | Files & Routes | Inspection Criteria |
|---|---|---|
| **Core Network & HTTP** | `src/core/http/http-client.ts`, `src/lib/api.ts`, `src/types/api.ts` | Base URL resolution, prefix collisions (`/v1/admin`), token attachment, 401 redirect handling, error extraction |
| **Domain Client Services** | `src/services/` (`places.service.ts`, `experiences.service.ts`, `content.service.ts`, `auth.service.ts`) | Strict interface implementation, Result pattern wrapping, payload normalization, error categorization |
| **Custom Hooks** | `src/hooks/` (`usePlaces.ts`, `useExperiences.ts`, `useContentAssets.ts`, `useAuth.ts`, `useExperienceEditor.ts`) | Lifecycle management, state immutability, memory leak prevention, async error capture |
| **Top-Level Pages** | 14 routes (`/`, `/places`, `/places/create`, `/places/[id]`, `/experiences`, `/experiences/create`, `/experiences/[id]`, `/services`, `/content`, `/users`, `/publishing`, `/monitoring`, `/settings`, `/login`) | SSR/CSR safety, hydration consistency, route parameter handling, empty states, search filtering |
| **Micro-App Editors** | `NoticeBoardEditor.tsx`, `ClassroomEditor.tsx`, `StaffDetailsEditor.tsx`, `ComplaintBoxEditor.tsx`, `VisualEditor.tsx`, `NodeInspector.tsx` | Canvas math normalization, AR plane aspect ratio, drag/resize state constraints, zero-PII security |
| **Layout & Navigation** | `Sidebar.tsx`, `TopNav.tsx`, `DashboardHeader.tsx`, `AppLayout.tsx`, `ThemeToggle.tsx` | Nav item highlights, unread count polling, ping latency simulation, active workspace display, clean dark mode classes |

---

## 3. Defect Taxonomy & Remediation Registry

| Defect ID | Severity | File | Problem Description | Remediation Plan |
|---|---|---|---|---|
| **DASH-DEF-01** | High | `src/core/http/http-client.ts` | Double prefixing bug: If an endpoint starts with `/v1/admin`, `resolveUrl` appends `/v1/admin` again (e.g. `/v1/admin/v1/admin/places`). | Update `resolveUrl` to check if `cleanEndpoint` already starts with `/v1/admin`, `/auth`, or `/health`. |
| **DASH-DEF-02** | Medium | `package.json` | Missing `"test": "jest"` in `"scripts"`, blocking automated verification via standard `npm test`. | Add `"test": "jest"` to `"scripts"`. |
| **DASH-DEF-03** | Low | `jest.config.js` | Jest Haste Map collision warning due to scanning `.next/standalone/package.json`. | Add `modulePathIgnorePatterns: ['<rootDir>/.next/']`. |
| **DASH-DEF-04** | Medium | `src/app/places/[id]/page.tsx` | Ghosted/hardcoded route: Lines 586 and 628 use hardcoded `/experiences/1` instead of dynamic `/experiences/${exp.id}`. | Replace with dynamic `${exp.id}`. |
| **DASH-DEF-05** | Low | `src/components/OverviewWidgets.tsx` | Dead link: Line 88 references `/content/add` which does not exist; Content library upload lives at `/content`. | Update `href` to `/content`. |
| **DASH-DEF-06** | Low | `src/components/Sidebar.tsx` | Conflicting/duplicated dark-mode Tailwind classes (`dark:text-slate-700 dark:text-slate-300`, `dark:hover:bg-white dark:bg-slate-800`). | Standardize and de-duplicate Tailwind classes. |
| **DASH-DEF-07** | Low | `src/components/services/ComplaintBoxEditor.tsx` | Button contrast: Line 100 has `text-slate-900` on `bg-cyan-600` in light mode. | Standardize to `text-white font-medium`. |

---

## 4. Real-Flow Automated Verification Suite Design

An automated integration audit test suite will be deployed in `src/tests/dashboard-flow-audit.test.ts`. This suite executes live HTTP calls against the backend running on `http://127.0.0.1:3001`:

1. **Authentication Flow**:
   - `authService.login({ email: 'admin@spatialos.com', password: 'Password123!' })`
   - Validate token generation, cookie setting, and payload parsing.
2. **Places Service Flow**:
   - `placesService.getAll()`: verify non-empty array of places.
   - `placesService.create()`: create a test place with valid QR system ID.
   - `placesService.getById(id)`: verify retrieval of created place.
   - `placesService.update(id)`: update name.
   - `placesService.delete(id)`: verify deletion and clean removal.
3. **Experiences Service Flow**:
   - `experiencesService.create()`: create an experience linked to an existing place.
   - `experiencesService.getById(id)`: verify retrieval and attached relations.
   - `experiencesService.updateNodes(id, nodes)`: verify saving spatial nodes.
   - `experiencesService.publish(id)`: compile and publish to live status.
   - `experiencesService.rollback(id)`: rollback version.
   - `experiencesService.delete(id)`: cleanup experience.
4. **Overview & Analytics Endpoints**:
   - Test `/overview/summary`, `/overview/publishing`, `/overview/health`, `/overview/activity`, `/overview/monitoring/stats`, `/overview/monitoring/logs`.
5. **Settings & Profile Endpoints**:
   - Test `/settings/profile`, `/settings/users/me`, `/settings/notifications`.
6. **Staff & Service Templates**:
   - Test `/services/definitions`, `/staff/sync`.

---

## 5. Verification Gates & Execution Steps

- [x] Step 1: Complete line-by-line inspection across all 14 routes and micro-app editors.
- [ ] Step 2: Implement remediations for DASH-DEF-01 through DASH-DEF-07.
- [ ] Step 3: Implement automated real-flow integration test suite `dashboard-flow-audit.test.ts`.
- [ ] Step 4: Run `npm test` and ensure all test suites pass with 0 errors.
- [ ] Step 5: Run `npm run build` and ensure Next.js production build succeeds with 0 errors.
- [ ] Step 6: Publish final verification report and update documentation.
