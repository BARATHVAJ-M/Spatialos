# Storage & Media Handling

SpatialOS relies heavily on user-uploaded media (3D Models, Videos, Images) to construct AR experiences. Because file handling is inherently risky and highly dependent on infrastructure, the backend strictly isolates file I/O operations from core business logic using the **Adapter Pattern**.

---

## 1. The Generic Storage Architecture
The `ContentService` handles business validation (file size limits, magic-number checking) and database record creation (`ContentAsset`). However, it has absolutely no idea *how* or *where* files are actually saved.

Instead, it relies on an interface contract defined in `src/logic/storage/storage.interface.ts`:
```typescript
export interface IStorageAdapter {
  saveFile(file: Express.Multer.File, filename: string): Promise<string>;
  deleteFile(filename: string): Promise<void>;
  getFileStream(filename: string): Promise<ReadStream | StreamableFile>;
}
```

By injecting the string token `STORAGE_ADAPTER`, the backend achieves 100% decoupling. If the business decides to migrate from a local VPS to AWS tomorrow, developers simply write an `S3StorageAdapter` that implements this interface, and update the binding in `ContentModule.ts`. No other application logic needs to change.

---

## 2. The Local Disk Adapter
For default deployments, SpatialOS utilizes the `LocalDiskStorageAdapter`. 

*   **Directory Initialization**: Upon instantiation, the adapter checks if a `/storage` directory exists at the root of the project. If not, it uses `fs.mkdirSync(dir, { recursive: true })` to dynamically generate it.
*   **Multer Flexibility**: NestJS's Multer integration behaves differently depending on the operating system. Sometimes it passes a file completely in RAM (a Buffer), and sometimes it writes a temporary chunk to the OS temp folder. The adapter elegantly handles both scenarios, either writing the `file.buffer` to disk directly or using `fs.copyFile()` to move the temporary file.

---

## 3. Media Streaming & Proxying (`MediaController`)
Serving massive files (like 50MB 4K videos or dense 3D models) can quickly exhaust a Node.js server's RAM if handled improperly.

*   **Streaming**: The `MediaController` retrieves the file using the adapter's `getFileStream()` method. Instead of loading the entire file into memory with `fs.readFile()`, it pipes the file directly to the HTTP response socket using a NestJS `StreamableFile`. This keeps the memory footprint near zero, allowing a tiny VPS to serve thousands of concurrent video requests.
*   **Cryptographic Proxy**: 
    The frontend is never given the true physical file path (e.g., `https://api.com/storage/uuid-1234.mp4`). Instead, they request a hash (e.g., `https://api.com/media/a7f8b9...`). 
    The `MediaController` intercepts this request, looks up the hash in the database, extracts the true filename from the hidden JSON metadata, and securely streams the file. 
    This allows us to completely restructure the physical file system (or switch to cloud storage) without breaking any existing client URLs.

---

## 4. Upload Security & Path Traversal Prevention
Because we accept file uploads, the backend enforces strict defense-in-depth protections.

### Payload Limitations
The `ParseFilePipeBuilder` in the `ContentController` explicitly drops any request exceeding 50MB before it even reaches the service logic, mitigating memory exhaustion DoS attacks.

### Magic-Number Signature Validation
We do not trust file extensions. The `ContentService` reads the first few bytes (the magic numbers) of the incoming file buffer and validates them using the `file-type` library. If a `.jpg` extension is slapped onto a malicious executable, the byte signature mismatch will cause the backend to instantly delete the file.

### Local File Inclusion (LFI) Mitigation
When retrieving or deleting a file, the system must read a filename from the database or the client request. To prevent an attacker from supplying a string like `../../../../etc/passwd` to steal server secrets, the backend explicitly wraps the filename in Node's `basename(filename)` utility. This strips out all directory traversal characters, ensuring the adapter is locked safely inside the intended storage directory.
