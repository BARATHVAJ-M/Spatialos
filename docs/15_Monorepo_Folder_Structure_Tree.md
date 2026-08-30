# SpatialOS Implementation Specification: Monorepo Folder Structure Tree

**Document ID:** 15_Monorepo_Folder_Structure_Tree
**Target Audience:** All Software Engineers
**Objective:** Provide an exhaustive, strict top-to-bottom directory map of the SpatialOS codebase. This guarantees that every new developer knows *exactly* where a file belongs without guessing.

---

## The Master Tree

```text
spatialos-monorepo/
│
├── .github/
│   └── workflows/              # CI/CD deployment scripts
│       ├── build.yml           
│       └── deploy-prod.yml     
│
├── packages/                   # Shared libraries across the monorepo
│   │
│   ├── database/               # The central source of truth for the DB
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # From Doc 02
│   │   │   └── seed.ts         # From Doc 14
│   │   ├── package.json
│   │   └── src/index.ts        # Exports the generated Prisma Client
│   │
│   ├── types/                  # Strict TypeScript Interfaces
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── scene-graph.ts  # From Doc 03 (SceneGraphPayload, Transform3D)
│   │   │   ├── components.ts   # UIElement definitions (VSTACK, BUTTON)
│   │   │   ├── actions.ts      # ActionExecutionRequest definitions
│   │   │   └── index.ts        # Central export
│   │
│   ├── ui-kit/                 # Shared React components for the Admin Dashboard
│   │   ├── src/
│   │   │   ├── Button.tsx
│   │   │   └── Modal.tsx
│   │
│   └── tsconfig/               # Shared TypeScript configurations
│       ├── base.json
│       ├── nextjs.json
│       └── nestjs.json
│
├── apps/                       # Executable applications
│   │
│   ├── backend-api/            # The NestJS Node API Container
│   │   ├── Dockerfile          # From Doc 09
│   │   ├── .env                # From Doc 10
│   │   ├── package.json
│   │   └── src/
│   │       ├── main.ts         # App bootstrap & Swagger setup
│   │       ├── app.module.ts
│   │       │
│   │       ├── core/           # Guards and global interceptors
│   │       │   ├── auth.guard.ts
│   │       │   └── error.interceptor.ts
│   │       │
│   │       └── modules/        # The Business Logic Domains
│   │           ├── compiler/   # From Doc 04 (Compiles DB rows -> JSON)
│   │           │   ├── compiler.controller.ts
│   │           │   ├── compiler.service.ts
│   │           │   └── compiler.module.ts
│   │           │
│   │           ├── actions/    # From Doc 05 (The Action Broker)
│   │           │   ├── actions.controller.ts
│   │           │   ├── action-broker.service.ts
│   │           │   └── actions.module.ts
│   │           │
│   │           ├── gateway/    # From Doc 11 (Real-Time WebSockets)
│   │           │   ├── spatial.gateway.ts
│   │           │   └── gateway.module.ts
│   │           │
│   │           ├── admin/      # From Doc 12 & 13 (Standard CRUD & Assets)
│   │           │   ├── places.controller.ts
│   │           │   ├── experiences.controller.ts
│   │           │   └── assets.controller.ts
│   │           │
│   │           └── prisma/     # Injects the DB connection globally
│   │               └── prisma.service.ts
│   │
│   ├── admin-dashboard/        # The Next.js React Web App
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tailwind.config.ts
│   │   └── src/
│   │       ├── app/            # Next.js App Router Pages
│   │       │   ├── layout.tsx
│   │       │   ├── (auth)/     # Login forms
│   │       │   └── dashboard/
│   │       │       ├── places/page.tsx
│   │       │       ├── experiences/page.tsx
│   │       │       └── editor/[id]/page.tsx # The visual WYSIWYG
│   │       │
│   │       ├── components/     # Local UI logic
│   │       │   └── builder/    # From Doc 07 (Visual Editor components)
│   │       │       ├── CanvasArea.tsx
│   │       │       ├── NodeSidebar.tsx
│   │       │       └── PropEditor.tsx
│   │       │
│   │       ├── store/          # Global Client State
│   │       │   └── useBuilderStore.ts # Zustand draft nodes store
│   │       │
│   │       └── lib/
│   │           └── api.ts      # Axios wrappers pointing to the NestJS API
│   │
│   └── ar-engine-wrapper/      # The Mobile AR Project (Swift/Kotlin/Unity)
│       └── src/
│           ├── SpatialVisionManager  # From Doc 06 (QR detection)
│           ├── SceneParser           # From Doc 06 (Draws 3D/UI from JSON)
│           ├── ServerDrivenUIBuilder # From Doc 06 (Renders generic UI components)
│           ├── ActionEmitter         # From Doc 06 (Posts taps to backend)
│           └── SpatialSocketClient   # From Doc 11 (Listens for live state changes)
│
├── package.json                # Root Turborepo manifest
├── turbo.json                  # Turborepo task runner rules (build, dev, test)
└── .gitignore
```

---

## Why this Structure is Law

If a developer needs to fix a bug where a Button tap fails to log attendance, they know exactly where to go without searching:
1. Mobile send logic? `apps/ar-engine-wrapper/src/ActionEmitter`
2. Payload missing a field? `packages/types/src/actions.ts`
3. Backend crash? `apps/backend-api/src/modules/actions/action-broker.service.ts`

By strictly following this layout, the codebase can scale to millions of lines of code without becoming a tangled monolith.
