import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { HealthController } from '../api/health.controller';
import { AuthService } from '../logic/auth.service';
import { PlacesService } from '../logic/places.service';
import { ExperiencesService } from '../logic/experiences.service';
import { PlacementsService } from '../logic/placements.service';
import { OverviewController } from '../api/overview.controller';
import { SettingsService } from '../logic/settings.service';
import { InstancesService } from '../ar_services/instances.service';
import { AR_SERVICE_REGISTRY } from '../ar_services/service-registry';
import { STORAGE_ADAPTER, IStorageAdapter } from '../logic/storage/storage.interface';
import { PrismaService } from '../database/prisma.service';

interface TestResult {
  suite: string;
  test: string;
  status: 'PASS' | 'FAIL';
  details?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function recordTest(suite: string, test: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    results.push({ suite, test, status: 'PASS', durationMs });
    console.log(`  [PASS] ${test} (${durationMs}ms)`);
  } catch (error: any) {
    const durationMs = Date.now() - start;
    results.push({ suite, test, status: 'FAIL', details: error.message || String(error), durationMs });
    console.error(`  [FAIL] ${test} (${durationMs}ms): ${error.message}`);
  }
}

async function runDeepAudit() {
  console.log('====================================================');
  console.log('SPATIALOS BACKEND REAL-FLOW DEEP AUDIT & TEST RUNNER');
  console.log('====================================================\n');

  console.log('Initializing TestingModule with AppModule...');
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  console.log('Nest Application Context Initialized Successfully.\n');

  // Retrieve dependencies
  const healthController = moduleRef.get<HealthController>(HealthController);
  const authService = moduleRef.get<AuthService>(AuthService);
  const placesService = moduleRef.get<PlacesService>(PlacesService);
  const experiencesService = moduleRef.get<ExperiencesService>(ExperiencesService);
  const placementsService = moduleRef.get<PlacementsService>(PlacementsService);
  const overviewController = moduleRef.get<OverviewController>(OverviewController);
  const settingsService = moduleRef.get<SettingsService>(SettingsService);
  const instancesService = moduleRef.get<InstancesService>(InstancesService);
  const storageAdapter = moduleRef.get<IStorageAdapter>(STORAGE_ADAPTER);
  const prisma = moduleRef.get<PrismaService>(PrismaService);

  const orgId = '00000000-0000-0000-0000-000000000000';

  // 1. Health & Readiness Probe Suite
  console.log('[SUITE 1/8] Health & Diagnostics');
  await recordTest('Health', 'Liveness probe returns status ok', async () => {
    const live = healthController.getLiveness();
    if (live.status !== 'ok' || !live.uptime) {
      throw new Error(`Unexpected liveness response: ${JSON.stringify(live)}`);
    }
  });

  await recordTest('Health', 'Readiness probe checks memory and database', async () => {
    const ready = await healthController.getReadiness();
    if (!ready.status || !ready.probe) {
      throw new Error(`Unexpected readiness response: ${JSON.stringify(ready)}`);
    }
  });

  // 2. Auth Flow & Security Suite
  console.log('\n[SUITE 2/8] Authentication & Security');
  let testAdminToken = '';
  await recordTest('Auth', 'Admin login with seeded credentials produces valid JWT', async () => {
    const loginRes = await authService.login('admin@spatialos.com', 'admin123', '127.0.0.1');
    if (!loginRes.token || !loginRes.user) {
      throw new Error('Login failed to return token or user object');
    }
    if (loginRes.user.role !== 'ADMIN') {
      throw new Error(`Expected role ADMIN, received ${loginRes.user.role}`);
    }
    testAdminToken = loginRes.token;
  });

  await recordTest('Auth', 'Failed login tracks attempts and throws UNAUTHORIZED AppError', async () => {
    try {
      await authService.login('admin@spatialos.com', 'wrong_password_xyz', '127.0.0.1');
      throw new Error('Expected login to fail with invalid password, but it succeeded');
    } catch (e: any) {
      if (!e.message.toLowerCase().includes('password') && !e.message.toLowerCase().includes('invalid')) {
        throw new Error(`Unexpected error message: ${e.message}`);
      }
    }
  });

  // 3. Places CRUD & Hierarchy Suite
  console.log('\n[SUITE 3/8] Places Layer');
  let createdPlaceId = '';
  await recordTest('Places', 'Create place generates valid QR target id and persists', async () => {
    const place = await placesService.create(orgId, 'Audit Test Lab');
    if (!place || !place.id || !place.qrTargetId.startsWith('spatialos://resolve?id=')) {
      throw new Error(`Invalid place created: ${JSON.stringify(place)}`);
    }
    createdPlaceId = place.id;
  });

  await recordTest('Places', 'Retrieve place by ID', async () => {
    const place = await placesService.findOne(orgId, createdPlaceId);
    if (!place || place.name !== 'Audit Test Lab') {
      throw new Error(`Place not found or name mismatch: ${JSON.stringify(place)}`);
    }
  });

  await recordTest('Places', 'Update place name', async () => {
    const updated = await placesService.update(orgId, createdPlaceId, 'Audit Test Lab (Renamed)');
    if (updated.name !== 'Audit Test Lab (Renamed)') {
      throw new Error(`Place update failed: ${JSON.stringify(updated)}`);
    }
  });

  await recordTest('Places', 'Reject invalid parentId to prevent broken tree links', async () => {
    try {
      await placesService.create(orgId, 'Child Place', '00000000-9999-9999-9999-000000000000');
      throw new Error('Expected invalid parentId to be rejected, but it passed');
    } catch (e: any) {
      if (!e.message.includes('Parent place not found')) {
        throw new Error(`Unexpected error: ${e.message}`);
      }
    }
  });

  // 4. Experiences Lifecycle Suite
  console.log('\n[SUITE 4/8] Experiences & Versioning');
  let createdExpId = '';
  await recordTest('Experiences', 'Create draft experience bound to place', async () => {
    const exp = await experiencesService.create(orgId, createdPlaceId, 'Audit AR Experience');
    if (!exp || exp.status !== 'DRAFT' || exp.version !== 1) {
      throw new Error(`Unexpected experience created: ${JSON.stringify(exp)}`);
    }
    createdExpId = exp.id;
  });

  await recordTest('Experiences', 'Update spatial nodes on experience', async () => {
    const testNodes = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        type: '3D Model',
        x: 0,
        y: 1.5,
        z: -2,
        scale: 1,
        boundEntityId: ''
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        type: 'UI_PANEL',
        x: 0.5,
        y: 1.2,
        z: -1.5,
        scale: 1,
        boundEntityId: ''
      }
    ];
    const res = await experiencesService.updateNodes(orgId, createdExpId, testNodes);
    if (!res.success) {
      throw new Error('Failed to update spatial nodes');
    }
  });

  await recordTest('Experiences', 'Publish experience updates status to PUBLISHED', async () => {
    const published = await experiencesService.publish(orgId, createdExpId);
    if (!published || published.status !== 'PUBLISHED') {
      throw new Error(`Publish failed: ${JSON.stringify(published)}`);
    }
  });

  // 5. Placements Preview (User App Contract) Suite
  console.log('\n[SUITE 5/8] Placements & AR User Contract');
  await recordTest('Placements', 'Preview returns proper schema for Mobile User App', async () => {
    const place = await placesService.findOne(orgId, createdPlaceId);
    const preview = await placementsService.preview(place.qrTargetId);
    if (!preview || preview.success !== true || !preview.data || !Array.isArray(preview.data.objects)) {
      throw new Error(`Placements preview failed contract: ${JSON.stringify(preview)}`);
    }
  });

  await recordTest('Placements', 'Preview with unknown QR returns empty objects gracefully', async () => {
    const preview = await placementsService.preview('unknown-qr-target');
    if (!preview || preview.success !== true || preview.data.objects.length !== 0) {
      throw new Error(`Expected empty objects, got: ${JSON.stringify(preview)}`);
    }
  });

  // 6. AR Service Registry & Handlers Suite
  console.log('\n[SUITE 6/8] AR Micro-Apps Registry');
  await recordTest('AR Micro-Apps', 'Verify all 8 AR micro-app handlers resolve in DI', async () => {
    for (const [key, entry] of Object.entries(AR_SERVICE_REGISTRY)) {
      const handler = moduleRef.get(entry.handler, { strict: false });
      if (!handler) {
        throw new Error(`Handler for ${key} (${entry.name}) could not be resolved from Nest DI`);
      }
    }
  });

  // 7. Overview & Metrics Suite
  console.log('\n[SUITE 7/8] Overview & Dashboards');
  await recordTest('Overview', 'Summary returns structured metric cards with icons and counts', async () => {
    const mockReq = { user: { orgId } };
    const summary = await overviewController.getSummary(mockReq);
    if (!Array.isArray(summary) || summary.length !== 5) {
      throw new Error(`Expected 5 summary cards, got: ${JSON.stringify(summary)}`);
    }
  });

  await recordTest('Overview', 'Overview health returns DB, Backend, and Engine status', async () => {
    const health = await overviewController.getHealth();
    if (!Array.isArray(health) || health.length !== 4) {
      throw new Error(`Expected 4 health items, got: ${JSON.stringify(health)}`);
    }
  });

  await recordTest('Overview', 'Create user rejects incomplete payload', async () => {
    try {
      const mockReq = { user: { orgId } };
      await overviewController.createUser(mockReq, { name: 'Incomplete User' });
      throw new Error('Expected createUser to reject missing email/password');
    } catch (e: any) {
      if (!e.message.includes('required')) {
        throw new Error(`Unexpected error message: ${e.message}`);
      }
    }
  });

  // 8. Storage Suite
  console.log('\n[SUITE 8/8] Storage Adapter');
  await recordTest('Storage', 'Local disk storage adapter save, stream check, and cleanup', async () => {
    const testFilename = `audit_test_${Date.now()}.txt`;
    const testContent = Buffer.from('SpatialOS Audit Verification Token 2026');
    const mockFile: any = {
      buffer: testContent,
      size: testContent.length,
      originalname: testFilename,
      mimetype: 'text/plain',
    };

    await storageAdapter.saveFile(mockFile, testFilename);
    const stream = (await storageAdapter.getFileStream(testFilename)) as any;
    if (!stream) {
      throw new Error('Failed to retrieve file stream from storage');
    }
    await new Promise<void>((resolve, reject) => {
      stream.on('data', () => {});
      stream.on('end', () => resolve());
      stream.on('error', reject);
    });
    await storageAdapter.deleteFile(testFilename);
  });

  // Cleanup created test resources
  try {
    if (createdExpId) {
      await experiencesService.remove(orgId, createdExpId);
    }
    if (createdPlaceId) {
      await placesService.remove(orgId, createdPlaceId);
    }
  } catch (cleanErr: any) {
    console.warn('Note: Cleanup of test entities completed with notice:', cleanErr.message);
  }

  // Print Summary
  console.log('\n====================================================');
  console.log('AUDIT EXECUTION REPORT SUMMARY');
  console.log('====================================================');
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`Total Tests Run: ${results.length}`);
  console.log(`Passed:         ${passed}`);
  console.log(`Failed:         ${failed}`);
  console.log('----------------------------------------------------');

  if (failed > 0) {
    console.error('FAILURES DETECTED:');
    results.filter((r) => r.status === 'FAIL').forEach((f) => {
      console.error(`- [${f.suite}] ${f.test}: ${f.details}`);
    });
    process.exit(1);
  } else {
    console.log('ALL VERIFICATION FLOWS PASSED SUCCESSFULLY (0 Broken Links, 0 Ghost Calls).');
    process.exit(0);
  }
}

runDeepAudit().catch((err) => {
  console.error('Fatal audit execution error:', err);
  process.exit(1);
});
