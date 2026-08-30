import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompilerService {
  constructor(private prisma: PrismaService) {}

  async compileSceneForClient(qrTargetId: string): Promise<any> {
    const place = await this.prisma.place.findUnique({
      where: { qrTargetId },
      include: {
        experiences: {
          where: { status: 'PUBLISHED' },
          take: 1,
          include: { spatialNodes: true }
        }
      }
    });

    if (!place) throw new NotFoundException('Unrecognized QR Target');
    
    const activeExperience = place.experiences[0];
    if (!activeExperience) throw new NotFoundException('No active spatial experience deployed here.');

    const compiledNodes = await Promise.all(
      activeExperience.spatialNodes.map(node => this.resolveNode(node))
    );

    return {
      version: "1.0.0",
      placeId: place.id,
      experienceName: activeExperience.name,
      theme: "DARK",
      spatialNodes: compiledNodes
    };
  }

  private async resolveNode(dbNode: any): Promise<any> {
    const baseNode: any = {
      nodeId: dbNode.id,
      type: dbNode.nodeType,
      transform: {
        position: { x: dbNode.positionX, y: dbNode.positionY, z: dbNode.positionZ },
        rotation: { x: dbNode.rotationX, y: dbNode.rotationY, z: dbNode.rotationZ },
        scale:    { x: dbNode.scaleX, y: dbNode.scaleY, z: dbNode.scaleZ }
      }
    };

    if (dbNode.nodeType === 'MEDIA') {
      const asset = await this.prisma.contentAsset.findUnique({ where: { id: dbNode.referenceId } });
      if (asset) {
        baseNode.mediaPayload = {
          assetType: asset.assetType,
          url: asset.url,
          loop: (asset.metadata as any)?.loop ?? false,
          autoPlay: (asset.metadata as any)?.autoPlay ?? true
        };
      }
    }

    if (dbNode.nodeType === 'UI_PANEL') {
      const template = await this.prisma.componentTemplate.findUnique({ where: { id: dbNode.referenceId } });
      if (template) {
        baseNode.uiPayload = {
          layout: template.uiLayout
        };
      }
    }

    return baseNode;
  }
}

