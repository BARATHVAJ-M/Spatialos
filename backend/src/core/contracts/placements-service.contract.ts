export abstract class IPlacementsService {
  abstract preview(qrCode: string): Promise<any>;
  abstract getStaffProfile(staffId: string): Promise<any>;
}
