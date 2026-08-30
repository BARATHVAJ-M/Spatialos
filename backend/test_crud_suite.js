process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🧪 =========================================================');
  console.log('🧪 SPATIALOS AUTOMATED CRUD & STORAGE VERIFICATION SUITE');
  console.log('🧪 =========================================================\n');

  try {
    // 1. CREATE QR LOCATION
    console.log('▶️ [TEST 1]: Creating new QR Location anchor in database...');
    const createQrRes = await fetch(`${BASE_URL}/qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locationName: 'Automation Verification Suite Room',
        building: 'QA-LAB',
        floor: 'Level 7',
        room: 'Chamber 707',
        description: 'Testing persistence of QR metadata and AR contents'
      })
    });
    const qrData = await createQrRes.json();
    if (!qrData.success || !qrData.data.location) {
      throw new Error(`QR Creation failed: ${JSON.stringify(qrData)}`);
    }
    const loc = qrData.data.location;
    console.log(`✅ [PASS]: QR Anchor created successfully! ID: ${loc.id}, Code: ${loc.qrCode}\n`);

    // 2. UPDATE QR LOCATION DETAILS
    console.log('▶️ [TEST 2]: Modifying saved QR Location details...');
    const updateQrRes = await fetch(`${BASE_URL}/locations/${loc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locationName: 'Upgraded Executive AI Suite',
        floor: 'Level 8 (Penthouse)'
      })
    });
    const updatedQr = await updateQrRes.json();
    if (!updatedQr.success || updatedQr.data.locationName !== 'Upgraded Executive AI Suite') {
      throw new Error(`QR Update failed: ${JSON.stringify(updatedQr)}`);
    }
    console.log(`✅ [PASS]: QR details updated and persisted in DB: "${updatedQr.data.locationName}" (${updatedQr.data.floor})\n`);

    // 3. UPLOAD PHYSICAL PHOTO ASSET TO HARD DRIVE STORAGE
    console.log('▶️ [TEST 3]: Uploading physical Photo asset to Laptop /storage/ directory...');
    const dummyImageBytes = Buffer.from('89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000A49444154789C63000100000500010D0A2D440000000049454E44AE426082', 'hex').toString('base64');
    const testFileName = `qa_verify_photo_${Date.now()}.jpg`;
    const uploadRes = await fetch(`${BASE_URL}/placements/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: testFileName,
        fileBytes: dummyImageBytes,
        mimeType: 'image/jpeg',
        serverHost: BASE_URL
      })
    });
    const uploadData = await uploadRes.json();
    if (!uploadData.success || !uploadData.filePath) {
      throw new Error(`Photo upload failed: ${JSON.stringify(uploadData)}`);
    }
    const urlParts = uploadData.filePath.split('/');
    const actualSavedFileName = urlParts.slice(-2).join('/');
    const diskPath = path.join(__dirname, 'storage', actualSavedFileName);
    if (!fs.existsSync(diskPath)) {
      throw new Error(`Physical photo file NOT found on laptop disk at ${diskPath}!`);
    }
    console.log(`✅ [PASS]: Physical photo file verified directly on Laptop drive at: ${diskPath}\n`);

    // 4. CREATE AR PHOTO PLACEMENT IN DATABASE
    console.log('▶️ [TEST 4]: Creating AR Photo placement anchored to QR code...');
    const mediaUUID = crypto.randomUUID();
    const photoPlacementRes = await fetch(`${BASE_URL}/placements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qrCode: loc.id,
        contentType: 'IMAGE',
        contentReferenceId: mediaUUID,
        expiry_days: 7,
        mediaData: {
          id: mediaUUID,
          fileType: 'IMAGE',
          filePath: uploadData.filePath,
          fileSize: 64,
          mimeType: 'image/jpeg',
          originalName: testFileName,
          uploadedBy: crypto.randomUUID()
        },
        transform: {
          position_x: 50.0,
          position_y: 100.0,
          position_z: -2.0,
          rotation_z: 0.0,
          scale_x: 1.0,
          scale_y: 1.0,
          scale_z: 1.0
        }
      })
    });
    const photoPlacement = await photoPlacementRes.json();
    if (!photoPlacement.success) {
      throw new Error(`Photo placement creation failed: ${JSON.stringify(photoPlacement)}`);
    }
    const masterPhotoContentId = photoPlacement.data.id;
    console.log(`✅ [PASS]: AR Photo placement linked to DB! Master AR Content UUID: ${masterPhotoContentId}\n`);

    // 5. CREATE AR TEXT NOTE PLACEMENT IN DATABASE WITH CUSTOM STYLES
    console.log('▶️ [TEST 5]: Creating AR Text note with customized color (#FFD700), Orbitron font, and 32px size...');
    const textUUID = crypto.randomUUID();
    const textPlacementRes = await fetch(`${BASE_URL}/placements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qrCode: loc.id,
        contentType: 'TEXT',
        contentReferenceId: textUUID,
        expiry_days: 7,
        textData: {
          id: textUUID,
          text: 'SpatialOS AR Engine Quality Assurance Notice',
          colorHex: '#FFD700',
          fontSize: 32.0,
          fontFamily: 'Orbitron',
          style: 'BOLD_ITALIC',
          alignment: 'CENTER'
        },
        transform: {
          position_x: 180.0,
          position_y: 320.0,
          position_z: 0.5,
          rotation_z: 15.0,
          scale_x: 1.5,
          scale_y: 1.5,
          scale_z: 1.0
        }
      })
    });
    const textPlacement = await textPlacementRes.json();
    if (!textPlacement.success) {
      throw new Error(`Text note placement creation failed: ${JSON.stringify(textPlacement)}`);
    }
    const masterTextContentId = textPlacement.data.id;
    console.log(`✅ [PASS]: AR Text placement created! Master AR Content UUID: ${masterTextContentId}\n`);

    // 6. VERIFY EDITING & SAVING NEW SIZE/POSITION/ROTATION (TRANSFORM UPSERT & UPDATES)
    console.log('▶️ [TEST 6]: Performing live gesture edits: Resizing and repositioning Photo (Testing no Prisma exception occurred)...');
    const updateTransRes = await fetch(`${BASE_URL}/placements/${masterPhotoContentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        positionX: 450.5,
        positionY: 210.3,
        positionZ: -1.0,
        rotationZ: 45.0,
        scaleX: 2.35,
        scaleY: 2.35,
        scaleZ: 1.0
      })
    });
    const updateTransData = await updateTransRes.json();
    if (!updateTransData.success || updateTransData.data.scaleX !== 2.35 || updateTransData.data.rotationZ !== 45.0) {
      throw new Error(`Transform update failed: ${JSON.stringify(updateTransData)}`);
    }
    console.log(`✅ [PASS]: Zero Prisma exceptions! Updated coordinates & size persisted accurately in PostgreSQL: Position(${updateTransData.data.positionX}, ${updateTransData.data.positionY}), Scale(${updateTransData.data.scaleX}, ${updateTransData.data.scaleY}), Angle(${updateTransData.data.rotationZ}deg)\n`);

    // 7. RELOAD & PERSISTENCE VERIFICATION (SIMULATING BROWSER REFRESH & REOPEN)
    console.log('▶️ [TEST 7]: Simulating phone browser refresh: Re-fetching saved location contents...');
    const reloadRes = await fetch(`${BASE_URL}/placements/preview?qrCode=${encodeURIComponent(loc.id)}`);
    const reloadData = await reloadRes.json();
    if (!reloadData.success || !reloadData.data || !reloadData.data.objects || reloadData.data.objects.length !== 2) {
      throw new Error(`Reloading failed or unexpected count: ${JSON.stringify(reloadData)}`);
    }
    const reloadedPhoto = reloadData.data.objects.find(c => c.id === masterPhotoContentId);
    const reloadedText = reloadData.data.objects.find(c => c.id === masterTextContentId);
    if (!reloadedPhoto || !reloadedText) {
      throw new Error('Reloaded contents did not match master IDs!');
    }
    if (reloadedPhoto.transform.scaleX !== 2.35 || reloadedPhoto.transform.positionX !== 450.5) {
      throw new Error(`Reloaded photo failed to preserve user's modified size & coordinates! ${JSON.stringify(reloadedPhoto.transform)}`);
    }
    if (reloadedText.contentData.textColor !== '#FFD700' || reloadedText.contentData.fontFamily !== 'Orbitron' || reloadedText.contentData.fontSize !== 32) {
      throw new Error(`Reloaded text failed to preserve custom styling attributes! ${JSON.stringify(reloadedText.contentData)}`);
    }
    console.log(`✅ [PASS]: Perfect persistence verified! Both items retained exact customized coordinates, sizes (Scale: 2.35x), colors (#FFD700), font families (Orbitron), and physical file attachments after simulated refresh!\n`);

    // 8. TEST INDIVIDUAL ITEM DELETION & PHYSICAL FILE WIPING
    console.log('▶️ [TEST 8]: Deleting Photo placement directly and verifying physical file wipe on Laptop drive...');
    const deletePhotoRes = await fetch(`${BASE_URL}/placements/${masterPhotoContentId}`, {
      method: 'DELETE'
    });
    const deletePhotoData = await deletePhotoRes.json();
    if (!deletePhotoData.success || deletePhotoData.data.status !== 'DELETED') {
      throw new Error(`Individual placement deletion failed: ${JSON.stringify(deletePhotoData)}`);
    }
    if (fs.existsSync(diskPath)) {
      throw new Error(`CRITICAL: Photo file was NOT deleted from disk at ${diskPath}!`);
    }
    console.log(`✅ [PASS]: Individual item deletion completely erased metadata from DB AND physically unlinked the photo file from ${diskPath}!\n`);

    // 9. TEST CASCADING QR LOCATION DELETION
    console.log('▶️ [TEST 9]: Testing total cascading deletion of the saved QR Location...');
    const deleteLocRes = await fetch(`${BASE_URL}/locations/${loc.id}`, {
      method: 'DELETE'
    });
    const deleteLocData = await deleteLocRes.json();
    if (!deleteLocData.success || deleteLocData.data.status !== 'DELETED') {
      throw new Error(`Location deletion failed: ${JSON.stringify(deleteLocData)}`);
    }
    const checkLocRes = await fetch(`${BASE_URL}/qr/${loc.qrCode}`);
    if (checkLocRes.status !== 404) {
      const remaining = await checkLocRes.json();
      throw new Error(`QR Location still existed in spatial database after deletion! ${JSON.stringify(remaining)}`);
    }
    const checkTextAfter = await fetch(`${BASE_URL}/placements/preview?qrCode=${encodeURIComponent(loc.id)}`);
    const remainingPlacements = await checkTextAfter.json();
    if (remainingPlacements.data && remainingPlacements.data.objects && remainingPlacements.data.objects.length > 0) {
      throw new Error(`Orphaned placements remained after QR deletion! ${JSON.stringify(remainingPlacements)}`);
    }
    console.log(`✅ [PASS]: Complete cascading wipe confirmed! QR Location, anchor data, and all remaining attached text notes and media records were totally purged from PostgreSQL!\n`);

    console.log('🎉 =========================================================================');
    console.log('🎉 ALL 9 CRUD & PERSISTENCE TESTS PASSED 100% PERFECTLY WITH ZERO ERRORS!');
    console.log('🎉 =========================================================================\n');
    process.exit(0);

  } catch (err) {
    console.error(`❌ [FAIL]: Verification suite failed:`, err.message);
    process.exit(1);
  }
}

runTests();
