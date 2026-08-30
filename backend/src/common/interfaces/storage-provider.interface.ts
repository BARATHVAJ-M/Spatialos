export const I_STORAGE_PROVIDER = 'I_STORAGE_PROVIDER';

export interface StorageMetadata {
  size: number;
  mimeType?: string;
  created?: Date;
}

export interface IStorageProvider {
  save(fileName: string, data: Buffer | string, subFolder?: string): Promise<string>;
  delete(filePathOrUrl: string): Promise<boolean>;
  exists(filePathOrUrl: string): Promise<boolean>;
  get(filePathOrUrl: string): Promise<Buffer>;
  getUrl(fileName: string, hostUrl?: string): string;
  getMetadata(filePathOrUrl: string): Promise<StorageMetadata | null>;
  sweepOrphanedFiles?(activePaths: string[]): Promise<number>;
}
