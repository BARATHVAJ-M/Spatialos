const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tokenDefId = 'f438daa1-2839-4a93-9e1f-ce88d111d96c';

  const instances = await prisma.serviceInstance.findMany({
    where: { serviceDefinitionId: tokenDefId },
    include: { experience: true }
  });
  
  console.log(`Instances using Token System: ${instances.length}`);
  instances.forEach(i => console.log(`- Instance ${i.id} in Experience ${i.experience.name}`));
}

main().finally(() => prisma.$disconnect());
