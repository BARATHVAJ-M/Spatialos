export abstract class IExperiencesService {
  abstract findAll(organizationId: string): Promise<any>;
  abstract findOne(organizationId: string, id: string): Promise<any>;
  abstract create(organizationId: string, placeId: string, name: string): Promise<any>;
  abstract update(organizationId: string, id: string, data: any): Promise<any>;
  abstract publish(organizationId: string, id: string): Promise<any>;
  abstract rollback(organizationId: string, id: string): Promise<any>;
  abstract updateNodes(organizationId: string, id: string, nodes: any[]): Promise<any>;
  abstract updateServiceInstances(organizationId: string, id: string, instances: any[]): Promise<any>;
  abstract remove(organizationId: string, id: string): Promise<any>;
}
