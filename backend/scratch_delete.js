const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const expId = 'b9fd4eb6-01cf-47b8-b051-05c070238117'; // eee notice board

  try {
    const res = await prisma.serviceInstance.deleteMany({
      where: {
        experienceId: expId,
        id: { notIn: ['none'] }
      }
    });
    console.log("Delete result:", res);
  } catch (e) {
    console.error("Error deleting:", e);
  }
}

main().finally(() => prisma.$disconnect());
