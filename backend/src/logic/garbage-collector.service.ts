import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ContentService } from './content.service';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class GarbageCollectorService {
  private readonly logger = new Logger(GarbageCollectorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly contentService: ContentService
  ) {}

  async runGarbageCollection(organizationId: string) {
    this.logger.log(`Starting Garbage Collection for org: ${organizationId}`);
    
    // 1. We will scan active URLs first
    const activeUrls = new Set<string>();

    // 2. Scan all active links using global regex to find embedded media
    
    // Regex matches /media/ followed by exactly 64 hex characters (the hash)
    const mediaRegex = /\/media\/[a-f0-9]{64}/gi;

    const extractMediaUrls = (obj: any) => {
      if (!obj) return;
      if (typeof obj === 'string') {
        const matches = obj.match(mediaRegex);
        if (matches) {
          matches.forEach(match => activeUrls.add(match));
        }
      } else if (typeof obj === 'object') {
        Object.values(obj).forEach(extractMediaUrls);
      }
    };

    // Helper for batched processing
    const batchSize = 100;
    const processInBatches = async (modelDelegate: any, whereClause: any, processor: (batch: any[]) => void) => {
      let skip = 0;
      let hasMore = true;
      while (hasMore) {
        const batch = await modelDelegate.findMany({ where: whereClause, take: batchSize, skip });
        if (batch.length === 0) {
          hasMore = false;
        } else {
          processor(batch);
          skip += batchSize;
        }
      }
    };

    // A. Service Instances (content & configuration)
    await processInBatches(this.prisma.serviceInstance, { organizationId }, (instances) => {
      for (const instance of instances) {
        extractMediaUrls(instance.content);
        extractMediaUrls(instance.configuration);
      }
    });
    
    // B. Spatial Nodes (referenceId)
    await processInBatches(this.prisma.spatialNode, { experience: { organizationId } }, (nodes) => {
      for (const node of nodes) {
        extractMediaUrls(node.referenceId);
      }
    });

    // C. Staff Directory (photoUrl, subjects, timetable etc.)
    await processInBatches(this.prisma.staffDirectory, { organizationId }, (staff) => {
      for (const member of staff) {
        extractMediaUrls(member.photoUrl);
        extractMediaUrls(member.subjects);
        extractMediaUrls(member.timetable);
      }
    });

    // D. Organization settings
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId }
    });
    if (org) {
      extractMediaUrls(org.settings);
    }

    // E. Notifications (message field might contain rich text)
    await processInBatches(this.prisma.notification, { organizationId }, (notifications) => {
      for (const notif of notifications) {
        extractMediaUrls(notif.message);
      }
    });

    // 3. Delete orphans with a 1-hour physical time buffer
    let deletedCount = 0;
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    await processInBatches(this.prisma.contentAsset, { organizationId }, async (assets) => {
      for (const asset of assets) {
        if (!activeUrls.has(asset.url)) {
          // Find the physical file to check its creation time
          const meta = asset.metadata as any;
          const filename = (meta && meta.filename) ? meta.filename : asset.url.replace('/storage/', '').replace('/media/', '');
          const filepath = join(process.cwd(), 'storage', filename);
          
          let isSafeToDelete = false;
          
          if (fs.existsSync(filepath)) {
            try {
              const stats = fs.statSync(filepath);
              if (stats.mtime < oneHourAgo) {
                // Do the actual delete
                try {
                  fs.unlinkSync(filepath);
                  this.logger.log(`Deleted orphaned physical file: ${filepath}`);
                } catch (err: any) {
                  this.logger.error(`Failed to delete physical file: ${filepath}`, err.stack);
                }
                isSafeToDelete = true;
              } else {
                this.logger.debug(`Asset ${asset.url} is an orphan but protected by 1-hour time buffer. Skipping.`);
              }
            } catch (e) {
              this.logger.error(`Error reading stats for file ${filepath}`, e);
            }
          } else {
            // If the physical file doesn't even exist, it's safe to delete the DB ghost record
            isSafeToDelete = true;
          }

          if (isSafeToDelete) {
            try {
              await this.prisma.contentAsset.delete({ where: { id: asset.id } });
              this.logger.log(`Deleted DB record for orphaned asset: ${asset.url}`);
              deletedCount++;
            } catch (error: any) {
              this.logger.error(`Failed to GC asset ${asset.url}`, error.stack);
            }
          }
        }
      }
    });

    this.logger.log(`Garbage Collection finished. Deleted ${deletedCount} assets.`);
    return { success: true, deletedCount, message: `Deleted ${deletedCount} unused assets.` };
  }
}
