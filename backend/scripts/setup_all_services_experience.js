const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const place = await prisma.place.findFirst({
    where: { qrTargetId: 'spatialos://resolve?id=fus9dw' }
  });

  if (!place) {
    console.error('Place not found');
    return;
  }

  // Get service definitions
  const defs = await prisma.serviceDefinition.findMany();
  const defMap = {};
  defs.forEach(d => defMap[d.name] = d);

  const exp = await prisma.experience.create({
    data: {
      place: { connect: { id: place.id } },
      organization: { connect: { id: place.organizationId } },
      name: 'IT Dept All Services',
      version: Math.floor(Date.now() / 1000), // Ensure it's latest
      status: 'PUBLISHED'
    }
  });

  console.log(`Created Experience: ${exp.id}`);

  // 2. Define Services and Spatial Nodes
  const servicesData = [
    {
      name: 'Complaint Box',
      x: -1.8, y: 0.0,
      config: {
        title: 'IT Dept Complaint Box',
        description: 'Submit your grievances here.',
      }
    },
    {
      name: 'Classroom',
      x: -0.6, y: 0.0,
      config: {
        className: 'IT Dept Classroom',
        currentClass: { subject: 'Database Systems', staff: 'Dr. Alan', time: '10:00' },
        nextClass: { subject: 'Operating Systems', staff: 'Prof. Smith', time: '11:00' },
        displayOptions: { showNextClass: true, showReminders: true },
        reminders: [{ title: 'Assignment Due', description: 'Submit by Friday' }]
      }
    },
    {
      name: 'Staff Details',
      x: 0.6, y: 0.0,
      config: {
        staffId: '01-001-OS', // Assume this exists or is handled gracefully
        displayContact: true,
        displayTimetable: true
      }
    },
    {
      name: 'Notice Board',
      x: 1.8, y: 0.0,
      config: {
        title: 'IT Dept Notices',
        description: 'Important announcements'
      },
      content: {
        pages: [{
          id: 'page1',
          mediaItems: [{
            id: 'item1',
            type: 'text',
            title: 'Welcome Back!',
            description: 'Classes begin this week.',
            x: 0, y: 0, width: 300, height: 100, rotation: 0,
            color: '#FFFFFF', bgColor: '#1E293B'
          }]
        }]
      }
    }
  ];

  for (const s of servicesData) {
    const def = defMap[s.name];
    if (!def) {
      console.warn(`Definition not found for ${s.name}`);
      continue;
    }

    const node = await prisma.spatialNode.create({
      data: {
        experience: { connect: { id: exp.id } },
        nodeType: 'UI_PANEL',
        referenceId: require('crypto').randomUUID(),
        positionX: s.x,
        positionY: s.y,
        positionZ: -1.0, // Push slightly back in Z space
        rotationX: 0, rotationY: 0, rotationZ: 0,
        scaleX: 1, scaleY: 1, scaleZ: 1,
      }
    });

    await prisma.serviceInstance.create({
      data: {
        experience: { connect: { id: exp.id } },
        serviceDefinition: { connect: { id: def.id } },
        spatialNodeId: node.id,
        organization: { connect: { id: place.organizationId } },
        name: s.name,
        configuration: s.config,
        content: s.content || {},
      }
    });
    console.log(`Attached ${s.name} at x: ${s.x}, y: ${s.y}`);
  }

  // Set previous experiences to ARCHIVED
  await prisma.experience.updateMany({
    where: { placeId: place.id, id: { not: exp.id } },
    data: { status: 'ARCHIVED' }
  });

  console.log('Setup complete.');
}

main().catch(e => {
  console.error(e);
}).finally(async () => {
  await prisma.$disconnect();
});
