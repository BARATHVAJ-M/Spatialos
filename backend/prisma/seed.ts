import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Ensure Organization
  const orgId = '00000000-0000-0000-0000-000000000000';
  const org = await prisma.organization.upsert({
    where: { slug: 'default-org' },
    update: {},
    create: {
      id: orgId,
      name: 'Default Organization',
      slug: 'default-org',
    },
  });
  console.log(`Organization created/found: ${org.name} (ID: ${org.id})`);

  // 2. Ensure Admin User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('RESHMA@17/03', salt);
  
  const user = await prisma.user.upsert({
    where: { email: 'barathvaj2517@gmail.com' },
    update: {
      role: 'ADMIN',
      passwordHash: passwordHash
    },
    create: {
      organizationId: org.id,
      email: 'barathvaj2517@gmail.com',
      passwordHash: passwordHash,
      role: 'ADMIN',
    },
  });
  console.log(`User created/found: ${user.email}`);

  // 3. Ensure Service Definitions
  const serviceDefs = [
    {
      name: 'Notice Board',
      version: '1.2.0',
      category: 'Information',
      description: 'A digital board to broadcast announcements to guests.',
      configurationSchema: {
        title: { type: 'string', label: 'Board Title', required: true, default: 'General Notices' },
        boardWidth: { type: 'number', label: 'Board Width (meters)', required: true, default: 2.0 },
        boardHeight: { type: 'number', label: 'Board Height (meters)', required: true, default: 1.5 },
        borderColor: { type: 'color', label: 'Outline Color', required: false, default: '#4f46e5' }
      },
      contentSchema: {
        mediaItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['image', 'video'] },
              url: { type: 'string' },
              x: { type: 'number' },
              y: { type: 'number' },
              width: { type: 'number' },
              height: { type: 'number' },
              rotation: { type: 'number' }
            }
          }
        }
      }
    },
    {
      name: 'Complaint Box',
      version: '1.0.0',
      category: 'Feedback',
      description: 'Allow users to submit anonymous or named feedback directly to admins.',
      configurationSchema: {
        title: { type: 'string', label: 'Box Title', required: true, default: 'Feedback Box' },
        allowAnonymous: { type: 'boolean', label: 'Allow Anonymous Submissions', required: false, default: false },
        categories: { type: 'select', label: 'Feedback Categories', options: ['Maintenance', 'Security', 'General'], required: true, default: 'General' },
        maxMessageLength: { type: 'number', label: 'Maximum Message Length', required: true, default: 500, min: 10, max: 2000 }
      }
    },
    {
      name: 'Token System',
      version: '2.1.0',
      category: 'Queue Management',
      description: 'A virtual queueing system to prevent physical crowding.',
      configurationSchema: {
        counterName: { type: 'string', label: 'Counter Name', required: true, default: 'Counter 1' },
        tokenPrefix: { type: 'string', label: 'Token Prefix', required: true, default: 'A-' },
        maximumQueue: { type: 'number', label: 'Maximum Queue Size', required: true, default: 50 },
      }
    }
  ];

  for (const def of serviceDefs) {
    const existing = await prisma.serviceDefinition.findFirst({
      where: { name: def.name, organizationId: org.id }
    });

    if (!existing) {
      await prisma.serviceDefinition.create({
        data: {
          organizationId: org.id,
          name: def.name,
          version: def.version,
          category: def.category,
          description: def.description,
          configurationSchema: def.configurationSchema,
          contentSchema: (def as any).contentSchema,
        }
      });
      console.log(`Created Service Definition: ${def.name}`);
    } else {
      await prisma.serviceDefinition.update({
        where: { id: existing.id },
        data: {
          configurationSchema: def.configurationSchema,
          contentSchema: (def as any).contentSchema,
          description: def.description,
          version: def.version
        }
      });
      console.log(`Updated Service Definition: ${def.name}`);
    }
  }

  // 4. Ensure Default Place
  let place = await prisma.place.findFirst({ where: { organizationId: org.id } });
  if (!place) {
    place = await prisma.place.create({
      data: {
        organizationId: org.id,
        name: 'Main Campus Lobby',
        qrTargetId: 'main-campus-lobby-qr',
      }
    });
    console.log(`Created default Place`);
  }

  // 5. Ensure Default Experience
  const experience = await prisma.experience.findFirst({ where: { organizationId: org.id, placeId: place.id } });
  if (!experience) {
    await prisma.experience.create({
      data: {
        organizationId: org.id,
        placeId: place.id,
        name: 'Main Campus Lobby Experience',
        version: 1,
        status: 'DRAFT',
      }
    });
    console.log(`Created default Experience`);
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
