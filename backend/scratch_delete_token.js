const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tokenDefId = 'f438daa1-2839-4a93-9e1f-ce88d111d96c';

  await prisma.serviceDefinition.delete({
    where: { id: tokenDefId }
  });

  console.log('Successfully deleted Token System permanently.');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
