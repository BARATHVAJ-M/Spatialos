# SpatialOS Implementation Specification: Repository Folder Structure Tree

**Document ID:** 15_Monorepo_Folder_Structure_Tree  
**Target Audience:** All Software Engineers  
**Objective:** Provide an exhaustive, strict top-to-bottom directory map of the SpatialOS codebase. This guarantees that every new developer knows *exactly* where a file belongs without guessing.

---

## The Master Repository Tree

```text
APP-1/
│
├── backend/                             # NestJS Backend API & Prisma Database
│   ├── prisma/
│   │   ├── schema.prisma                # Database Models & Relational Schema
│   │   └── seed.ts                      # Database Seeder (Default Org, Admins, Services)
│   ├── src/
│   │   ├── api/                         # NestJS HTTP Controllers (REST Endpoints)
│   │   │   ├── auth.controller.ts       # Authentication & JWT Issuance
│   │   │   ├── places.controller.ts     # Physical Locations CRUD & QR Resolution
│   │   │   ├── experiences.controller.ts# AR Experiences, Versions & Scene Graph
│   │   │   ├── services.controller.ts   # Micro-App Definitions & Instances
│   │   │   ├── content.controller.ts    # Media & Asset Upload API
│   │   │   └── overview.controller.ts   # System Health & Dashboard Metrics
│   │   ├── logic/                       # Core Business Logic Services
│   │   │   ├── auth.service.ts
│   │   │   ├── places.service.ts
│   │   │   ├── experiences.service.ts
│   │   │   └── services.service.ts
│   │   ├── core/                        # Global Contracts, Guards, Interceptors & Adapters
│   │   │   ├── guards/                  # JwtAuthGuard, RolesGuard
│   │   │   ├── adapters/                # Storage Adapters (LocalDiskAdapter, S3)
│   │   │   └── contracts/               # Service interfaces & data contracts
│   │   ├── database/                    # PrismaModule & Database connection
│   │   ├── main.ts                      # Server bootstrap, CORS, and pipes
│   │   └── app.module.ts                # Root DI module
│   └── test/                            # E2E integration test suites
│
├── dashboard/                           # Next.js 16 (Turbopack) Admin Web Dashboard
│   ├── public/                          # Brand assets & static files
│   └── src/
│       ├── app/                         # Next.js App Router Pages
│       │   ├── page.tsx                 # Dashboard Overview & System Metrics
│       │   ├── login/page.tsx           # Admin Authentication Screen
│       │   ├── places/                  # Physical Places Management & QR Deep Links
│       │   ├── experiences/             # AR Experiences Visual Canvas & Publishing
│       │   ├── services/                # Micro-App Configuration & Instance Editors
│       │   ├── content/                 # Asset Library & Media Uploader
│       │   ├── users/                   # Role & Team Management
│       │   ├── publishing/              # Multi-version Deployment & Rollback
│       │   ├── monitoring/              # System Health & Error Diagnostics
│       │   └── settings/                # Tenant & Profile Settings
│       ├── components/                  # Reusable UI Components & Dialogs
│       │   ├── services/                # Micro-App Custom Editors (NoticeBoard, etc.)
│       │   ├── CanvasArea.tsx           # 2D/3D Spatial Canvas
│       │   ├── Sidebar.tsx              # OLED Dark Mode App Shell Navigation
│       │   └── TopBar.tsx               # Omnibar Search & Notification Drawer
│       ├── core/                        # HTTP Client, Auth Provider, Data Interfaces
│       └── tests/                       # Automated Jest test suites
│
├── user_app/                            # Flutter Mobile Application
│   ├── lib/
│   │   ├── core/                        # Theme (AppColors), Routing, Constants
│   │   ├── services/                    # ApiService, Dio HTTP Client, AR Resolver
│   │   └── ui/                          # AR Camera Screen, Notice Board Overlays
│   └── android/                         # Android native runner, Gradle & Permissions
│
├── AR-ENGINE/                           # Spatial AR Rendering & Math Engine
│   └── spatialos_ar_engine/             # Coordinate math, 3D transform matrices, anchor tracking
│
├── docs/                                # Authoritative Architecture & Technical Runbooks
│   ├── 00_Master_Blueprint.md           # Core philosophy & system architecture
│   ├── 01_Core_Architecture_&_Stack.md  # Foundational tech stack decisions
│   ├── 02_Database_Schema.md            # PostgreSQL + Prisma schema design
│   ├── 03_API_Contracts.md              # Scene graph & action execution payloads
│   ├── 04_The_Compiler_Engine.md        # JSON Scene Graph compilation rules
│   ├── 05_The_Action_Broker.md          # Decoupled action handling & webhooks
│   ├── 06_AR_Client_SDK_Integration.md  # Client AR SDK integration guide
│   ├── 08_Security_&_Physical_Binding.md# QR cryptographic binding & anti-spoofing
│   ├── 09_Infrastructure_&_Cloud_Deployment.md # VPS & Production deployment runbook
│   ├── 10_Developer_Onboarding_&_Local_Setup.md # Local developer environment setup
│   ├── 11_State_Synchronization_&_Realtime_AR.md # Live WebSocket & SSE synchronization
│   ├── 12_Admin_CRUD_APIs.md            # Full Admin REST API documentation
│   ├── 13_Asset_Upload_System.md        # File storage & multipart upload specifications
│   ├── 14_Database_Seeding_&_Initialization.md # Seeding data & initialization sequences
│   ├── 15_Monorepo_Folder_Structure_Tree.md # This repository layout specification
│   ├── 16_Development_Workflow_&_Git_Rules.md # Git branching model & commit standards
│   ├── 17_Auth_&_Analytics_APIs.md      # Authentication & spatial analytics APIs
│   ├── 19_Admin_Dashboard_Blueprint.md  # Master 383-line Admin Dashboard UI/UX blueprint
│   ├── 19_IAM_Policy_&_Generic_CRUD.md  # IAM, Multi-tenant isolation & ABAC/RBAC
│   ├── 20_Event_Driven_Architecture_&_Audit.md # Audit logging & event queue
│   ├── 21_Search_Reporting_&_Notifications.md # Omnibar search & notification bus
│   ├── 22_Top_Bar_Features_Blueprint.md # Global top bar, breadcrumbs & status pills
│   ├── SECURITY_AUDIT.md                # Master security audit & compliance report
│   ├── SPATIALOS_PLATFORM_ARCHITECTURE.md # Platform purpose & high-level architecture
│   ├── backend/                         # Comprehensive backend architecture & audit reports
│   ├── dashboard/                       # Dashboard architecture, test plans & audit reports
│   └── blueprints/                      # Active domain service blueprints
│
└── unwanted/                            # Deprecated legacy drafts and notes
```
