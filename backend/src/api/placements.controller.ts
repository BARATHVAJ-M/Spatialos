import { Controller, Get, Query, Param } from '@nestjs/common';
// Caching removed for admin routes
import { PrismaService } from '../database/prisma.service';
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

    let experience = null;
    try {
      experience = await this.prisma.experience.findFirst({
        where: { id: targetId },
        include: { 
          spatialNodes: true, 
          serviceInstances: { include: { serviceDefinition: true } } 
        }
      });
    } catch (e) {
      // Ignore invalid UUID error, proceed to place lookup
    }

    if (!experience) {
      const place = await this.prisma.place.findFirst({
        where: { qrTargetId: qrCode },
        include: {
          experiences: {
            where: { status: 'PUBLISHED' },
            include: { 
              spatialNodes: true, 
              serviceInstances: { include: { serviceDefinition: true } } 
            },
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

    // Helper to build contentData for any of the 4 services
    const buildServiceContentData = async (service: any) => {
      let contentType = 'MINIAPP';
      let contentData: any = null;

      const defName = (service?.serviceDefinition?.name || service?.name || '').toLowerCase();
      const config = (service?.configuration as any) || {};
      const content = (service?.content as any) || {};

      if (defName.includes('classroom')) {
        const appId = 'CLASSROOM';
        const appState = {
          className: config.className || 'Classroom',
          currentClass: config.currentClass || null,
          nextClass: config.nextClass || null,
          reminders: config.reminders || content.reminders || [],
          displayOptions: config.displayOptions || { showNextClass: true, showReminders: true },
        };
        contentData = { id: service?.id || 'classroom-default', appId, state: appState };
      } else if (defName.includes('complaint')) {
        const appId = 'COMPLAINT_BOX';
        const appState = {
          title: config.title || 'Complaint Box',
          description: config.description || 'Submit your grievances securely.',
          privacyMessage: config.privacyMessage || 'SpatialOS does not track or store your details.',
          googleFormUrl: config.googleFormUrl || '',
        };
        contentData = { id: service?.id || 'complaint-default', appId, state: appState };
      } else if (defName.includes('staff')) {
        const appId = 'STAFF_DETAILS';
        let profile = null;
        if (config.staffId) {
          profile = await this.prisma.staffDirectory.findFirst({
            where: { staffId: config.staffId }
          });
        }
        const appState = {
          staffId: config.staffId || '',
          displayTimetable: config.displayTimetable ?? true,
          displayContact: config.displayContact ?? true,
          profile: profile,
        };
        contentData = { id: service?.id || 'staff-default', appId, state: appState };
      } else {
        // Notice Board
        const appId = 'NOTICE_BOARD';
        let title = 'Notice Board';
        let description = '';
        let bgColor = '#4f46e5';

        if (config.title) title = config.title;
        if (config.borderColor) bgColor = config.borderColor;
        if (config.description) description = config.description;

        let pages: any[] = [];
        if (content.mediaItems && content.mediaItems.length > 0 && !content.pages) {
          pages = [{
            id: 'legacy_page_1',
            mediaItems: content.mediaItems.map((m: any) => ({
              id: m.id, type: m.type, url: (() => { try { return new URL(m.url).pathname; } catch(e) { return m.url; } })(),
              x: m.x, y: m.y, width: m.width, height: m.height, rotation: m.rotation,
              title: m.title, description: m.description, color: m.color, bgColor: m.bgColor, fontSize: m.fontSize
            }))
          }];
        } else if (content.pages && content.pages.length > 0) {
          pages = content.pages.map((p: any) => ({
            id: p.id || 'page_' + Math.random(),
            mediaItems: (p.mediaItems || []).map((m: any) => ({
              id: m.id, type: m.type, url: m.url ? (() => { try { return new URL(m.url).pathname; } catch(e) { return m.url; } })() : null,
              x: m.x, y: m.y, width: m.width, height: m.height, rotation: m.rotation,
              title: m.title, description: m.description, color: m.color, bgColor: m.bgColor, fontSize: m.fontSize
            }))
          }));
        }

        const appState = {
          title,
          description,
          borderColor: bgColor,
          pages: pages
        };
        contentData = { id: service?.id || 'notice-default', appId, state: appState };
      }

      return { contentType, contentData };
    };

    const isServiceActive = (service: any) => {
      if (!service?.configuration) return true;
      const conf = service.configuration as any;
      const now = new Date();
      if (conf.publishAt && new Date(conf.publishAt) > now) return false;
      if (conf.expiresAt && new Date(conf.expiresAt) < now) return false;
      return true;
    };

    const mappedObjects: any[] = [];
    const placedServiceIds = new Set<string>();

    // 1. Map explicit spatialNodes from the database
    for (const node of experience.spatialNodes) {
      const service = experience.serviceInstances.find(si => si.spatialNodeId === node.id || si.id === node.referenceId);

      if (service) {
        if (!isServiceActive(service)) continue;
        placedServiceIds.add(service.id);
      }

      let contentType = 'IMAGE';
      let contentData: any = null;

      if (node.nodeType === 'UI_PANEL' || service) {
        const built = await buildServiceContentData(service);
        contentType = built.contentType;
        contentData = built.contentData;
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

      mappedObjects.push({
        id: node.id,
        serviceId: service?.id,
        qrLocationId: qrCode,
        contentType: contentType,
        contentReferenceId: node.referenceId || service?.id,
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
      });
    }

    // 2. Include any attached ServiceInstances that were NOT bound to a spatialNode
    const unplacedServices = experience.serviceInstances.filter(si => !placedServiceIds.has(si.id) && isServiceActive(si));
    for (let i = 0; i < unplacedServices.length; i++) {
      const service = unplacedServices[i];
      const built = await buildServiceContentData(service);
      const totalUnplaced = unplacedServices.length;
      // Stagger along X axis so they don't collide
      const posX = totalUnplaced > 1 ? (i - (totalUnplaced - 1) / 2) * 1.5 : 0;

      mappedObjects.push({
        id: service.id,
        serviceId: service.id,
        qrLocationId: qrCode,
        contentType: built.contentType,
        contentReferenceId: service.id,
        contentData: built.contentData,
        displayOrder: i + 1,
        status: 'ACTIVE',
        createdBy: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        transform: {
          id: `trans-${service.id}`,
          positionX: posX,
          positionY: 0,
          positionZ: 0,
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
          scaleX: 1,
          scaleY: 1,
          scaleZ: 1,
          anchorType: 'PLANE_WALL'
        }
      });
    }

    // 3. Stagger collision check: If multiple items all share exact [0, 0] coordinates, auto-offset them
    const atOrigin = mappedObjects.filter(o => (o.transform.positionX ?? 0) === 0 && (o.transform.positionY ?? 0) === 0);
    if (atOrigin.length > 1) {
      atOrigin.forEach((item, idx) => {
        item.transform.positionX = (idx - (atOrigin.length - 1) / 2) * 1.5;
      });
    }

    return {
      success: true,
      data: {
        objects: mappedObjects
      }
    };
  }

  @Get('staff-profile')
  async getStaffProfile(@Query('staffId') staffId: string) {
    if (!staffId) {
      return { success: false, data: null, error: 'staffId is required' };
    }
    const staff = await this.prisma.staffDirectory.findFirst({
      where: { staffId: staffId, status: 'ACTIVE' },
    });
    if (!staff) {
      return { success: false, data: null, error: 'Staff not found' };
    }
    return { success: true, data: staff };
  }
}
