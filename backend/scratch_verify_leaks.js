const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const expId = 'b9fd4eb6-01cf-47b8-b051-05c070238117';
  
  console.log(`Starting deep leak scan for Experience ID: ${expId}...\n`);

  // 1. Check Experience Table
  const exp = await prisma.experience.findUnique({ where: { id: expId } });
  console.log(`[Experience Table]: ${exp ? 'LEAK DETECTED (Still exists)' : 'Clean'}`);

  // 2. Check Service Instances
  const services = await prisma.serviceInstance.findMany({ where: { experienceId: expId } });
  console.log(`[ServiceInstances Table]: ${services.length > 0 ? `LEAK DETECTED (${services.length} rows)` : 'Clean'}`);

  // 3. Check Spatial Nodes
  const nodes = await prisma.spatialNode.findMany({ where: { experienceId: expId } });
  console.log(`[SpatialNodes Table]: ${nodes.length > 0 ? `LEAK DETECTED (${nodes.length} rows)` : 'Clean'}`);

  console.log('\nScan complete.');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
