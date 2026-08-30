import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.contentAsset.findMany({
      where: { organizationId },
      orderBy: { id: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.contentAsset.findUnique({
      where: { id }
    });
  }

  async findByUrl(url: string) {
    return this.prisma.contentAsset.findFirst({
      where: { url }
    });
  }

  async uploadFile(organizationId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const isVideo = file.mimetype.startsWith('video/');
    const isImage = file.mimetype.startsWith('image/');
    
    // File size limits: 10MB Photo, 50MB Video
    const maxPhotoSize = 10 * 1024 * 1024;
    const maxVideoSize = 50 * 1024 * 1024;

    if (isImage && file.size > maxPhotoSize) {
      this.deleteFileSafely(file.path);
      throw new BadRequestException('Image exceeds 10MB limit');
    }

    if (isVideo && file.size > maxVideoSize) {
      this.deleteFileSafely(file.path);
      throw new BadRequestException('Video exceeds 50MB limit');
    }

    if (!isImage && !isVideo) {
      this.deleteFileSafely(file.path);
      throw new BadRequestException('Only images and videos are allowed');
    }

    // Save to ContentAsset DB
    const id = require('crypto').randomUUID();
    // Generate a secure cryptographic string for the public URL
    const publicHash = require('crypto').randomBytes(32).toString('hex');
    return this.prisma.contentAsset.create({
      data: {
        id,
        organizationId,
        assetType: isImage ? 'Image' : 'Video',
        url: `/media/${publicHash}`, // Cryptographic proxy URL
        metadata: {
          filename: file.filename, // True physical filename hidden in metadata
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        },
      },
    });
  }

  async remove(organizationId: string, id: string) {
    const asset = await this.prisma.contentAsset.findFirst({
      where: { id, organizationId },
    });

    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    // Delete from disk
    const meta = asset.metadata as any;
    const filename = (meta && meta.filename) ? meta.filename : asset.url.replace('/storage/', '').replace('/media/', '');
    const filepath = join(process.cwd(), 'storage', filename);
    this.deleteFileSafely(filepath);

    // Delete from DB
    return this.prisma.contentAsset.delete({
      where: { id },
    });
  }

  private deleteFileSafely(filePath: string) {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Failed to delete file: ${filePath}`, err);
      }
    }
  }
}
