const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const instances = await prisma.serviceInstance.findMany({
    where: { serviceDefinitionId: 'e3bac235-08b0-40ff-a5e3-21921cb5a2da' }
  });

  for (const inst of instances) {
    let content = inst.content || {};
    
    // Check if it's malformed (pages array contains items without mediaItems)
    if (content.pages && Array.isArray(content.pages)) {
      const isMalformed = content.pages.some(p => p.type && !p.mediaItems);
      if (isMalformed) {
        // Wrap it in a proper page object
        const fixedPages = [
          {
            id: 'page_migrated',
            mediaItems: content.pages.map(p => {
              // p is actually a MediaItem from my botched migration
              return {
                id: `media_${Date.now()}_${Math.random()}`,
                type: p.type || 'image',
                url: p.url || '',
                x: 0.1, y: 0.1, width: 0.8, height: 0.6, rotation: 0
              };
            })
          }
        ];
        content.pages = fixedPages;
        
        await prisma.serviceInstance.update({
          where: { id: inst.id },
          data: { content: content }
        });
        console.log(`Fixed malformed JSON in Instance ${inst.id}`);
      }
    }
  }
}

main().finally(() => prisma.$disconnect());
