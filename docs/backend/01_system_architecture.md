# System Architecture

## 1. Executive Summary
The SpatialOS Backend is a multi-tenant AR content management and spatial mapping engine. Designed with a generic, API-first approach, it decouples business logic from delivery mechanisms to ensure high scalability and ease of integration with diverse frontends (mobile, dashboard, etc.). 

Core design philosophies:
*   **Modular Architecture**: Built on NestJS, enforcing strong boundaries between controllers (API) and services (Logic).
*   **Generic Extensibility**: Interfaces (e.g., `IStorageAdapter`) allow swapping underlying technologies (like moving from Local Disk to AWS S3) without modifying business logic.
*   **Performance First**: Leverages Redis caching for high-read AR endpoints and uses PostgreSQL for relational integrity.

---

## 2. Technology Stack
The backend leverages a modern, robust Node.js ecosystem:

*   **Framework**: [NestJS](https://nestjs.com/) (running on Express) - Provides structural opinions, Dependency Injection (DI), and decorator-based routing.
*   **Database ORM**: [Prisma](https://www.prisma.io/) - Provides type-safe database queries and declarative schema management.
*   **Data Store**: PostgreSQL - Handles complex relational data like Organizations, Users, Places, and AR Experiences.
*   **Caching & Rate Limiting**: Redis - Reduces DB load for frequently accessed endpoints (e.g., AR scene fetching). Includes an In-Memory fallback for local development.
*   **Deployment**: Docker - Multi-stage Alpine builds ensure consistent, lightweight, and scalable containers for VPS or Cloud deployment.

---

## 3. High-Level Architecture (Component Model)

The application is structured in distinct layers, promoting separation of concerns.

### API Layer (`src/api`)
*   **Responsibility**: HTTP transport, request/response formatting, payload validation, and OpenAPI (Swagger) documentation.
*   **Components**: NestJS Controllers (e.g., `ContentController`, `ExperiencesController`).
*   **Rules**: Controllers must NEVER contain business logic. They simply delegate incoming requests to the appropriate service.

### Business Logic Layer (`src/logic`)
*   **Responsibility**: Core business rules, orchestrating database transactions, and coordinating external integrations.
*   **Components**: NestJS Services (e.g., `ContentService`, `AuthService`).
*   **Rules**: Services interact with Prisma or other adapters. They are unaware of the HTTP context (req/res objects).

### Module Layer (`src/modules`)
*   **Responsibility**: Dependency Injection mapping.
*   **Components**: NestJS Modules (e.g., `ContentModule`, `AuthModule`).
*   **Rules**: Modules declare which Controllers they expose and which Services they provide or import, resolving the DI graph at boot time.

### Data Access Layer (`prisma/schema.prisma`)
*   **Responsibility**: Relational schema definition.
*   **Components**: The Prisma schema file and the generated `PrismaClient`.

---

## 4. The Request Lifecycle
When an HTTP request enters the SpatialOS backend, it follows a strict lifecycle:

1.  **Global Middleware**: 
    *   `Helmet` injects security headers.
    *   `express.json/urlencoded` parses the body (enforcing a 50MB limit).
    *   A correlation ID (`X-Request-ID`) is generated for distributed logging.
2.  **Global Guards**:
    *   `ThrottlerGuard`: Checks rate limits (e.g., max 100 requests / minute) using Redis.
    *   `JwtAuthGuard`: Validates Bearer tokens (unless the route is marked `@Public()`).
    *   `RolesGuard`: Verifies the user has the required permissions (e.g., `ADMIN`).
3.  **Validation Pipe**: `class-validator` ensures the incoming JSON payload matches the DTO (Data Transfer Object) exactly, stripping out malicious fields.
4.  **Controller (`src/api`)**: The specific controller method is invoked, mapping route parameters and body to function arguments.
5.  **Service (`src/logic`)**: The business logic executes.
6.  **Prisma Client**: The service queries PostgreSQL.
7.  **Global Exception Filter**: If any error is thrown (e.g., `NotFoundException`, DB constraint failure), the `GlobalExceptionFilter` intercepts it and formats it into a standardized JSON error response.

---

## 5. Extensibility & Design Patterns

### Dependency Injection (DI)
NestJS handles object lifecycle. Services are typically Singletons. If `ExperienceService` needs `PrismaService`, it is automatically injected via the constructor. This pattern makes unit testing trivial by allowing mock injections.

### The Adapter Pattern (e.g., Storage)
To remain "Generic", the backend does not hardcode storage mechanisms.
*   **Interface**: `IStorageAdapter` defines the contract (`uploadFile`, `deleteFile`, `getFileUrl`).
*   **Implementation**: `LocalDiskAdapter` implements this contract for VPS/Local hosting.
*   **Extensibility**: Adding cloud storage simply requires writing an `S3Adapter` that implements `IStorageAdapter` and updating the binding in `ContentModule`.

### Security Posture
*   **SSL/TLS**: The bootstrap process automatically looks for local `.pem` certificates to enable secure HTTPS in development, mirroring production behavior.
*   **CORS**: Securely configured to accept requests only from whitelisted frontend origins (or mobile apps).
*   **Helmet & Payload Limits**: Protects against cross-site scripting (XSS) and memory exhaustion (DOS) attacks.
