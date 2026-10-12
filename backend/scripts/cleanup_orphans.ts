import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('--- Starting Orphan Cleanup ---');

  // 1. Fetch all assets
  const allAssets = await prisma.contentAsset.findMany();
  console.log(`Total ContentAssets in DB: ${allAssets.length}`);

  if (allAssets.length === 0) {
    console.log('No assets found. Exiting.');
    return;
  }

  // 2. Scan all active service instances for media URLs
  const activeUrls = new Set<string>();
  const instances = await prisma.serviceInstance.findMany();
  
  const extractMediaUrls = (obj: any) => {
    if (!obj) return;
    if (typeof obj === 'string') {
      if (obj.startsWith('/media/')) activeUrls.add(obj);
    } else if (typeof obj === 'object') {
      Object.values(obj).forEach(extractMediaUrls);
    }
  };

  for (const instance of instances) {
    extractMediaUrls(instance.content);
    extractMediaUrls(instance.configuration);
  }

  // 3. Scan all active SpatialNodes (just in case they store /media/ directly)
  const nodes = await prisma.spatialNode.findMany();
  for (const node of nodes) {
    if (node.referenceId && node.referenceId.startsWith('/media/')) {
      activeUrls.add(node.referenceId);
    }
  }

  console.log(`Active Media URLs in use: ${activeUrls.size}`);
  const activeUrlArray = Array.from(activeUrls);
  console.log(activeUrlArray);

  // 4. Identify orphans
  let deletedCount = 0;
  for (const asset of allAssets) {
    // If the asset URL is not anywhere in the active URLs, it's an orphan
    if (!activeUrls.has(asset.url)) {
      console.log(`Found Orphan: ${asset.url}`);
      
      // Delete from physical disk
      const meta = asset.metadata as any;
      const filename = (meta && meta.filename) ? meta.filename : asset.url.replace('/storage/', '').replace('/media/', '');
      const filepath = join(process.cwd(), 'storage', filename);
      
      if (fs.existsSync(filepath)) {
        try {
          fs.unlinkSync(filepath);
          console.log(`  - Deleted physical file: ${filepath}`);
        } catch (e) {
          console.error(`  - Failed to delete physical file: ${filepath}`, e);
        }
      } else {
        console.log(`  - File already missing from disk: ${filepath}`);
      }

      // Delete from DB
      await prisma.contentAsset.delete({ where: { id: asset.id } });
      console.log(`  - Deleted DB record for: ${asset.id}`);
      deletedCount++;
    }
  }

  console.log('--- Cleanup Complete ---');
  console.log(`Total Orphans Deleted: ${deletedCount}`);
}

cleanup()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
