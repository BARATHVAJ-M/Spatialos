import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as fs from 'fs';
import { STORAGE_ADAPTER, IStorageAdapter } from './storage/storage.interface';
const FileType = require('file-type');

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(STORAGE_ADAPTER) private readonly storageAdapter: IStorageAdapter
  ) {}

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
      await this.deleteTempFileSafely(file.path);
      throw new BadRequestException('Image exceeds 10MB limit');
    }

    if (isVideo && file.size > maxVideoSize) {
      await this.deleteTempFileSafely(file.path);
      throw new BadRequestException('Video exceeds 50MB limit');
    }

    if (!isImage && !isVideo) {
      await this.deleteTempFileSafely(file.path);
      throw new BadRequestException('Only images and videos are allowed');
    }

    // Deep MIME-type verification (prevent spoofing)
    const chunk = await this.readFirstChunk(file.path);
    const type = await FileType.fromBuffer(chunk);
    
    if (!type || (!type.mime.startsWith('image/') && !type.mime.startsWith('video/'))) {
      this.logger.warn(`Spoofed file detected and rejected. Original name: ${file.originalname}, Real mime: ${type?.mime}`);
      await this.deleteTempFileSafely(file.path);
      throw new BadRequestException('Invalid file signature. File may be spoofed or corrupted.');
    }

    // Save file via Storage Adapter
    const savedUrl = await this.storageAdapter.saveFile(file, file.filename);

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

    // Delete from storage
    const meta = asset.metadata as any;
    const filename = (meta && meta.filename) ? meta.filename : asset.url.replace('/storage/', '').replace('/media/', '');
    await this.deleteFileSafely(filename);

    // Delete from DB
    return this.prisma.contentAsset.delete({
      where: { id },
    });
  }

  async deleteByUrl(url: string) {
    const asset = await this.prisma.contentAsset.findFirst({
      where: { url },
    });

    if (!asset) {
      return null;
    }

    // Delete from storage
    const meta = asset.metadata as any;
    const filename = (meta && meta.filename) ? meta.filename : asset.url.replace('/storage/', '').replace('/media/', '');
    await this.deleteFileSafely(filename);

    // Delete from DB
    return this.prisma.contentAsset.delete({
      where: { id: asset.id },
    });
  }

  private async deleteFileSafely(filename: string) {
    try {
      await this.storageAdapter.deleteFile(filename);
    } catch (err: any) {
      this.logger.error(`Failed to delete file: ${filename}`, err.stack);
    }
  }

  private async deleteTempFileSafely(filePath: string) {
    if (filePath && fs.existsSync(filePath)) {
      try {
        await fs.promises.unlink(filePath);
      } catch (err: any) {
        this.logger.error(`Failed to delete temp file: ${filePath}`, err.stack);
      }
    }
  }

  private async readFirstChunk(filePath: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      // For temp files handled by multer
      if (fs.existsSync(filePath)) {
        const stream = fs.createReadStream(filePath, { start: 0, end: 4100 });
        let buffer = Buffer.alloc(0);
        
        stream.on('data', (chunk) => {
          buffer = Buffer.concat([buffer, chunk as Buffer]);
        });
        
        stream.on('end', () => resolve(buffer));
        stream.on('error', (err) => reject(err));
      } else {
        // Fallback if file was deleted early
        resolve(Buffer.alloc(0));
      }
    });
  }
}
