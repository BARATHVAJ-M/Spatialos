const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const expId = 'b9fd4eb6-01cf-47b8-b051-05c070238117'; // eee notice board
  
  const nodes = await prisma.spatialNode.findMany({
    where: { experienceId: expId }
  });
  
  console.log(`Spatial Nodes for eee notice board: ${nodes.length}`);
  
  const assets = await prisma.contentAsset.findMany();
  console.log(`Global Content Assets (Images/Videos) remaining: ${assets.length}`);
}

main().finally(() => prisma.$disconnect());
