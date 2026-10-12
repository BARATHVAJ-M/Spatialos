/**
 * SpatialOS Master Class Test Script
 * Phase 1: Database integrity checks
 * Phase 2: Backend API /placements/preview verification
 * 
 * Run with: node master_test.js
 */

const { PrismaClient } = require('@prisma/client');
const http = require('http');

const prisma = new PrismaClient();

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

const PASS = '✅ PASS';
const FAIL = '❌ FAIL';
const WARN = '⚠️  WARN';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function logResult(testName, passed, detail) {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`${PASS} | ${testName}`);
  } else {
    failedTests++;
    console.log(`${FAIL} | ${testName}`);
    failures.push({ test: testName, detail });
  }
  if (detail) console.log(`       ${detail}`);
}

async function main() {
  console.log('='.repeat(80));
  console.log('  SpatialOS MASTER CLASS TEST SUITE');
  console.log('  Tracing: Dashboard → Backend → Mobile App Data Pipeline');
  console.log('='.repeat(80));
  console.log('');

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 1: DATABASE INTEGRITY CHECKS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('─'.repeat(80));
  console.log('  PHASE 1: DATABASE INTEGRITY');
  console.log('─'.repeat(80));

  // Test 1.0 — List all experiences
  const allExperiences = await prisma.experience.findMany({
    select: { id: true, name: true, status: true, version: true, placeId: true },
    orderBy: { version: 'desc' },
    take: 10
  });
  console.log('\n📋 All Experiences in DB:');
  allExperiences.forEach(e => {
    console.log(`   [${e.status}] ${e.name} (id: ${e.id}, v${e.version})`);
  });

  // Find an experience to test with
  let testExpId = null;
  const publishedExp = allExperiences.find(e => e.status === 'PUBLISHED');
  const anyExp = allExperiences[0];
  
  if (publishedExp) {
    testExpId = publishedExp.id;
    console.log(`\n🎯 Using PUBLISHED experience: ${publishedExp.name} (${testExpId})`);
  } else if (anyExp) {
    testExpId = anyExp.id;
    console.log(`\n🎯 No PUBLISHED experience found! Using: ${anyExp.name} (${testExpId}) [status: ${anyExp.status}]`);
  }

  if (!testExpId) {
    console.log('\n❌ No experiences found in database at all! Cannot proceed.');
    await prisma.$disconnect();
    return;
  }

  // Test 1.1 — Service Instances exist
  console.log('');
  const serviceInstances = await prisma.serviceInstance.findMany({
    where: { experienceId: testExpId },
    include: { serviceDefinition: true }
  });
  
  logResult(
    'Test 1.1: Service instances exist in DB',
    serviceInstances.length > 0,
    `Found ${serviceInstances.length} service instance(s)`
  );

  if (serviceInstances.length > 0) {
    console.log('\n   📦 Service Instances Detail:');
    for (const si of serviceInstances) {
      const defName = si.serviceDefinition?.name || si.name || 'UNKNOWN';
      const hasConfig = si.configuration && Object.keys(si.configuration).length > 0;
      const hasContent = si.content && Object.keys(si.content).length > 0;
      const configKeys = hasConfig ? Object.keys(si.configuration).join(', ') : '(empty)';
      const contentKeys = hasContent ? Object.keys(si.content).join(', ') : '(empty)';
      console.log(`   ├── [${defName}] id: ${si.id}`);
      console.log(`   │   config keys: ${configKeys}`);
      console.log(`   │   content keys: ${contentKeys}`);
      console.log(`   │   spatialNodeId: ${si.spatialNodeId || '(none)'}`);
      
      // Check if the service has actual data
      if (!hasConfig && !hasContent) {
        logResult(
          `Test 1.1b: Service "${defName}" has data`,
          false,
          'Both configuration AND content are empty! Dashboard did NOT save actual data.'
        );
      }
    }
  }

  // Test 1.2 — Experience is PUBLISHED
  const experience = await prisma.experience.findUnique({
    where: { id: testExpId },
    select: { id: true, name: true, status: true, version: true, placeId: true }
  });

  logResult(
    'Test 1.2: Experience status is PUBLISHED',
    experience?.status === 'PUBLISHED',
    `Actual status: "${experience?.status}" (expected "PUBLISHED")`
  );

  // Test 1.3 — Spatial Nodes exist
  const spatialNodes = await prisma.spatialNode.findMany({
    where: { experienceId: testExpId }
  });

  logResult(
    'Test 1.3: Spatial nodes exist for experience',
    spatialNodes.length > 0,
    `Found ${spatialNodes.length} spatial node(s)`
  );

  if (spatialNodes.length > 0) {
    console.log('\n   📍 Spatial Nodes:');
    for (const node of spatialNodes) {
      console.log(`   ├── id: ${node.id}, type: ${node.nodeType}, refId: ${node.referenceId}`);
      console.log(`   │   position: (${node.positionX}, ${node.positionY}, ${node.positionZ})`);
      
      // Check if this node links to a real service
      const linkedService = serviceInstances.find(si => si.id === node.referenceId || si.spatialNodeId === node.id);
      if (linkedService) {
        console.log(`   │   → Linked to service: ${linkedService.serviceDefinition?.name || linkedService.name}`);
      } else {
        console.log(`   │   → ⚠️  NOT linked to any service instance!`);
      }
    }
  } else {
    console.log(`   ${WARN} No spatial nodes found. Backend will use unplaced-services fallback.`);
    
    // Verify the unplaced fallback would work
    const unplacedCount = serviceInstances.filter(si => !si.spatialNodeId).length;
    logResult(
      'Test 1.3b: Unplaced services fallback viable',
      unplacedCount > 0,
      `${unplacedCount} service(s) have no spatialNodeId (will be auto-staggered)`
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 2: BACKEND API TESTS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(80));
  console.log('  PHASE 2: BACKEND API — /placements/preview');
  console.log('─'.repeat(80));

  // Test 2.1 — Raw UUID (no prefix)
  console.log('');
  try {
    const res1 = await httpGet(`http://localhost:3001/placements/preview?qrCode=${testExpId}`);
    const objects1 = res1.body?.data?.objects || [];
    logResult(
      'Test 2.1: API returns data for RAW UUID',
      res1.body?.success === true && objects1.length > 0,
      `success=${res1.body?.success}, objects count=${objects1.length}`
    );
    
    if (objects1.length > 0) {
      console.log('\n   📡 Objects returned (raw UUID):');
      for (const obj of objects1) {
        const appId = obj.contentData?.appId || 'UNKNOWN';
        const hasState = obj.contentData?.state && Object.keys(obj.contentData.state).length > 0;
        console.log(`   ├── [${appId}] type: ${obj.contentType}, id: ${obj.id}`);
        console.log(`   │   contentData: ${hasState ? 'has state ✓' : '❌ EMPTY STATE'}`);
        console.log(`   │   transform: pos(${obj.transform?.positionX}, ${obj.transform?.positionY})`);
      }
    }
  } catch (e) {
    logResult('Test 2.1: API returns data for RAW UUID', false, `HTTP error: ${e.message}`);
  }

  // Test 2.2 — With LOC- prefix (what the QR code actually contains)
  const locCode = `LOC-${testExpId}`;
  try {
    const res2 = await httpGet(`http://localhost:3001/placements/preview?qrCode=${locCode}`);
    const objects2 = res2.body?.data?.objects || [];
    logResult(
      'Test 2.2: API returns data for LOC- prefixed code',
      res2.body?.success === true && objects2.length > 0,
      `qrCode="${locCode}", success=${res2.body?.success}, objects count=${objects2.length}`
    );

    if (objects2.length === 0 && res2.body?.success === true) {
      console.log(`   ${WARN} Server returned success=true but EMPTY objects!`);
      console.log(`   ${WARN} This means the LOC- prefix stripping is failing to find the experience.`);
      console.log(`   ${WARN} The QR code embeds "${locCode}" but the DB ID is "${testExpId}".`);
    }
  } catch (e) {
    logResult('Test 2.2: API returns data for LOC- prefixed code', false, `HTTP error: ${e.message}`);
  }

  // Test 2.3 — Check what the Flutter app actually sends
  // The Flutter app's _validateAndLockQr passes the full scanned code.
  // It only strips '/experience/' URLs, NOT 'LOC-' prefixes.
  // So the app sends "LOC-<uuid>" to the repository, which calls GET /placements/preview?qrCode=LOC-<uuid>
  console.log('\n   🔍 Flutter App QR Flow Analysis:');
  console.log(`   │ QR contains:        "${locCode}"`);
  console.log(`   │ App validates:       startsWith('LOC-') → ✓`);
  console.log(`   │ App extracts ID:     targetId = "${locCode}" (does NOT strip LOC-)`);
  console.log(`   │ API call:            GET /placements/preview?qrCode=${locCode}`);
  console.log(`   │ Backend strips LOC-: targetId = "${testExpId}"`);

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 3: FLUTTER CODE AUDIT
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(80));
  console.log('  PHASE 3: FLUTTER CODE AUDIT (Static Analysis)');
  console.log('─'.repeat(80));

  // Test 3.1 — Check all 4 appIds are handled in _buildContentWidget
  const expectedAppIds = ['NOTICE_BOARD', 'CLASSROOM', 'COMPLAINT_BOX', 'STAFF_DETAILS'];
  console.log('\n   📱 Checking _buildContentWidget handles all 4 service types...');
  console.log(`   Expected appIds: ${expectedAppIds.join(', ')}`);
  console.log('   (This requires reading home_screen.dart — see code audit below)');

  // ═══════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(80));
  console.log('  RESULTS SUMMARY');
  console.log('='.repeat(80));
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  Passed:      ${passedTests} ${PASS}`);
  console.log(`  Failed:      ${failedTests} ${failedTests > 0 ? FAIL : ''}`);
  
  if (failures.length > 0) {
    console.log('\n  ❌ FAILURES:');
    failures.forEach((f, i) => {
      console.log(`  ${i+1}. ${f.test}`);
      console.log(`     → ${f.detail}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Test suite crashed:', e);
  await prisma.$disconnect();
});
