export abstract class IExperiencesRepository {
  abstract findAll(organizationId: string): Promise<any[]>;
  abstract findById(organizationId: string, id: string): Promise<any | null>;
  abstract findByIdBasic(organizationId: string, id: string): Promise<any | null>;
  abstract create(data: { organizationId: string; placeId: string; name: string }): Promise<any>;
  abstract update(id: string, data: { name?: string; description?: string }): Promise<any>;
  abstract publish(organizationId: string, id: string, placeId: string, newVersion: number): Promise<any>;
  abstract rollback(organizationId: string, placeId: string, targetVersion: number): Promise<any>;
  abstract replaceSpatialNodes(experienceId: string, nodes: any[]): Promise<void>;
  abstract replaceServiceInstances(experienceId: string, instances: any[]): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
