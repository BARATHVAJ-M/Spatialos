export abstract class IPlacesRepository {
  abstract findAll(organizationId: string): Promise<any[]>;
  abstract findById(organizationId: string, id: string): Promise<any | null>;
  abstract create(data: { organizationId: string; name: string; parentId?: string; qrTargetId: string }): Promise<any>;
  abstract update(id: string, data: { name?: string }): Promise<any>;
  abstract delete(id: string): Promise<void>;
}
