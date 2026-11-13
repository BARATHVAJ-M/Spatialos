export abstract class IPlacementsRepository {
  abstract findExperienceById(targetId: string): Promise<any | null>;
  abstract findPublishedExperienceByQrCode(qrCode: string): Promise<any | null>;
  abstract getMiniAppData(serviceType: string, organizationId: string): Promise<any>;
}
