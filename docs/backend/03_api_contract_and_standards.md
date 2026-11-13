# API Contract & Standards

## 1. RESTful Principles & Route Structure
The SpatialOS API strictly adheres to RESTful resource principles. All routes are predictable and verb-oriented.

*   **API Prefix**: Routes meant for administrative interfaces (dashboards, generic UI tools) are prefixed with `/v1/admin/` (e.g., `/v1/admin/content`, `/v1/admin/experiences`).
*   **Public/Client Prefix**: Routes meant for mobile applications or end-users usually omit the admin prefix or utilize specific context prefixes (e.g., `/media/:hash` for public stream access).
*   **HTTP Methods**:
    *   `GET` - Retrieve a resource or list of resources.
    *   `POST` - Create a new resource or execute a non-idempotent action.
    *   `PATCH` - Partially update an existing resource (preferred over `PUT`).
    *   `DELETE` - Remove a resource.

---

## 2. Standardized Error Formats (`GlobalExceptionFilter`)
To ensure frontend clients never break due to unexpected HTML error pages or internal stack traces, **all exceptions** are routed through the `GlobalExceptionFilter`. 

Regardless of whether a database query fails, a JWT token expires, or a file isn't found, the API guarantees the following JSON response structure:

```json
{
  "success": false,
  "message": "Human readable error description",
  "errorCode": "HTTP_404", // e.g., DB_ERROR, HTTP_400, INTERNAL_ERROR
  "timestamp": "2024-03-24T12:00:00.000Z"
}
```

**Security Sanitization:** The filter includes strict logic to detect and sanitize any internal leakage. If a raw error message contains database paths (e.g., `C:\`, `Prisma`, `SELECT`), the filter overrides it with generic text (`"Unable to process request due to database or storage operation error"`) to prevent exposing our infrastructure to attackers.

---

## 3. Request Validation & Data Integrity
The backend implements defense-in-depth data validation using `class-validator`.

*   **DTO Enforcement**: All incoming JSON bodies must match their corresponding Data Transfer Object (DTO) class. The `ValidationPipe` automatically strips out any JSON properties that are not explicitly defined in the DTO, protecting against prototype pollution or mass-assignment attacks.
*   **File Uploads**: Endpoints handling multipart form data (like `/v1/admin/content/upload`) utilize NestJS `ParseFilePipeBuilder`. We rigidly enforce:
    *   **MIME Types**: Only specific regex matches are allowed (`/(jpeg|jpg|png|gif|mp4|webm)$/i`).
    *   **Payload Size**: The system explicitly blocks single uploads larger than **50MB** to prevent memory exhaustion and Denial of Service (DoS) conditions.

---

## 4. Authentication, Authorization, & Context
Most API endpoints require a valid JSON Web Token (JWT).

*   **Authentication (`JwtAuthGuard`)**: Intercepts requests, validates the Bearer token signature, checks for expiration, and decodes the payload into `req.user`.
*   **Authorization (`RolesGuard`)**: Further restricts access based on the user's role. For example, `@Roles('ADMIN')` ensures only administrators can hit destructive endpoints.
*   **Multi-Tenant Query Scoping**:
    Instead of trusting the client to pass the correct Organization ID in the body (which could be spoofed), the controllers extract the `orgId` *directly from the verified JWT token*:
    `const orgId = req.user?.orgId;`
    This ensures cross-tenant data bleed is impossible.
*   **Distributed Logging & Traceability**:
    A custom middleware injects an `X-Request-ID` header into every request lifecycle. This ID is passed into the logs, allowing developers to trace exactly which database queries fired for a specific client HTTP request.

---

## 5. API Documentation (Swagger / OpenAPI)
To keep client teams synced, the backend automatically generates a live Swagger UI.

*   The `@nestjs/swagger` decorators on controllers automatically parse DTOs to generate schemas.
*   Developers can view and interact with the live API sandbox by navigating to the `/api/docs` route on the running server (e.g., `http://localhost:3000/api/docs`).
