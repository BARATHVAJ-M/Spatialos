# Coding Standards & Patterns

This document defines the strict architectural and coding patterns enforced in the SpatialOS backend. All developers contributing to the repository must adhere to these standards to ensure the codebase remains maintainable, secure, and highly scalable.

---

## 1. The Modular Architecture (NestJS)
SpatialOS avoids monolithic logic blobs. Every distinct business domain (e.g., Auth, Content, Experiences) must be encapsulated within its own NestJS `@Module()`.

*   **Boundary Enforcement**:
    *   `src/api/` contains **Controllers**. Controllers are strictly responsible for parsing HTTP requests, applying DTO validation, and returning HTTP responses. They must contain zero business logic.
    *   `src/logic/` contains **Services**. Services execute business rules and database queries. They must be completely unaware of the HTTP context (they do not take Express `req` or `res` objects as parameters).
*   **Module Linkage**:
    Modules explicitly declare what they own and what they share. For instance, the `ContentModule` registers the `ContentController` and `ContentService`. If another module needs to upload files, it must import `ContentModule`, and `ContentModule` must explicitly export `ContentService` in its `exports` array.

---

## 2. Dependency Injection (DI) & Singletons
We strictly utilize the NestJS Inversion of Control (IoC) container.

*   **Constructor Injection**: Services request their dependencies via their constructor.
    ```typescript
    constructor(private readonly prisma: PrismaService) {}
    ```
*   **The "No `new`" Rule**: Developers must **never** manually instantiate a service class using the `new` keyword (e.g., `const service = new ContentService()`). Bypassing the DI container breaks singleton state, makes unit testing incredibly difficult, and creates tight coupling.

---

## 3. The Adapter Pattern (Storage Decoupling)
To ensure SpatialOS remains generic and can be deployed anywhere (from a cheap local VPS to enterprise AWS), we aggressively decouple external side-effects using the Adapter Pattern.

*   **The Interface**: We define a strict contract, e.g., `IStorageAdapter` in `src/logic/storage/storage.interface.ts`.
*   **The Binding**: In the `ContentModule`, we use a custom provider to bind an implementation to that interface token:
    ```typescript
    {
      provide: STORAGE_ADAPTER,
      useFactory: () => {
        // Here we can dynamically return S3StorageAdapter() or LocalDiskStorageAdapter()
        return new LocalDiskStorageAdapter(); 
      },
    }
    ```
*   **The Injection**: The service injects the token, remaining blissfully unaware of where the file is actually being written:
    ```typescript
    constructor(@Inject(STORAGE_ADAPTER) private readonly storageAdapter: IStorageAdapter) {}
    ```

---

## 4. Defensive Programming & Security Checks
Because SpatialOS acts as a CMS allowing user uploads, defensive programming is mandatory. We never trust client input.

### MIME Spoofing Prevention
A malicious user could rename a `virus.exe` file to `cute-cat.jpg` to bypass standard Multer extensions checks. Our backend goes a step further:
Inside `content.service.ts`, we utilize the `file-type` library to read the raw hexadecimal bytes (the "magic numbers") of the uploaded file's buffer. If the physical byte signature does not match a valid image/video format, the file is immediately securely deleted from the disk and an exception is thrown.

### Cryptographic File Proxying
We do not store or serve files using predictable auto-incrementing IDs or their original user-provided filenames (which could contain directory traversal attacks).
1.  Files are saved to disk using a randomly generated UUID (`uuidv4()`).
2.  The public URL served to the API client is a completely detached cryptographic hash (`/media/a7f8b9...`).
3.  The database `ContentAsset` record maps this hash back to the physical UUID on disk. 
This guarantees that an attacker cannot sequentially scrape the `/media/1`, `/media/2` endpoints to steal proprietary organizational assets.
