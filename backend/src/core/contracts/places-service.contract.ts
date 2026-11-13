export abstract class IPlacesService {
  abstract findAll(organizationId: string): Promise<any>;
  abstract findOne(organizationId: string, id: string): Promise<any>;
  abstract create(organizationId: string, name: string, parentId?: string): Promise<any>;
  abstract update(organizationId: string, id: string, name: string): Promise<any>;
  abstract remove(organizationId: string, id: string): Promise<any>;
}
