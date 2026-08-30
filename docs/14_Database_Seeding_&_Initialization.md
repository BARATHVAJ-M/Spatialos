# SpatialOS Implementation Specification: Database Seeding & Initialization

**Document ID:** 14_Database_Seeding_&_Initialization
**Target Audience:** Full-Stack Developers, Database Admins
**Objective:** Provide the exact TypeScript execution code required to initialize the empty PostgreSQL database on Day 1. This script injects the default super-admin, a demo organization, and the foundational server-driven UI components.

---

## 1. Why Seeding is Critical

In a highly abstracted, dynamic system like SpatialOS, an empty database means a completely broken UI. The Admin Dashboard requires at least one `Organization` and one `User` to log in. The AR Engine requires at least one `Place` and `Experience` to render something.

The seed script bridges the gap between "Installation" and "First Test".

---

## 2. The Execution Command

As defined in Document 10 (Local Setup), this script is executed via Prisma:
```bash
npx ts-node packages/database/prisma/seed.ts
```

---

## 3. The `seed.ts` Blueprint

*Developer Instruction: Place this file in `packages/database/prisma/seed.ts`.*

```typescript
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SpatialOS Database Initialization...');

  // 1. Create the Default System Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'system-demo' },
    update: {},
    create: {
      name: 'SpatialOS Demo Organization',
      slug: 'system-demo',
    },
  });
  console.log(`✅ Organization created: ${org.name}`);

  // 2. Create the Master Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@spatialos.dev' },
    update: {},
    create: {
      email: 'admin@spatialos.dev',
      role: 'SYSTEM_ADMIN',
      organizationId: org.id,
    },
  });
  console.log(`✅ Admin User created: ${admin.email}`);

  // 3. Generate a Secure, Cryptographically Signed QR Target (From Doc 08)
  const placeUuid = '11111111-1111-1111-1111-111111111111'; // Static UUID for the demo
  const signature = crypto
    .createHmac('sha256', process.env.SPATIALOS_QR_SECRET || 'local_qr_signing_secret')
    .update(placeUuid)
    .digest('hex');
  const qrTargetId = `spatialos://resolve?id=${placeUuid}&sig=${signature.substring(0, 16)}`;

  // 4. Create the Physical Place (e.g., Demo Table)
  const place = await prisma.place.upsert({
    where: { qrTargetId: qrTargetId },
    update: {},
    create: {
      id: placeUuid,
      organizationId: org.id,
      name: 'Demo Launchpad (Table 01)',
      qrTargetId: qrTargetId,
    },
  });
  console.log(`✅ Demo Place created. QR Code String: ${place.qrTargetId}`);

  // 5. Create a Foundational Server-Driven UI Component Template (From Doc 02 & 03)
  const welcomeCard = await prisma.componentTemplate.create({
    data: {
      name: 'Welcome Card UI',
      uiLayout: {
        type: 'VSTACK',
        spacing: 16,
        children: [
          { type: 'TEXT', text: 'Welcome to SpatialOS', style: 'HEADER' },
          { type: 'TEXT', text: 'System Online and Ready.', style: 'BODY' },
          { type: 'BUTTON', label: 'Acknowledge', buttonStyle: 'PRIMARY', actionId: 'demo_act_1' }
        ]
      }
    }
  });

  // 6. Create the Published AR Experience
  const experience = await prisma.experience.create({
    data: {
      organizationId: org.id,
      placeId: place.id,
      name: 'Initial System Demo',
      status: 'PUBLISHED',
      version: 1,
    }
  });

  // 7. Inject the UI Component into the Spatial Scene at (0, 0, 0)
  await prisma.spatialNode.create({
    data: {
      experienceId: experience.id,
      nodeType: 'UI_PANEL',
      referenceId: welcomeCard.id, // Links to the JSON layout above
      positionX: 0, positionY: 0, positionZ: 0,
    }
  });
  console.log(`✅ Spatial Experience deployed.`);

  console.log('🚀 Database Seeding Complete! You may now log in to the Dashboard or scan the QR Code.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 4. The Developer Hand-Off

Once this script runs, the database is perfectly populated. The backend developer can boot the NestJS API, and the mobile developer can immediately hit the `/api/v1/scene?qr_id=...` endpoint and see real, valid JSON data matching the `SceneGraphPayload` contract.
