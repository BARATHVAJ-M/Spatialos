Markdown
# SpatialOS Implementation Specification: Security & Physical Binding

**Document ID:** 08_Security_&_Physical_Binding  
**Target Audience:** Security Engineers, Backend Developers  
**Objective:** Define the security architecture to protect physical QR targets from being spoofed, secure user interactions, and safely transmit data to third-party webhooks.

---

## 1. Physical Space Security (Anti-Spoofing)

The biggest vulnerability in SpatialOS is "QR Jacking" (a malicious actor pasting a fake QR code over the physical Canteen table QR).

To prevent the AR Engine from downloading a malicious payload, the `qrTargetId` must not be a simple string like `TABLE_05`. It must be cryptographically signed.

### The QR Generation Protocol
When the Admin creates a "Place" in the Dashboard, the Backend generates a **Signed URL/Deep Link**.

```typescript
import * as crypto from 'crypto';

// 1. Generate the unique Place ID
const placeId = "plc_abc123";

// 2. Sign it with the SpatialOS Master Secret
const signature = crypto
  .createHmac('sha256', process.env.SPATIALOS_QR_SECRET)
  .update(placeId)
  .digest('hex');

// 3. The actual string encoded into the printed QR Code
const qrTargetId = `spatialos://resolve?id=${placeId}&sig=${signature.substring(0,16)}`;
The Client Verification
When the AR Engine scans the QR, it sends the full string to the GET /api/v1/scene endpoint. The Backend recalculates the signature. If it doesn't match, the Backend returns a 403 Forbidden and the AR Engine displays a red warning: "Invalid or Tampered Spatial Target."

2. User Authentication & Interaction Security
Because users don't "log in" to the Canteen or the Library directly, SpatialOS acts as the Identity Provider (IdP).

The JWT Strategy
The user logs into the SpatialOS App once (e.g., using Google/Apple Auth or College SSO).

The app stores a standard JWT Bearer Token.

Every time the app hits /actions/execute (when a user taps a button), it passes this JWT.

Context Integrity (Preventing Payload Tampering)
What stops a hacker from scanning Table 05, but changing the API payload to say placeId: "Table_01" to send the bill to someone else?

The Solution: The AR Engine never sends the price or the business logic. It only sends abstract IDs.

JSON
// BAD PAYLOAD (Vulnerable)
{
  "action": "ORDER_COFFEE",
  "price": 0,          // User can tamper with this!
  "table": "Table_01"  // User can tamper with this!
}

// GOOD PAYLOAD (SpatialOS Standard)
{
  "actionId": "act_8899",
  "context": {
    "formValues": { "drink": "Latte" }
  }
}
The Backend Action Broker looks up act_8899, knows exactly which Place it belongs to, knows the price from the DB, and securely processes the transaction. The client has no power to dictate terms.

3. Third-Party Webhook Security (The Action Broker)
When SpatialOS triggers an external service (e.g., sending an order to a Cafe's POS system or a College Attendance portal), that third party needs proof the request actually came from SpatialOS, not a hacker.

Implementation: HMAC Headers
When the Action Broker sends a POST request, it signs the payload.

TypeScript
// Inside action-broker.service.ts
const payloadString = JSON.stringify(webhookPayload);

// Sign the payload using the Tenant's specific webhook secret
const hmacSignature = crypto
  .createHmac('sha256', tenant.webhookSecret)
  .update(payloadString)
  .digest('hex');

// Send to the Cafe's Server
await this.http.post(actionDef.targetUrl, payloadString, {
  headers: {
    'Content-Type': 'application/json',
    'X-SpatialOS-Signature': hmacSignature, // The Cafe verifies this!
    'X-SpatialOS-Event': 'ACTION_EXECUTED'
  }
});
The receiving system (e.g., the college backend) calculates the hash using their secret. If it matches X-SpatialOS-Signature, they know the physical QR scan was legitimate and verified by SpatialOS.

## 4. Rate Limiting & API Throttling
Because scanning a QR code instantly triggers an API call, and external webhooks trigger actions, the platform is vulnerable to both accidental and intentional denial-of-service (DDoS).

### Global API Gateway Protection
We enforce strict throttling at the API layer (e.g., NestJS ThrottlerGuard or Nginx):

- **AR Client Endpoints (e.g., `/scene`)**: High volume but idempotent. Limit: `200 requests / minute per IP`.
- **Action Execution Endpoints (e.g., `/actions/execute`)**: Medium volume, mutates state. Limit: `60 requests / minute per IP`.
- **Admin Dashboard Mutations (e.g., `POST /places`)**: Low volume, heavy DB usage. Limit: `30 requests / minute per Organization`.

If these limits are breached, the API immediately returns `429 Too Many Requests`. This guarantees one aggressive script cannot lock the database for other tenants.

Action Execution Limit: 5 requests / minute per User ID. (Prevents users from spam-clicking "Submit" and double-booking a room or double-ordering food).

TypeScript
// NestJS Throttler Configuration
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60, // 1 minute
      limit: 10, // 10 scans
    }),
  ],
})
export class AppModule {}
5. Privacy & Data Minimization
When SpatialOS acts as a bridge for different organizations, it must adhere to strict data minimization.

The Rule: The AR Engine does not store historical transaction data.

The Implementation: When an action executes, the SpatialOS backend passes the required PII (Name, Email) to the Webhook. SpatialOS logs the actionId and timestamp for analytics, but does not store the literal form values (like health symptoms submitted to a clinic, or specific food ordered) in its own long-term database to avoid data liability.


***

### What is the next logical step for your deployment?
Would you like to explore the **DevOps & Infrastructure blueprint** (AWS/GCP setup, CDN routing for 3D