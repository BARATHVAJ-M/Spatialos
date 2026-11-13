export abstract class IContentRepository {
  abstract findAll(organizationId: string): Promise<any[]>;
  abstract findById(id: string, organizationId?: string): Promise<any | null>;
  abstract findByUrl(url: string): Promise<any | null>;
  abstract create(data: { id?: string; organizationId: string; assetType: string; url: string; metadata?: any }): Promise<any>;
  abstract delete(id: string): Promise<any>;
}
