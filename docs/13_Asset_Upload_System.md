# SpatialOS Implementation Specification: Asset Upload System

**Document ID:** 13_Asset_Upload_System
**Target Audience:** Backend Engineers, Cloud/DevOps Engineers
**Objective:** Define the secure, scalable workflow for uploading heavy media assets (Videos, Images, 3D GLB Models) from the Admin Dashboard to Cloud Storage, completely bypassing the primary NestJS API to prevent memory exhaustion.

---

## 1. The Core Problem

If the Next.js Admin Dashboard sends a 100MB 3D Model directly to the NestJS API (`POST /api/assets`), the NestJS server will consume massive amounts of RAM parsing the multipart buffer. Under heavy load, the API container will crash, bringing down the real-time AR infrastructure.

## 2. The Solution: Pre-Signed Direct Uploads

We use the **Pre-Signed URL** architecture (supported by AWS S3, Google Cloud Storage, and Supabase). 

The Admin browser talks to the Backend *only* to get permission. The browser then uploads the heavy file directly to the cloud storage bucket.

---

## 3. The End-to-End Workflow

### Step 1: Requesting Permission (Client -> Backend)
When the Admin clicks "Upload Video" in the visual builder, the Next.js app asks the NestJS backend for a secure upload ticket.

**Request:** `POST /api/v1/admin/assets/presign`
**Body:**
```json
{
  "filename": "canteen_promo.mp4",
  "contentType": "video/mp4",
  "fileSize": 25000000
}
```

### Step 2: Generating the Ticket (Backend)
The NestJS backend verifies the user's JWT token. It generates a unique object key (to prevent naming collisions) and asks the Cloud Provider (e.g., AWS S3) for a temporary URL.

**Backend Action (TypeScript/AWS SDK):**
```typescript
const uniqueKey = `${req.user.orgId}/${uuidv4()}_canteen_promo.mp4`;
const command = new PutObjectCommand({
  Bucket: process.env.AWS_S3_BUCKET,
  Key: uniqueKey,
  ContentType: "video/mp4"
});
const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // Valid for 5 mins
```

**Response to Client:**
```json
{
  "uploadUrl": "https://spatialos-assets.s3.amazonaws.com/org1/123_canteen_promo.mp4?X-Amz-Signature=...",
  "finalAssetUrl": "https://cdn.spatialos.com/org1/123_canteen_promo.mp4",
  "assetId": "asset_555"
}
```

### Step 3: Direct Upload (Client -> Cloud Storage)
The Next.js app takes the `uploadUrl` and performs a direct `PUT` request containing the raw video bytes. The NestJS backend is completely unaware and its CPU remains at 0%.

### Step 4: Registering the Asset (Client -> Backend)
Once the upload finishes successfully, the client tells the backend to save the asset metadata into the Prisma database.

**Request:** `POST /api/v1/admin/content`
**Body:**
```json
{
  "assetType": "VIDEO",
  "url": "https://cdn.spatialos.com/org1/123_canteen_promo.mp4"
}
```

---

## 4. Edge CDN Integration

As defined in `09_Infrastructure`, the raw S3 bucket URL is *never* sent to the mobile AR client.
The `url` saved in the database uses the CloudFront / Cloudflare Edge Domain (e.g., `cdn.spatialos.com`). 

When the mobile app scans the QR code, it pulls the video from the Edge node closest to the physical location, ensuring immediate playback without buffering.

---

## 5. Security Constraints & Storage Limitations

1. **Size Limits:** The pre-signed URL enforces strict content-length limits. If a user tries to upload a 5GB file using a ticket generated for 25MB, S3 rejects it automatically. The backend enforces maximums:
   - Video: Max 50MB
   - Images/3D Models: Max 10MB
2. **Type Enforcement:** The pre-signed URL locks the `Content-Type`. You cannot upload an `.exe` file using a ticket generated for `video/mp4`.
3. **Tenant Storage Quotas:** Before issuing the Presigned URL, the backend queries the database to calculate the tenant's current storage usage.
   - Example: Each Organization is allotted a 10GB quota.
   - If `currentUsageBytes + newFileSize > quotaLimit`, the backend instantly rejects the request with `402 Payment Required`.
4. **Public Read, Private Write:** The S3 bucket policy allows global `GET` requests (for the AR clients to read), but absolute zero `PUT/POST/DELETE` requests unless signed by the backend's master IAM role.
