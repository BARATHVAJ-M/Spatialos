import { Controller, Get, Post, Delete, Param, UseInterceptors, UploadedFile, Req, UseGuards, StreamableFile, Response, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContentService } from './content.service';
import { Express, Response as ExpressResponse } from 'express';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly contentService: ContentService) {}

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

    const filepath = join(process.cwd(), 'storage', filename);
    const file = createReadStream(filepath);
    
    res.set({
      'Content-Type': meta?.mimetype || (asset.assetType === 'Image' ? 'image/jpeg' : 'video/mp4'),
      'Cache-Control': 'public, max-age=2592000, immutable',
    });
    
    return new StreamableFile(file);
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
  uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.contentService.uploadFile(orgId, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    const orgId = req.user?.orgId || '00000000-0000-0000-0000-000000000000';
    return this.contentService.remove(orgId, id);
  }
}
