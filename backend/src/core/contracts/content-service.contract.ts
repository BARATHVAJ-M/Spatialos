import { Express } from 'express';

export abstract class IContentService {
  abstract findAll(organizationId: string): Promise<any>;
  abstract findById(id: string): Promise<any>;
  abstract findByUrl(url: string): Promise<any>;
  abstract uploadFile(organizationId: string, file: Express.Multer.File): Promise<any>;
  abstract remove(organizationId: string, id: string): Promise<any>;
  abstract deleteByUrl(url: string): Promise<any>;
}
