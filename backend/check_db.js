const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const locations = await prisma.qrLocation.findMany({
      include: {
        arContents: {
          include: {
            transform: true
          }
        }
      }
    });

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    });

    const media = await prisma.mediaFile.findMany();
    const texts = await prisma.textContent.findMany();

    // Map media and text to AR contents manually
    const enrichedLocations = locations.map(loc => {
      return {
        ...loc,
        arContents: loc.arContents.map(content => {
          let attachedData = null;
          if (content.contentType === 'IMAGE' || content.contentType === 'VIDEO') {
             attachedData = media.find(m => m.id === content.contentReferenceId) || { error: 'Media missing!' };
          } else if (content.contentType === 'TEXT') {
             attachedData = texts.find(t => t.id === content.contentReferenceId) || { error: 'Text missing!' };
          }
          return {
            ...content,
            attachedData
          };
        })
      };
    });

    console.log('\n=== USERS ===');
    console.log(JSON.stringify(users, null, 2));

    console.log('\n=== QR LOCATIONS & AR CONTENTS ===');
    console.log(JSON.stringify(enrichedLocations, null, 2));

    console.log(`\nTotal Users: ${users.length}`);
    console.log(`Total QR Locations: ${locations.length}`);
    console.log(`Total Media Files (DB): ${media.length}`);
    console.log(`Total Text Contents (DB): ${texts.length}`);
    
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
