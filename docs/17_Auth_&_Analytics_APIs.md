# SpatialOS Implementation Specification: Authentication & Analytics (The Missing Link)

**Document ID:** 17_Auth_&_Analytics_APIs
**Target Audience:** Backend API Engineers
**Objective:** Define the missing Authentication APIs required to generate the JWT tokens used across the platform, and the Telemetry APIs required to power the Admin Dashboard's "Monitor" section.

---

## 1. The Missing Link: Authentication

Throughout Documents 03, 05, and 12, we stated:
`Header: Authorization: Bearer {user_token}`

However, we never defined how the User or Admin *gets* that token. 

### A. The Login Endpoint
**Request:** `POST /api/v1/auth/login`
**Body:**
```json
{
  "email": "admin@spatialos.dev",
  "password": "secure_password_123" 
}
```
*(Note: In a production environment, this might be replaced by Google/Apple OAuth).*

**Action (NestJS `AuthService`):**
1. Validates credentials against the `User` table.
2. Signs a JWT token containing `{ userId, orgId, role }`.

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...",
  "user": {
    "id": "usr_999",
    "email": "admin@spatialos.dev",
    "role": "SYSTEM_ADMIN"
  }
}
```
*This `accessToken` is now cached by the Mobile App and the Next.js Admin Dashboard and injected into every subsequent request.*

---

## 2. The Missing Link: Spatial Analytics (Telemetry)

The Architecture Document explicitly mentions a "MONITOR" section in the Admin Dashboard, but the Database Schema (`02`) had no table to store tracking data, and there was no API for the AR Client to report usage.

### A. The Prisma Database Addition
*Developer Instruction: Add this to `packages/database/prisma/schema.prisma`.*
```prisma
model AnalyticsEvent {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @db.Uuid
  placeId        String   @db.Uuid
  userId         String?  @db.Uuid  // Optional: Anonymous users can still scan
  eventType      String   // SCANNED_QR, TAPPED_BUTTON, DWELL_TIME
  metadata       Json?    // e.g., { "actionId": "act_123", "duration_seconds": 45 }
  createdAt      DateTime @default(now())

  @@index([placeId, eventType])
  @@map("analytics_events")
}
```

### B. The Telemetry API
The Mobile AR Client fires "Fire-and-Forget" events in the background while the user interacts with the spatial scene.

**Request:** `POST /api/v1/analytics/track`
**Body:**
```json
{
  "placeId": "plc_123",
  "eventType": "SCANNED_QR",
  "metadata": {
    "deviceOS": "iOS",
    "loadTimeMs": 420
  }
}
```
**Action (Backend):**
The NestJS backend quickly inserts this into the `AnalyticsEvent` table asynchronously so it doesn't block the main thread.

---

## 3. How the Admin Dashboard Uses This
The Admin Dashboard (`07`) can now hit a new endpoint: `GET /api/v1/admin/analytics?placeId=plc_123`.
This allows the dashboard to display charts showing:
- "145 students scanned this QR code today."
- "70% of them tapped the 'Order Coffee' button."

This completes the absolute final loop of the platform: **Action -> Measurement -> Analytics**.
