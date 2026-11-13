import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
import { IContentService } from '../core/contracts/content-service.contract';
import { IContentRepository } from '../core/contracts/content-repository.contract';
import * as fs from 'fs';
import { STORAGE_ADAPTER, IStorageAdapter } from './storage/storage.interface';
import { AppError } from '../core/errors/app-error';
const FileType = require('file-type');

@Injectable()
export class ContentService implements IContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private readonly repo: IContentRepository,
    @Inject(STORAGE_ADAPTER) private readonly storageAdapter: IStorageAdapter,
  ) {}

  async findAll(organizationId: string) {
    return this.repo.findAll(organizationId);
  }

  async findById(id: string) {
    return this.repo.findById(id);
  }

  async findByUrl(url: string) {
    return this.repo.findByUrl(url);
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

    // Verify magic bytes
    let type;
    try {
      type = await FileType.fromFile(file.path);
    } catch (err) {
      this.logger.error(`Failed to inspect file magic bytes: ${file.path}`, err);
    }
    
    if (!type || (!type.mime.startsWith('image/') && !type.mime.startsWith('video/'))) {
      this.logger.warn(`Spoofed file detected and rejected. Original name: ${file.originalname}, Real mime: ${type?.mime}`);
      await this.deleteTempFileSafely(file.path);
      throw new BadRequestException('Invalid file signature. File may be spoofed or corrupted.');
    }

    // Save file via Storage Adapter
    await this.storageAdapter.saveFile(file, file.filename);

    // Save to ContentAsset DB
    const id = require('crypto').randomUUID();
    const publicHash = require('crypto').randomBytes(32).toString('hex');
    return this.repo.create({
      id,
      organizationId,
      assetType: isImage ? 'Image' : 'Video',
      url: `/media/${publicHash}`,
      metadata: {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      },
    });
  }

  async remove(organizationId: string, id: string) {
    const asset = await this.repo.findById(id, organizationId);

    if (!asset) {
      throw AppError.domain('ASSET_NOT_FOUND', 'Asset not found', 'content.service.ts');
    }

    // Delete from storage
    const meta = asset.metadata as any;
    const filename = (meta && meta.filename) ? meta.filename : asset.url.replace('/storage/', '').replace('/media/', '');
    await this.deleteFileSafely(filename);

    // Delete from DB
    return this.repo.delete(id);
  }

  async deleteByUrl(url: string) {
    const asset = await this.repo.findByUrl(url);

    if (!asset) {
      return null;
    }

    // Delete from storage
    const meta = asset.metadata as any;
    const filename = (meta && meta.filename) ? meta.filename : asset.url.replace('/storage/', '').replace('/media/', '');
    await this.deleteFileSafely(filename);

    // Delete from DB
    return this.repo.delete(asset.id);
  }

  private async deleteFileSafely(filename: string) {
    try {
      await this.storageAdapter.deleteFile(filename);
    } catch (err: any) {
      this.logger.error(`Failed to delete file: ${filename}`, err.stack);
    }
  }

  private async deleteTempFileSafely(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (err: any) {
      this.logger.error(`Failed to cleanup temp file: ${filePath}`, err.stack);
    }
  }
}
