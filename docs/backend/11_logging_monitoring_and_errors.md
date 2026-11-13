# Logging, Monitoring, & Errors

For an enterprise API, proper error handling is a dual-sided challenge. To the DevOps team monitoring the servers, errors must be highly verbose, containing stack traces, SQL failures, and system paths. However, to the public API consumer (the mobile app), errors must be generic and tightly controlled to prevent leaking internal infrastructure details.

SpatialOS achieves this balance using NestJS's `GlobalExceptionFilter`.

---

## 1. Global Exception Filtering
Every API endpoint in SpatialOS is shielded by the `GlobalExceptionFilter` (located in `src/common/filters/http-exception.filter.ts`). 

By applying `@Catch()` globally, the backend ensures that if a developer forgets to wrap a risky operation in a `try/catch` block, the Node.js server *will not crash*. The exception is intercepted before it hits the V8 engine layer.

### The Standardized API Contract
No matter what fails internally, the API guarantees a consistent JSON structure to the Flutter app. This ensures the mobile app can parse errors reliably without crashing itself.

```json
{
  "success": false,
  "message": "A human-readable string safe for the user",
  "errorCode": "HTTP_401", // Or DB_ERROR, INTERNAL_ERROR
  "timestamp": "2026-09-08T15:20:00.000Z"
}
```

---

## 2. Forensic Logging for DevOps
While the client receives the sanitized JSON above, the backend utilizes the `@nestjs/common` `Logger` to write the raw, brutal truth to `stdout`.

```typescript
this.logger.error(`[AUDIT EXCEPTION LOG] Unhandled internal error: ${exception.message}`, exception.stack);
```

Because this runs inside Docker, the `stdout` stream is automatically captured by the Docker Daemon. This allows system administrators to easily pipe these logs into robust monitoring stacks like **Datadog**, **ELK (Elasticsearch, Logstash, Kibana)**, or simply view them via `docker logs spatialos_api --tail 100`.

---

## 3. Security: Stack Trace Stripping & Leak Prevention
This is the most critical function of the `GlobalExceptionFilter`.

### Database Interception
If Prisma fails (e.g., trying to insert a duplicate unique key), it throws a `PrismaClientKnownRequestError`. This error often contains the raw SQL query or table names. The filter intercepts this specific class, logs the raw data to DevOps, but forcefully overwrites the client message to:
`"Database operation failed due to invalid constraints or relations."`

### Filesystem Traversal Leak Mitigation
If an error occurs while writing files, Node.js often appends the exact physical path to the error (e.g., `Failed to open C:\Users\Admin\project\storage\file.mp4`).

Exposing `C:\` or `process.cwd()` to the public internet is a critical security vulnerability, as it tells attackers exactly how the server's hard drive is structured. 

The filter actively scans the final outgoing message for these signatures:
```typescript
if (message.includes('Prisma') || message.includes('SELECT') || message.includes('C:\\') || message.includes(process.cwd())) {
  message = 'Unable to process request due to database or storage operation error';
}
```

This strict string-matching guarantee means SpatialOS can safely run in production without accidentally leaking its own internal blueprints.
