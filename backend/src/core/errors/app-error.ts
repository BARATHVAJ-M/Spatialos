export type LayerOrigin = 'TRANSPORT' | 'DOMAIN' | 'DATA_ACCESS' | 'INFRASTRUCTURE';

export class AppError extends Error {
  constructor(
    public readonly layer: LayerOrigin,
    public readonly code: string,
    public readonly message: string,
    public readonly details?: Record<string, any>,
    public readonly sourceFile?: string,
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static transport(code: string, message: string, sourceFile?: string, details?: Record<string, any>): AppError {
    return new AppError('TRANSPORT', code, message, details, sourceFile);
  }

  static domain(code: string, message: string, sourceFile?: string, details?: Record<string, any>): AppError {
    return new AppError('DOMAIN', code, message, details, sourceFile);
  }

  static dataAccess(code: string, message: string, sourceFile?: string, details?: Record<string, any>): AppError {
    return new AppError('DATA_ACCESS', code, message, details, sourceFile);
  }

  static infrastructure(code: string, message: string, sourceFile?: string, details?: Record<string, any>): AppError {
    return new AppError('INFRASTRUCTURE', code, message, details, sourceFile);
  }
}
