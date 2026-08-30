# SpatialOS Enterprise Production Rulebook
**Target Scale:** 500+ Concurrent AR Users
**Version:** 1.0.0

This document defines the strict architectural and operational rules that govern the SpatialOS backend and frontend development. No PR should be merged if it violates these rules.

---

## 1. Clean Architecture & Layer Separation
* **Controllers (`*.controller.ts`)**: Must ONLY receive HTTP requests, parse DTOs, call the Service layer, and return HTTP responses. Absolute zero business logic or database queries.
* **Services (`*.service.ts`)**: Contains all business logic, rules, and workflow orchestration. Must never access the database directly; must always go through a Repository.
* **Repositories (`*.repository.ts`)**: Contains all Prisma (`this.prisma`) calls. Must never contain business logic, handle HTTP requests, or access file storage directly.
* **Providers (`*.provider.ts`)**: Abstracts external infrastructure (Storage, Caching, Notifications).

## 2. Abstraction & Dependency Injection
* **Never instantiate external services manually** (e.g., `new S3Client()`).
* **Always use Interfaces for Infrastructure**: Inject external services using symbols (e.g., `I_STORAGE_PROVIDER`, `I_AUDIT_LOGGER`). This ensures `LocalStorageProvider` can be seamlessly swapped for `S3StorageProvider` without touching the Service layer.

## 3. Database Safety & Transactions
* **Strict Foreign Keys**: Avoid loose "String UUID" references (Polymorphic relations) without explicit background orphan sweeping or Prisma cascading limits.
* **Database Transactions (`$transaction`)**: MUST ONLY contain fast database operations. 
  * ❌ **NEVER** place external I/O (like file deletion, external API calls, or email sending) inside a `$transaction` block. This exhausts connection pools.
  * ✅ **ALWAYS** commit the transaction first, then perform the slow I/O asynchronously, or use a message queue.

## 4. Security & DDoS Protection
* **Rate Limiting**: `@nestjs/throttler` is globally enforced. Do not expose new endpoints without rate limiting considerations.
* **Payload Limits**: All media upload endpoints must strictly enforce MIME type validation and file size limits (10MB for images, 50MB for videos).
* **Secrets**: Never hardcode JWT secrets, database URLs, or API keys. Always use `.env` config validation.

## 5. Audit Logging
* Any action that alters data or security (Login, Create, Update, Delete, Upload, Expire) **must** be logged via `IAuditLogger`.
* Audit logs are permanently persisted in the `AuditLog` Postgres table for forensics. Do not bypass the logger.

## 6. Scaling Readiness (The "No Local State" Rule)
* As we scale to multiple backend instances behind a Load Balancer, the backend must remain **Stateless**.
* **Storage**: Local disk storage is deprecated for production V2. S3 or equivalent Object Storage must be used.
* **Cache**: In-memory `Map` caches must be replaced with `ICacheProvider` (Redis) when moving to a multi-node deployment.

## 7. Flutter Mobile Guidelines
* **State Management**: Use `Riverpod` exclusively. Ensure all providers are disposed (`autoDispose`) when not in use to prevent memory leaks during AR rendering.
* **Offline Resilience**: Do not block the UI if the network fails. Implement graceful degradation and stale-while-revalidate caching where possible.
* **Clean UI Layers**: Keep AR rendering widgets strictly separated from business logic and state fetching.

---
## 8. Flutter UI & Branding Standards
* **Typography**: Use `GoogleFonts.inter()` or a highly legible sans-serif font. Ensure clear hierarchy (Titles: 20-24 w700, Subtitles: 14-16 w400-w500).
* **Color Palette**: 
  * Strict Deep Space OLED Dark Mode (`Color(0xFF0F172A)` background). 
  * Success/Error specific colors (`AppColors.success`, `AppColors.error`).
  * Glass effect borders (`AppColors.glassBorder`).
* **Layout**: No fixed width/height containers containing dynamic text. Always use `Expanded`, `Flexible`, or `SingleChildScrollView`.
* **Reusability**: Extract duplicated widgets (TextFields, Glass Backgrounds) into `lib/shared/widgets/`. Theme colors MUST pull from `AppColors`.
* **AR Consistency**: The AR rendering engine MUST remain 100% identical between the Admin App and the User App. Do not change math/scaling on one without mirroring to the other.
* **App Icon**: `SPATIALOS LOGO1.png` is the universal app icon for all Flutter applications.

---
*Signed, Principal Architecture Team*
