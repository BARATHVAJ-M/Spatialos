# SpatialOS Implementation Specification: The Compiler Engine

**Document ID:** 04_The_Compiler_Engine
**Target Audience:** Backend Engineers
**Objective:** Define the NestJS/TypeScript service that queries the Prisma database and recursively compiles the abstract data into the strict `SceneGraphPayload` for the AR Engine.

---

## 1. The Engineering Challenge

The database stores `Places`, `Experiences`, `SpatialNodes`, and `ComponentTemplates` in separate relational tables to maintain normalization and abstraction. 

However, the AR Engine requires a single, deeply nested JSON object. The **Compiler Engine** acts as the translator. It must:
1. Validate the QR target.
2. Ensure there is an active, `PUBLISHED` experience for that location.
3. Fetch all 3D coordinates.
4. Inject the raw JSONB Server-Driven UI definitions.

---

## 2. The Master Prisma Query

To keep API latency under 50ms, we do not make 10 separate database calls. We make **one** complex query using Prisma's `include` mechanism.

```typescript
// The goal is to fetch the Place -> Active Experience -> Nodes -> Content/UI Templates
const placeWithScene = await this.prisma.place.findUnique({
  where: { qrTargetId: targetId },
  include: {
    experiences: {
      where: { status: 'PUBLISHED' },
      take: 1, // Only grab the active one
      include: {
        spatialNodes: true // Gets all X,Y,Z data and reference IDs
      }
    }
  }
});
3. The Implementation Code (compiler.service.ts)Developer Instruction: Place this in apps/backend-api/src/modules/compiler/compiler.service.ts. This service requires the PrismaService to talk to the DB, and it returns the SceneGraphPayload defined in Document 03.TypeScriptimport { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  SceneGraphPayload, 
  SpatialNode, 
  MediaPayload, 
  UIPayload 
} from '@spatialos/types/scene-graph'; // Imported from Monorepo

@Injectable()
export class CompilerService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generates the complete Golden Payload for the Mobile AR Engine.
   * @param qrTargetId The raw string scanned by the phone's camera.
   */
  async compileSceneForClient(qrTargetId: string): Promise<SceneGraphPayload> {
    
    // 1. Execute the Master Query
    const place = await this.prisma.place.findUnique({
      where: { qrTargetId },
      include: {
        experiences: {
          where: { status: 'PUBLISHED' },
          take: 1,
          include: { spatialNodes: true }
        }
      }
    });

    // 2. Fallbacks & Validation
    if (!place) {
      throw new NotFoundException('Unrecognized QR Target');
    }
    
    const activeExperience = place.experiences[0];
    if (!activeExperience) {
      throw new NotFoundException('No active spatial experience deployed here.');
    }

    // 3. Compile the Spatial Nodes
    const compiledNodes: SpatialNode[] = await Promise.all(
      activeExperience.spatialNodes.map(node => this.resolveNode(node))
    );

    // 4. Return the strict SceneGraphPayload Contract
    return {
      version: "1.0.0",
      placeId: place.id,
      experienceName: activeExperience.name,
      theme: "DARK", // Could be pulled from DB later
      spatialNodes: compiledNodes
    };
  }

  /**
   * Helper function: Translates a DB row into the Client API Contract.
   */
  private async resolveNode(dbNode: any): Promise<SpatialNode> {
    const baseNode: SpatialNode = {
      nodeId: dbNode.id,
      type: dbNode.nodeType,
      transform: {
        position: { x: dbNode.positionX, y: dbNode.positionY, z: dbNode.positionZ },
        rotation: { x: dbNode.rotationX, y: dbNode.rotationY, z: dbNode.rotationZ },
        scale:    { x: dbNode.scaleX, y: dbNode.scaleY, z: dbNode.scaleZ }
      }
    };

    // Resolving MEDIA types (Images, Video, 3D)
    if (dbNode.nodeType === 'MEDIA') {
      const asset = await this.prisma.contentAsset.findUnique({ where: { id: dbNode.referenceId } });
      baseNode.mediaPayload = {
        assetType: asset.assetType as any,
        url: asset.url,
        loop: asset.metadata?.['loop'] ?? false,
        autoPlay: asset.metadata?.['autoPlay'] ?? true
      };
    }

    // Resolving UI_PANEL types (Server-Driven UI Layouts)
    if (dbNode.nodeType === 'UI_PANEL') {
      const template = await this.prisma.componentTemplate.findUnique({ where: { id: dbNode.referenceId } });
      
      // Inject the JSONB layout directly into the payload
      baseNode.uiPayload = {
        layout: template.uiLayout as any
      };
    }

    return baseNode;
  }
}
4. Performance & Caching Strategy (Developer Notes)Because the SceneGraphPayload is highly abstracted and read-heavy, it is the perfect candidate for caching.To prevent the database from crashing when 1,000 students scan the Canteen QR code at the same time:Redis Implementation: Wrap the compileSceneForClient function in a Redis cache.Key: spatialos:scene:{qrTargetId}Cache Invalidation: The cache is only flushed when an Admin clicks "Publish" on an Experience in the Dashboard. Otherwise, the JSON payload remains completely static in memory, dropping API latency to ~5ms.5. Security & Context Injection (Future V2)Currently, the Compiler returns the exact same layout for everyone.In V2, the Compiler will accept the userId token. Before returning the UIPayload, the Compiler will parse the layout and replace placeholders:E.g., {"text": "Welcome, {{USER_NAME}}"} $\rightarrow$ Compiler injects the database profile name before sending to the phone.If the user is a SYSTEM_ADMIN, the Compiler might dynamically inject an extra BUTTON into the array that says "Edit Scene".By doing this on the server (Compiler side), the AR Engine continues to remain entirely "dumb."
***

### What we have accomplished:
We have bridged the gap. We went from raw database rows (`02`) to the strict JSON layout (`03`) using a highly scalable TypeScript backend service (`04`).

### The Final Missing Link
There is one massive architectural piece left. 

The Mobile App can now render buttons from the cloud. **But what happens when the user actually TAPS that button in AR?** How does the tap on the screen tell the college library to issue a book, or the canteen to make a coffee? We need to build the interaction loop.

Shall we proceed to **`05_The_Action_Broker.md`** to define how webhook routing and abstract UI actions are execut