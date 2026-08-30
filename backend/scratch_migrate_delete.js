const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const oldDefId = '11111111-1111-1111-1111-111111111111';
  const newDefId = 'e3bac235-08b0-40ff-a5e3-21921cb5a2da'; // v1.2.0

  const instances = await prisma.serviceInstance.findMany({
    where: { serviceDefinitionId: oldDefId }
  });

  console.log(`Found ${instances.length} instances to migrate.`);

  for (const inst of instances) {
    let content = inst.content || {};
    
    // Auto-migrate mediaItems to pages
    if (content.mediaItems && Array.isArray(content.mediaItems)) {
      content.pages = content.mediaItems.map(item => ({
        type: item.type,
        url: item.url,
        text: ''
      }));
      delete content.mediaItems; // clean up old schema
    }

    await prisma.serviceInstance.update({
      where: { id: inst.id },
      data: {
        serviceDefinitionId: newDefId,
        content: content
      }
    });
    console.log(`Migrated Instance ${inst.id}`);
  }

  // Now delete the old definition
  await prisma.serviceDefinition.delete({
    where: { id: oldDefId }
  });

  console.log('Successfully deleted Notice Board v1.0.0 permanently.');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
