export interface ARServiceHandler {
  /**
   * Processes a runtime event triggered by the AR mobile app for this service.
   * 
   * @param payload The event data sent by the AR app.
   * @param instanceData The ServiceInstance data containing configuration and content.
   * @param organizationId The Organization ID, useful for querying organizational data like staff directories.
   */
  processEvent(payload: any, instanceData?: any, organizationId?: string): Promise<any>;

  /**
   * Returns the schema definitions for this service to be used in the Admin Dashboard.
   */
  getSchema?(): { title: string; configurationFields?: any[]; contentSchema?: any };
}
