const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const experiences = await prisma.experience.findMany({
    include: {
      serviceInstances: true
    }
  });
  
  console.log("Experiences and their Services:");
  experiences.forEach(exp => {
    console.log(`\nExperience: ${exp.name} (ID: ${exp.id})`);
    console.log(`Services Count: ${exp.serviceInstances.length}`);
    exp.serviceInstances.forEach(inst => {
      console.log(`  - Service: ${inst.name} (ID: ${inst.id})`);
    });
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
