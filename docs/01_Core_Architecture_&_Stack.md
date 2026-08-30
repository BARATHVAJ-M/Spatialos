📄 01_Core_Architecture_&_Stack.md
Markdown
# SpatialOS Implementation Specification: Core Architecture & Tech Stack

**Document ID:** 01_Core_Architecture_&_Stack
**Objective:** Define the exact technologies, repository structure, and generic abstraction patterns for the SpatialOS Backend and Admin layers.

---

## 1. Technology Stack

To achieve high abstraction, fast iteration, and strict type safety across the entire system, the stack is standardized:

* **Language:** TypeScript (Strict Mode). Ensures the API payloads perfectly match the frontend expectations.
* **Backend Framework:** NestJS (Node.js). Selected for its heavily modular, Angular-like structure, dependency injection, and out-of-the-box support for generic interfaces.
* **Database ORM:** Prisma. Selected for generating type-safe database queries and handling complex JSON payloads (for Component configurations) natively.
* **Database Engine:** PostgreSQL (Supabase or AWS RDS). Required for native `JSONB` support (critical for storing Server-Driven UI definitions) and PostGIS (future spatial queries).
* **API Protocol:** REST (for standard CRUD) and GraphQL (optional, for fetching deeply nested Scene Graphs efficiently).
* **Admin Dashboard:** Next.js (React) + TailwindCSS.

---

## 2. Repository Structure (Monorepo Strategy)

We use a Monorepo (via Turborepo or Nx) to share the exact same TypeScript Interfaces between the Backend, Admin App, and the AR Client payload definitions.

```text
spatialos-monorepo/
│
├── packages/
│   ├── types/               # Shared TypeScript interfaces (The "Contracts")
│   │   ├── scene-graph.ts   # Definition of X,Y,Z layout
│   │   ├── components.ts    # Definition of UI elements (Button, Text)
│   │   └── actions.ts       # Definition of interaction payloads
│   │
│   ├── database/            # Prisma schema and migrations
│   │   └── schema.prisma
│
├── apps/
│   ├── backend-api/         # NestJS Server
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── places/       # QR/Location mapping
│   │   │   │   ├── experiences/  # Config wrappers
│   │   │   │   ├── compiler/     # Generates the JSON for the AR Engine
│   │   │   │   └── actions/      # Webhook/Service broker
│   │
│   ├── admin-dashboard/     # Next.js Web App
│   │   ├── src/
│   │   │   ├── features/    # UI for managing DB entities
│
└── clients/
    └── ar-engine-wrapper/   # The SDK that wraps your existing AR Engine
3. The Abstraction Pattern: The "Compiler" Module
The most critical part of this architecture is the Compiler Module in the Backend.

The Database stores raw, fragmented data (Place, Content, Component). The AR Engine needs a single, clean JSON file (The Scene Graph). The Compiler sits in the middle.

Implementation Rule:
The AR Engine never queries the database directly for "give me the video for this place." It makes one call: GET /api/v1/scene?qr_id=123.

Backend Implementation Concept (NestJS / TypeScript):
TypeScript
// 1. The Controller intercepts the QR scan
@Controller('scene')
export class SceneController {
  constructor(private readonly compilerService: CompilerService) {}

  @Get()
  async getSceneForQR(@Query('qr_id') qrId: string): Promise<SceneGraphPayload> {
    // Generates the final generic JSON
    return this.compilerService.compileForClient(qrId); 
  }
}

// 2. The Compiler Service (The Brain)
@Injectable()
export class CompilerService {
  async compileForClient(qrId: string): Promise<SceneGraphPayload> {
    // A. Find the Place by QR
    const place = await this.db.place.findUnique({ where: { qrId } });
    
    // B. Find the Active Experience for this Place
    const experience = await this.db.experience.findFirst({ where: { placeId: place.id, status: 'PUBLISHED' } });
    
    // C. Fetch all abstract components and their spatial positions
    const spatialNodes = await this.db.spatialNode.findMany({ where: { experienceId: experience.id } });

    // D. Assemble the generic JSON
    return {
      version: "1.0",
      scene_id: experience.id,
      nodes: spatialNodes.map(node => this.formatNode(node)) // Formats to generic UI/3D contract
    };
  }
}
4. The Action Broker Pattern (Interaction Handling)
When a user taps a button in the AR Engine, the app must not process the logic. It sends an abstract payload to the Action Broker.

The Rule of "Thin Clients":
The AR Engine simply executes:
POST /api/v1/actions/execute
Body: {"action_id": "btn_order_coffee", "context": {"qr_id": "123", "user_id": "456"}}

The Backend Router:
The backend determines what btn_order_coffee means.

TypeScript
@Injectable()
export class ActionBrokerService {
  async execute(actionPayload: ActionRequest) {
    const actionDef = await this.db.actionDefinition.findUnique(actionPayload.action_id);
    
    // The backend acts as a switchboard
    switch(actionDef.serviceType) {
      case 'WEBHOOK':
        return this.http.post(actionDef.targetUrl, actionPayload.context);
      case 'INTERNAL_DB_UPDATE':
        return this.db.update(...);
      default:
        throw new Error('Unknown service type');
    }
  }
}
5. Next Steps
This file establishes how the code is organized and the core patterns (The Compiler, The Action Broker, The Thin Client).

To build the database that feeds this system, we need to design the Prisma Schema.