import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ContentService } from './content.service';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import { join } from 'path';
import * as crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

@Injectable()
export class StaffSyncService {
  private readonly logger = new Logger(StaffSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly contentService: ContentService
  ) {}

  private async downloadAndStorePhoto(googleDriveUrl: string | null, organizationId: string): Promise<string | null> {
    if (!googleDriveUrl) return null;
    
    // Extract file ID from standard Google Drive share links
    const match = googleDriveUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (!match || !match[1]) return googleDriveUrl; // return as-is if not a drive link
    
    const fileId = match[1];

    // 1. Check if we already downloaded this exact URL
    const assets = await this.prisma.contentAsset.findMany({
      where: { organizationId, assetType: 'Image' }
    });
    
    const existingAsset = assets.find(a => (a.metadata as any)?.originalUrl === googleDriveUrl);
    
    if (existingAsset) {
      return existingAsset.url;
    }

    // 2. Download and store physically with security hardening
    try {
      this.logger.log(`Downloading new photo from Google Drive: ${fileId}`);
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      
      // HARDENING: Abort timeout of 15 seconds to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(downloadUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        this.logger.warn(`Failed to download photo ${fileId}: ${response.statusText}`);
        return null; // Gracefully fail
      }

      // HARDENING: MIME type validation
      const contentType = response.headers.get('content-type');
      if (!contentType?.startsWith('image/')) {
        this.logger.warn(`Rejected file ${fileId}: Invalid MIME type '${contentType}'. Expected image/*`);
        return null;
      }

      // Prepare storage
      const id = crypto.randomUUID();
      const publicHash = crypto.randomBytes(32).toString('hex');
      const filename = `staff-photo-${id}.jpg`;
      const storageDir = join(process.cwd(), 'storage');
      const filepath = join(storageDir, filename);
      
      // Ensure storage dir exists
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }

      // HARDENING: Stream pipeline to prevent Memory Leaks (OOM)
      if (response.body) {
        await pipeline(
          Readable.fromWeb(response.body as any),
          fs.createWriteStream(filepath)
        );
      } else {
        throw new Error('Response body is null');
      }

      // 3. Create ContentAsset
      const asset = await this.prisma.contentAsset.create({
        data: {
          id,
          organizationId,
          assetType: 'Image',
          url: `/media/${publicHash}`,
          metadata: {
            filename,
            originalUrl: googleDriveUrl,
            source: 'GoogleSheetSync'
          }
        }
      });

      return asset.url;
    } catch (e) {
      this.logger.warn(`Error downloading photo ${fileId}: ${e.message}`);
      return null; // Gracefully fail
    }
  }

  async syncFromGoogleSheet(organizationId: string, csvUrl: string) {
    if (!csvUrl || !csvUrl.startsWith('https://docs.google.com/spreadsheets')) {
      throw new BadRequestException('Invalid Google Sheets URL. Please provide a "Publish to Web as CSV" link.');
    }

    try {
      this.logger.log(`Fetching CSV from: ${csvUrl}`);
      const response = await fetch(csvUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.statusText}`);
      }

      const csvData = await response.text();
      
      // Parse CSV
      const records: any[] = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      this.logger.log(`Parsed ${records.length} records. Starting DB Sync...`);

      // 1. Fetch existing active staff to track missing records (for marking INACTIVE)
      const existingStaffList = await this.prisma.staffDirectory.findMany({
        where: { organizationId, status: 'ACTIVE' },
        select: { id: true, staffId: true, photoUrl: true }
      });
      const activeStaffMap = new Map(existingStaffList.map(s => [s.staffId, s]));

      let updatedCount = 0;
      let addedCount = 0;
      let inactiveCount = 0;

      // 2. Upsert each record from CSV
      for (const record of records) {
        // Map raw CSV keys to handle both camelCase and snake_case safely
        const rawStaffId = record.staffId || record.staff_id;
        const rawName = record.name || record.staff_name;
        const rawPhotoUrl = record.photoUrl || record.photo_url;
        const rawPhone = record.phone || record.phone_number;
        const rawDepartment = record.department || record.dept;
        const rawDesignation = record.designation;
        const rawSubjects = record.subjects;
        const rawClassesInCharge = record.classesInCharge || record.class_in_charge;
        const rawStatus = record.status;
        const rawEmail = record.email;
        const rawRoom = record.room;
        const rawTimetable = record.timetable;
        const rawTimetableUrl = record.time_table_url || record.timetableUrl || record.timetable_url;

        if (!rawStaffId || !rawName) {
          continue; // Skip invalid rows
        }

        const existingRecordInfo = activeStaffMap.get(rawStaffId);
        activeStaffMap.delete(rawStaffId); // Remove from "missing" list

        // Parse JSON fields
        let subjects = null;
        let classesInCharge = null;
        let timetable = null;

        try { if (rawSubjects) subjects = JSON.parse(rawSubjects); } catch (e) { subjects = rawSubjects.split(',').map(s => s.trim()); }
        try { if (rawClassesInCharge) classesInCharge = JSON.parse(rawClassesInCharge); } catch (e) { classesInCharge = rawClassesInCharge.split(',').map(s => s.trim()); }
        
        if (rawTimetableUrl) {
          timetable = { url: rawTimetableUrl };
        } else {
          try { if (rawTimetable) timetable = JSON.parse(rawTimetable); } catch (e) { timetable = null; }
        }

        // HARDENING: Polite delay to avoid Google rate limits
        await new Promise(r => setTimeout(r, 300));

        const photoUrl = await this.downloadAndStorePhoto(rawPhotoUrl, organizationId);
        const incomingStatus = rawStatus ? rawStatus.toString().toUpperCase() : 'ACTIVE';

        const existing = await this.prisma.staffDirectory.findFirst({
          where: { organizationId, staffId: rawStaffId }
        });

        if (existing) {
          // Deep compare fields to determine if an update is truly necessary
          const changed = 
            existing.name !== rawName || 
            existing.photoUrl !== photoUrl ||
            existing.designation !== rawDesignation ||
            existing.department !== rawDepartment ||
            existing.phone !== rawPhone ||
            existing.status !== incomingStatus;

          if (changed) {
            // HARDENING: Orphan Cleanup
            if (existing.photoUrl && existing.photoUrl !== photoUrl && existing.photoUrl.startsWith('/media/')) {
              this.logger.log(`Cleaning up orphaned photo: ${existing.photoUrl}`);
              await this.contentService.deleteByUrl(existing.photoUrl);
            }

            await this.prisma.staffDirectory.update({
              where: { id: existing.id },
              data: {
                name: rawName,
                photoUrl: photoUrl || null,
                designation: rawDesignation || null,
                department: rawDepartment || null,
                phone: rawPhone || null,
                email: rawEmail || null,
                subjects,
                classesInCharge,
                room: rawRoom || null,
                timetable,
                status: incomingStatus
              }
            });
            updatedCount++;
          }
        } else {
          await this.prisma.staffDirectory.create({
            data: {
              organizationId,
              staffId: rawStaffId,
              name: rawName,
              photoUrl: photoUrl || null,
              designation: rawDesignation || null,
              department: rawDepartment || null,
              phone: rawPhone || null,
              email: rawEmail || null,
              subjects,
              classesInCharge,
              room: rawRoom || null,
              timetable,
              status: incomingStatus
            }
          });
          addedCount++;
        }
      }

      // 3. Mark missing staff as INACTIVE
      for (const [missingStaffId, _] of activeStaffMap.entries()) {
        await this.prisma.staffDirectory.update({
          where: { staffId: missingStaffId },
          data: { status: 'INACTIVE' }
        });
        inactiveCount++;
      }

      this.logger.log(`Sync complete. Added: ${addedCount}, Updated: ${updatedCount}, Deactivated: ${inactiveCount}`);
      return { success: true, addedCount, updatedCount, inactiveCount, totalProcessed: records.length };
    } catch (error) {
      this.logger.error(`Sync failed: ${error.message}`);
      throw new BadRequestException(`Failed to sync from Google Sheets: ${error.message}`);
    }
  }

  async getAllStaff(organizationId: string) {
    return this.prisma.staffDirectory.findMany({
      where: { 
        organizationId, 
        status: { equals: 'ACTIVE', mode: 'insensitive' } 
      },
      orderBy: { name: 'asc' }
    });
  }
}

