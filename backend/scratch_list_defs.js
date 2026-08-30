const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const defs = await prisma.serviceDefinition.findMany();
  
  console.log("Service Definitions:");
  defs.forEach(d => {
    console.log(`- ${d.name} (v${d.version}) [ID: ${d.id}]`);
  });
}

main().finally(() => prisma.$disconnect());
