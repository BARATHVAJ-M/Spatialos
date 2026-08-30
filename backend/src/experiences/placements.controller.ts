import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('placements')
export class PlacementsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('preview')
  async preview(@Query('qrCode') qrCode: string) {
    if (!qrCode) {
      return { success: false, data: { objects: [] } };
    }

    // Try to find the experience. If qrCode is a URL, it's handled by Flutter now (which just sends the ID).
    // If they scan an older LOC- code, we might try to find a Place by qrTargetId, or parse it as an Experience ID.
    let targetId = qrCode;
    if (qrCode.startsWith('LOC-')) {
      const parts = qrCode.split('LOC-');
      if (parts.length > 1 && parts[1].length > 10) { // looks like a UUID
        targetId = parts[1];
      }
    }

    let experience = await this.prisma.experience.findFirst({
      where: { id: targetId },
      include: { spatialNodes: true, serviceInstances: true }
    });

    if (!experience && qrCode.startsWith('LOC-')) {
      const place = await this.prisma.place.findFirst({
        where: { qrTargetId: qrCode },
        include: {
          experiences: {
            where: { status: 'PUBLISHED' },
            include: { spatialNodes: true, serviceInstances: true },
            orderBy: { version: 'desc' },
            take: 1
          }
        }
      });
      if (place && place.experiences.length > 0) {
        experience = place.experiences[0];
      }
    }

    if (!experience) {
      return { success: true, data: { objects: [] } };
    }

    // Map spatialNodes to the old ARContentModel format expected by Flutter
    const objects = experience.spatialNodes.map(node => {
      // Find associated ServiceInstance
      const service = experience.serviceInstances.find(si => si.spatialNodeId === node.id);

      // Check Expiry Logic
      if (service?.configuration) {
        const conf = service.configuration as any;
        const now = new Date();
        if (conf.publishAt && new Date(conf.publishAt) > now) return null; // Not published yet
        if (conf.expiresAt && new Date(conf.expiresAt) < now) return null; // Expired
      }

      let contentType = 'IMAGE';
      let contentData: any = null;

      if (node.nodeType === 'UI_PANEL') {
        contentType = 'MINIAPP';
        let title = 'Notice Board';
        let description = '';
        let bgColor = '#1E293B';

        if (service?.configuration) {
           const conf = service.configuration as any;
           if (conf.title) title = conf.title;
           if (conf.borderColor) bgColor = conf.borderColor;
           if (conf.description) description = conf.description;
        }

        let pages = [];
        if (service?.content) {
           const content = service.content as any;
           // If they have legacy mediaItems, wrap them in a page to be backwards compatible
           if (content.mediaItems && content.mediaItems.length > 0 && !content.pages) {
             pages = [{
               id: 'legacy_page_1',
               mediaItems: content.mediaItems.map((m: any) => ({
                 id: m.id, type: m.type, url: (() => { try { return new URL(m.url).pathname; } catch(e) { return m.url; }})(),
                 x: m.x, y: m.y, width: m.width, height: m.height, rotation: m.rotation,
                 title: m.title, description: m.description, color: m.color, bgColor: m.bgColor
               }))
             }];
           } else if (content.pages && content.pages.length > 0) {
             pages = content.pages.map((p: any) => ({
               id: p.id || 'page_' + Math.random(),
               mediaItems: (p.mediaItems || []).map((m: any) => ({
                 id: m.id, type: m.type, url: m.url ? (() => { try { return new URL(m.url).pathname; } catch(e) { return m.url; }})() : null,
                 x: m.x, y: m.y, width: m.width, height: m.height, rotation: m.rotation,
                 title: m.title, description: m.description, color: m.color, bgColor: m.bgColor
               }))
             }));
           }
        }
        
        contentData = {
          id: service?.id || 'default',
          appId: 'NOTICE_BOARD',
          state: {
            title,
            description,
            borderColor: bgColor,
            pages: pages
          }
        };
      } else if (node.nodeType === 'MEDIA') {
        contentType = 'MEDIA';
        if (service?.content) {
           const content = service.content as any;
           if (content.mediaItems && content.mediaItems.length > 0) {
              let mediaPath = content.mediaItems[0].url;
              try { mediaPath = new URL(mediaPath).pathname; } catch(e) {}
              
              contentData = {
                id: service.id,
                fileName: 'media.png',
                originalName: 'media.png',
                filePath: mediaPath,
                mimeType: 'image/png'
              };
           }
        }
      }

      return {
        id: node.id,
        qrLocationId: qrCode,
        contentType: contentType,
        contentReferenceId: node.referenceId,
        contentData: contentData,
        displayOrder: 0,
        status: 'ACTIVE',
        createdBy: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        transform: {
          id: `trans-${node.id}`,
          positionX: node.positionX,
          positionY: node.positionY,
          positionZ: node.positionZ,
          rotationX: node.rotationX,
          rotationY: node.rotationY,
          rotationZ: node.rotationZ,
          scaleX: node.scaleX,
          scaleY: node.scaleY,
          scaleZ: node.scaleZ,
          anchorType: 'PLANE_WALL'
        }
      };
    }).filter(obj => obj !== null); // Filter out expired/unpublished null nodes

    return {
      success: true,
      data: {
        objects: objects
      }
    };
  }
}
