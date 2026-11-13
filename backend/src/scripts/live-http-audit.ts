import * as dotenv from 'dotenv';
dotenv.config();

const BASE_URL = `http://127.0.0.1:${process.env.PORT || 3001}`;

interface TestResult {
  suite: string;
  test: string;
  status: 'PASS' | 'FAIL';
  details?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function recordHttpTest(suite: string, test: string, fn: () => Promise<void>) {
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

async function runLiveHttpAudit() {
  console.log('====================================================');
  console.log('SPATIALOS LIVE HTTP API & NETWORK FLOW AUDIT');
  console.log(`Targeting Live Server at: ${BASE_URL}`);
  console.log('====================================================\n');

  let adminToken = '';
  let createdPlaceId = '';
  let createdExperienceId = '';

  // [SUITE 1] Health & System Status Endpoints
  console.log('[SUITE 1/7] Health & Diagnostic HTTP Endpoints');
  await recordHttpTest('Health', 'GET /health/live returns HTTP 200 and probe ok', async () => {
    const res = await fetch(`${BASE_URL}/health/live`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json() as any;
    if (data.status !== 'ok' || data.probe !== 'liveness') {
      throw new Error(`Unexpected payload: ${JSON.stringify(data)}`);
    }
  });

  await recordHttpTest('Health', 'GET /health/ready returns HTTP 200 and database connected', async () => {
    const res = await fetch(`${BASE_URL}/health/ready`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json() as any;
    if (data.status !== 'ok' || data.database !== 'connected') {
      throw new Error(`Unexpected readiness payload: ${JSON.stringify(data)}`);
    }
  });

  // [SUITE 2] Authentication HTTP Endpoints
  console.log('\n[SUITE 2/7] Authentication & Security HTTP Flow');
  await recordHttpTest('Auth', 'POST /auth/login with valid credentials yields JWT token', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@spatialos.com',
        password: process.env.BOOTSTRAP_ADMIN_PASSWORD || 'admin123',
      }),
    });
    if (res.status !== 200) {
      const err = await res.text();
      throw new Error(`Expected 200, got ${res.status}: ${err}`);
    }
    const data = await res.json() as any;
    if (!data.success || !data.data?.token) {
      throw new Error(`Missing token in response: ${JSON.stringify(data)}`);
    }
    adminToken = data.data.token;
  });

  await recordHttpTest('Auth', 'POST /auth/login with incorrect credentials returns HTTP 401', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@spatialos.com',
        password: 'incorrect-password-xyz',
      }),
    });
    if (res.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, got status ${res.status}`);
    }
  });

  // [SUITE 3] Overview & Analytics Endpoints (Protected)
  console.log('\n[SUITE 3/7] Overview & Dashboard Summary HTTP Endpoints');
  await recordHttpTest('Overview', 'GET /v1/admin/overview/summary requires Bearer Auth', async () => {
    const res = await fetch(`${BASE_URL}/v1/admin/overview/summary`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await recordHttpTest('Overview', 'GET /v1/admin/overview/summary with Bearer Token returns metrics cards', async () => {
    const res = await fetch(`${BASE_URL}/v1/admin/overview/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}: ${await res.text()}`);
    }
    const data = await res.json() as any;
    // Controller returns array of metric cards directly
    const cards = Array.isArray(data) ? data : data.data?.cards;
    if (!cards || cards.length === 0) {
      throw new Error(`Missing metrics cards in response: ${JSON.stringify(data)}`);
    }
  });

  await recordHttpTest('Overview', 'GET /v1/admin/overview/health with Bearer Token returns subsystem status', async () => {
    const res = await fetch(`${BASE_URL}/v1/admin/overview/health`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    const data = await res.json() as any;
    const healthList = Array.isArray(data) ? data : data.data;
    if (!Array.isArray(healthList) || healthList.length === 0) {
      throw new Error(`Invalid subsystem health response: ${JSON.stringify(data)}`);
    }
  });

  // [SUITE 4] Places Endpoints
  console.log('\n[SUITE 4/7] Places Management HTTP Endpoints');
  await recordHttpTest('Places', 'GET /v1/admin/places returns list of places', async () => {
    const res = await fetch(`${BASE_URL}/v1/admin/places`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json() as any;
    const places = Array.isArray(data) ? data : data.data;
    if (!Array.isArray(places)) {
      throw new Error(`Invalid places response: ${JSON.stringify(data)}`);
    }
  });

  await recordHttpTest('Places', 'POST /v1/admin/places creates a new place', async () => {
    const res = await fetch(`${BASE_URL}/v1/admin/places`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: `Live Audit Place ${Date.now()}`,
        description: 'Testing live place creation via HTTP',
        type: 'BUILDING',
      }),
    });
    if (res.status !== 201 && res.status !== 200) {
      throw new Error(`Expected 201/200, got ${res.status}: ${await res.text()}`);
    }
    const data = await res.json() as any;
    createdPlaceId = data.id || data.data?.id;
    if (!createdPlaceId) {
      throw new Error(`Failed to extract created place id: ${JSON.stringify(data)}`);
    }
  });

  // [SUITE 5] Experiences & Spatial Nodes
  console.log('\n[SUITE 5/7] Experiences & Spatial Nodes HTTP Flow');
  await recordHttpTest('Experiences', 'POST /v1/admin/experiences creates a draft experience', async () => {
    const res = await fetch(`${BASE_URL}/v1/admin/experiences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        placeId: createdPlaceId,
        name: 'Live Audit Experience',
        description: 'Verifying end-to-end experience creation',
      }),
    });
    if (res.status !== 201 && res.status !== 200) {
      throw new Error(`Expected 201/200, got ${res.status}: ${await res.text()}`);
    }
    const data = await res.json() as any;
    createdExperienceId = data.id || data.data?.id;
    if (!createdExperienceId) {
      throw new Error(`Failed to extract created experience id: ${JSON.stringify(data)}`);
    }
  });

  await recordHttpTest('Experiences', 'PUT /v1/admin/experiences/:id/nodes replaces spatial nodes without FK violation', async () => {
    const testNodes = [
      {
        name: 'Welcome Sign',
        type: 'TEXT',
        positionX: 0.0,
        positionY: 1.5,
        positionZ: -2.0,
        rotationX: 0.0,
        rotationY: 0.0,
        rotationZ: 0.0,
        scaleX: 1.0,
        scaleY: 1.0,
        scaleZ: 1.0,
        referenceId: null,
      },
      {
        name: 'Information Widget',
        type: 'SERVICE',
        positionX: 1.0,
        positionY: 1.2,
        positionZ: -1.5,
        rotationX: 0.0,
        rotationY: 0.0,
        rotationZ: 0.0,
        scaleX: 1.0,
        scaleY: 1.0,
        scaleZ: 1.0,
        referenceId: null,
      },
    ];

    const res = await fetch(`${BASE_URL}/v1/admin/experiences/${createdExperienceId}/nodes`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ nodes: testNodes }),
    });

    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}: ${await res.text()}`);
    }
    const data = await res.json() as any;
    if (!data.success) {
      throw new Error(`Failed to update nodes: ${JSON.stringify(data)}`);
    }

    // Verify persisted nodes in database via GET
    const expRes = await fetch(`${BASE_URL}/v1/admin/experiences/${createdExperienceId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (expRes.status !== 200) throw new Error(`Expected 200 on GET experience, got ${expRes.status}`);
    const expData = await expRes.json() as any;
    if (!expData.spatialNodes || expData.spatialNodes.length !== 2) {
      throw new Error(`Expected 2 persisted spatial nodes, got: ${JSON.stringify(expData.spatialNodes)}`);
    }
  });

  // [SUITE 6] Service Definitions & AR Micro-Apps
  console.log('\n[SUITE 6/7] AR Service Definitions HTTP Flow');
  await recordHttpTest('Definitions', 'GET /v1/admin/services/definitions returns available AR micro-app definitions', async () => {
    const res = await fetch(`${BASE_URL}/v1/admin/services/definitions`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json() as any;
    const defs = Array.isArray(data) ? data : data.data;
    if (!Array.isArray(defs) || defs.length === 0) {
      throw new Error(`Invalid service definitions response: ${JSON.stringify(data)}`);
    }
  });

  // [SUITE 7] Public Placements API (Mobile User App Contract)
  console.log('\n[SUITE 7/7] Placements Preview HTTP (Mobile AR Client Contract)');
  await recordHttpTest('Placements', 'GET /placements/preview with non-existent QR returns gracefully without crash', async () => {
    const res = await fetch(`${BASE_URL}/placements/preview?qr=UNKNOWN_QR_TARGET_12345`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json() as any;
    const objects = data?.data?.objects ?? data?.objects;
    if (!Array.isArray(objects)) {
      throw new Error(`Expected objects array, got: ${JSON.stringify(data)}`);
    }
  });

  // Cleanup: Delete created experience and place
  if (createdExperienceId) {
    try {
      await fetch(`${BASE_URL}/v1/admin/experiences/${createdExperienceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } catch {}
  }
  if (createdPlaceId) {
    try {
      await fetch(`${BASE_URL}/v1/admin/places/${createdPlaceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } catch {}
  }

  // Summary
  console.log('\n====================================================');
  console.log('LIVE HTTP AUDIT REPORT SUMMARY');
  console.log('====================================================');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`Total HTTP Tests: ${results.length}`);
  console.log(`Passed:           ${passed}`);
  console.log(`Failed:           ${failed}`);
  console.log('----------------------------------------------------');
  if (failed === 0) {
    console.log('ALL LIVE HTTP FLOWS PASSED SUCCESSFULLY!');
  } else {
    console.error(`FAILED: ${failed} tests failed.`);
    process.exit(1);
  }
}

runLiveHttpAudit().catch(err => {
  console.error('Fatal error during Live HTTP Audit:', err);
  process.exit(1);
});
