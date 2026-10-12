import { Module } from '@nestjs/common';
import { ContentController, MediaController } from '../api/content.controller';
import { ContentService } from '../logic/content.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';
import { STORAGE_ADAPTER } from '../logic/storage/storage.interface';
import { LocalDiskStorageAdapter } from '../logic/storage/local-disk.adapter';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: os.tmpdir(),
        filename: (req, file, cb) => {
          const uniqueSuffix = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueSuffix);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'model/gltf-binary',
          'model/gltf+json'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only images, videos, and 3D models are allowed.'), false);
        }
      },
    }),
  ],
  controllers: [ContentController, MediaController],
  providers: [
    ContentService,
    {
      provide: STORAGE_ADAPTER,
      useFactory: () => {
        // In the future, you can check process.env.STORAGE_PROVIDER here
        // e.g. return process.env.STORAGE_PROVIDER === 's3' ? new S3StorageAdapter() : new LocalDiskStorageAdapter();
        return new LocalDiskStorageAdapter();
      },
    }
  ],
  exports: [ContentService, STORAGE_ADAPTER],
})
export class ContentModule {}
