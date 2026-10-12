import { Controller, Get, Post, Delete, Param, UseInterceptors, UploadedFile, Req, UseGuards, StreamableFile, Response, NotFoundException, ParseFilePipeBuilder, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContentService } from '../logic/content.service';
import { Express, Response as ExpressResponse } from 'express';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { basename } from 'path';
import { Inject } from '@nestjs/common';
import { STORAGE_ADAPTER, IStorageAdapter } from '../logic/storage/storage.interface';

@Public()
@Controller('media')
export class MediaController {
  constructor(
    private readonly contentService: ContentService,
    @Inject(STORAGE_ADAPTER) private readonly storageAdapter: IStorageAdapter
  ) {}

  @Get(':hash')
  async streamMedia(@Param('hash') hash: string, @Response({ passthrough: true }) res: ExpressResponse): Promise<StreamableFile> {
    const asset = await this.contentService.findByUrl(`/media/${hash}`);
    if (!asset) {
      throw new NotFoundException('Media not found');
    }
    
    // Read the true filename securely from metadata, or fallback to parsing the old url format
    let filename = '';
    const meta = asset.metadata as any;
    if (meta && meta.filename) {
      filename = meta.filename;
    } else {
      filename = asset.url.replace('/storage/', '');
      filename = filename.replace('/media/', '');
    }

    // SECURITY: Sanitize filename to prevent Path Traversal (LFI)
    filename = basename(filename);

    const streamOrFile = await this.storageAdapter.getFileStream(filename);
    
    res.set({
      'Content-Type': meta?.mimetype || (asset.assetType === 'Image' ? 'image/jpeg' : 'video/mp4'),
      'Cache-Control': 'public, max-age=2592000, immutable',
    });
    
    if (streamOrFile instanceof StreamableFile) {
      return streamOrFile;
    }
    return new StreamableFile(streamOrFile);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('v1/admin/content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  findAll(@Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.contentService.findAll(orgId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /^(image\/(jpeg|jpg|png|gif)|video\/(mp4|webm|quicktime|x-m4v))$/i,
          skipMagicNumbersValidation: true,
        })
        .addMaxSizeValidator({
          maxSize: 50 * 1024 * 1024, // 50MB absolute max
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
    @Req() req,
  ) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.contentService.uploadFile(orgId, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.contentService.remove(orgId, id);
  }
}
