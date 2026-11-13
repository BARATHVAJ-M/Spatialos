import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IContentRepository } from '../../core/contracts/content-repository.contract';
import { AppError } from '../../core/errors/app-error';

@Injectable()
export class ContentPrismaRepository implements IContentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string): Promise<any[]> {
    try {
      return await this.prisma.contentAsset.findMany({
        where: { organizationId },
        orderBy: { id: 'desc' },
      });
    } catch (e: any) {
      throw AppError.dataAccess('DB_CONTENT_FIND_ALL_FAILED', e.message, 'content.prisma.repository.ts');
    }
  }

  async findById(id: string, organizationId?: string): Promise<any | null> {
    try {
      return await this.prisma.contentAsset.findFirst({
        where: { id, ...(organizationId ? { organizationId } : {}) },
      });
    } catch (e: any) {
      throw AppError.dataAccess('DB_CONTENT_FIND_BY_ID_FAILED', e.message, 'content.prisma.repository.ts');
    }
  }

  async findByUrl(url: string): Promise<any | null> {
    try {
      return await this.prisma.contentAsset.findFirst({
        where: { url },
      });
    } catch (e: any) {
      throw AppError.dataAccess('DB_CONTENT_FIND_BY_URL_FAILED', e.message, 'content.prisma.repository.ts');
    }
  }

  async create(data: { id?: string; organizationId: string; assetType: string; url: string; metadata?: any }): Promise<any> {
    try {
      return await this.prisma.contentAsset.create({
        data,
      });
    } catch (e: any) {
      throw AppError.dataAccess('DB_CONTENT_CREATE_FAILED', e.message, 'content.prisma.repository.ts');
    }
  }

  async delete(id: string): Promise<any> {
    try {
      return await this.prisma.contentAsset.delete({
        where: { id },
      });
    } catch (e: any) {
      throw AppError.dataAccess('DB_CONTENT_DELETE_FAILED', e.message, 'content.prisma.repository.ts');
    }
  }
}
