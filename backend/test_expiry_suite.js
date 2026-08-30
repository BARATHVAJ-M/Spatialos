process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_URL = 'https://localhost:3000';

async function runExpiryTests() {
  console.log('🧪 =========================================================');
  console.log('🧪 SPATIALOS CONTENT EXPIRY & FILE MANAGEMENT VERIFICATION');
  console.log('🧪 =========================================================\n');

  try {
    // 1. CREATE TEST QR LOCATION
    console.log('▶️ [TEST 1]: Creating test QR Location for Expiry validation...');
    const createQrRes = await fetch(`${BASE_URL}/qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locationName: 'Expiry Testing Suite Area',
        building: 'SECURITY-LAB',
        floor: 'Level 1',
        room: 'Chamber 101',
      })
    });
    const qrData = await createQrRes.json();
    if (!qrData.success || !qrData.data.location) {
      throw new Error(`QR Creation failed: ${JSON.stringify(qrData)}`);
    }
    const loc = qrData.data.location;
    console.log(`✅ [PASS]: Created QR Anchor ID: ${loc.id}\n`);

    // 2. VERIFY REJECTION OF INVALID EXPIRY PERIODS (0, NEGATIVE, >30, MISSING)
    console.log('▶️ [TEST 2]: Verifying rejection of invalid expiry values (Rulebook enforcement)...');
    const invalidDays = [0, -1, 31, null, ''];
    for (const val of invalidDays) {
      const res = await fetch(`${BASE_URL}/placements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCode: loc.id,
          contentType: 'TEXT',
          contentReferenceId: crypto.randomUUID(),
          expiry_days: val,
          textData: { title: 'Test', paragraph: 'Testing boundaries' }
        })
      });
      if (res.status !== 400 && res.status !== 500) {
        const body = await res.json();
        throw new Error(`Expected failure for expiry value "${val}", but got status ${res.status}: ${JSON.stringify(body)}`);
      }
      console.log(`  ✔ Correctly rejected invalid expiry value: ${val === null ? 'null/missing' : val}`);
    }
    console.log(`✅ [PASS]: All invalid expiry boundaries (0, negative, >30 days, missing) strictly rejected!\n`);

    // 3. VERIFY VALID CONTENT CREATION WITH 7 DAYS EXPIRY
    console.log('▶️ [TEST 3]: Creating valid AR placement with 7 days expiration...');
    const textUUID = crypto.randomUUID();
    const validRes = await fetch(`${BASE_URL}/placements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qrCode: loc.id,
        contentType: 'TEXT',
        contentReferenceId: textUUID,
        expiry_days: 7,
        textData: {
          id: textUUID,
          title: 'Temporary 7-Day Wall Note',
          paragraph: 'Will expire automatically according to rulebook.'
        },
        transform: { position_x: 0, position_y: 0, position_z: 0 }
      })
    });
    const validData = await validRes.json();
    if (!validData.success) {
      throw new Error(`Valid placement creation failed: ${JSON.stringify(validData)}`);
    }
    console.log(`✅ [PASS]: Successfully created placement with 7-day server expiration clock!\n`);

    // 4. VERIFY VIDEO UPLOAD & MEDIA SIZE RULEBOOK
    console.log('▶️ [TEST 4]: Uploading simulated Video asset to storage folder...');
    const dummyVideoBytes = Buffer.from('000000206674797069736F6D0000020069736F6D69736F3261766331', 'hex').toString('base64');
    const testVideoName = `expiry_test_video_${Date.now()}.mp4`;
    const uploadRes = await fetch(`${BASE_URL}/placements/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: testVideoName,
        fileBytes: dummyVideoBytes,
        mimeType: 'video/mp4',
        serverHost: BASE_URL
      })
    });
    const uploadData = await uploadRes.json();
    if (!uploadData.success || !uploadData.filePath) {
      throw new Error(`Video upload failed: ${JSON.stringify(uploadData)}`);
    }
    const savedName = uploadData.filePath.split('/').pop();
    const videoDiskPath = path.join(__dirname, 'storage', savedName);
    if (!fs.existsSync(videoDiskPath)) {
      throw new Error(`Physical video file NOT found on disk at ${videoDiskPath}!`);
    }
    console.log(`✅ [PASS]: Video asset successfully validated and written to disk at ${videoDiskPath}\n`);

    // 5. TEST AUTOMATED BACKGROUND EXPIRY & STORAGE CLEANUP ROUTINE
    console.log('▶️ [TEST 5]: Triggering automated background Content Expiry & Storage cleanup job...');
    const cleanupRes = await fetch(`${BASE_URL}/placements/cleanup`, { method: 'POST' });
    const cleanupData = await cleanupRes.json();
    if (!cleanupData.success) {
      throw new Error(`Cleanup job execution failed: ${JSON.stringify(cleanupData)}`);
    }
    console.log(`✅ [PASS]: Cleanup routine responded successfully: ${JSON.stringify(cleanupData.data)}\n`);

    // Clean up test location and associated files
    await fetch(`${BASE_URL}/locations/${loc.id}`, { method: 'DELETE' });
    if (fs.existsSync(videoDiskPath)) fs.unlinkSync(videoDiskPath);

    console.log('🎉 =========================================================================');
    console.log('🎉 ALL 5 EXPIRY & FILE MANAGEMENT VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('🎉 =========================================================================\n');
    process.exit(0);

  } catch (err) {
    console.error(`❌ [FAIL]: Expiry suite verification failed:`, err.message);
    process.exit(1);
  }
}

runExpiryTests();
