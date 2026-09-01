import { Module } from '@nestjs/common';
import { ContentController, MediaController } from '../api/content.controller';
import { ContentService } from '../logic/content.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), 'storage'),
        filename: (req, file, cb) => {
          const uniqueSuffix = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueSuffix);
        },
      }),
    }),
  ],
  controllers: [ContentController, MediaController],
  providers: [ContentService],
})
export class ContentModule {}
