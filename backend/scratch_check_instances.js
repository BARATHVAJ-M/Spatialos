const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const instances = await prisma.serviceInstance.findMany({
    where: { serviceDefinitionId: '11111111-1111-1111-1111-111111111111' },
    include: { experience: true }
  });
  
  console.log(`Instances using Notice Board v1.0.0: ${instances.length}`);
  instances.forEach(i => console.log(`- Instance ${i.id} in Experience ${i.experience.name}`));
}

main().finally(() => prisma.$disconnect());
