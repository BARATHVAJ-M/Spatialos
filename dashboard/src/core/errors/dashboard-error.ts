export type DashboardLayerOrigin = 
  | 'UI'
  | 'HOOK_STATE'
  | 'SERVICE_CLIENT'
  | 'HTTP_TRANSPORT';

export class DashboardError extends Error {
  constructor(
    public readonly layer: DashboardLayerOrigin,
    public readonly code: string,
    public readonly message: string,
    public readonly status?: number,
    public readonly details?: Record<string, unknown>,
    public readonly sourceFile?: string,
  ) {
    super(`[${layer}:${code}] ${message}${sourceFile ? ` (at ${sourceFile})` : ''}`);
    this.name = 'DashboardError';
    Object.setPrototypeOf(this, DashboardError.prototype);
  }

  static http(code: string, message: string, status?: number, details?: Record<string, unknown>): DashboardError {
    return new DashboardError('HTTP_TRANSPORT', code, message, status, details, 'http-client.ts');
  }

  static service(code: string, message: string, sourceFile: string, details?: Record<string, unknown>): DashboardError {
    return new DashboardError('SERVICE_CLIENT', code, message, undefined, details, sourceFile);
  }

  static hook(code: string, message: string, sourceFile: string, details?: Record<string, unknown>): DashboardError {
    return new DashboardError('HOOK_STATE', code, message, undefined, details, sourceFile);
  }

  static ui(code: string, message: string, sourceFile: string, details?: Record<string, unknown>): DashboardError {
    return new DashboardError('UI', code, message, undefined, details, sourceFile);
  }
}
