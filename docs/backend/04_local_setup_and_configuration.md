# Local Setup & Configuration

## 1. Prerequisites & Environment Variables
Before running the SpatialOS backend, developers must ensure the following are installed:
*   **Node.js** (v20+ recommended)
*   **PostgreSQL** (Running locally or via cloud provider)

### The `.env` Configuration
The system relies on a `.env` file at the root of the backend directory. Developers should copy `.env.example` to `.env` and configure it:

*   `DATABASE_URL`: The Prisma connection string pointing to the PostgreSQL instance.
*   `JWT_SECRET`: A highly secure random string used to cryptographically sign authentication tokens. Must be kept secret.
*   `BOOTSTRAP_ADMIN_EMAIL` & `BOOTSTRAP_ADMIN_PASSWORD`: Used by the `SeedService` during the very first server boot to automatically provision the master administrator account.

---

## 2. The Development Server Orchestrator (`setup_dev_server.ps1`)
Because SpatialOS involves an AR mobile application interacting with a local laptop backend, standard `npm run start` commands often fail due to Windows firewall blocking local Wi-Fi packets (resulting in `errno = 113 No route to host` on the phone).

To solve this, we provide a custom PowerShell bootstrapper (`setup_dev_server.ps1`). It performs 4 critical tasks:

1.  **Firewall Injection**: It checks for a Windows Defender rule named `SpatialOS_LAN_Port_3000`. If missing, it requests UAC elevation to inject a TCP Port 3000 Allow Rule, permanently unblocking mobile testing on the LAN.
2.  **Port Cleanup**: It detects if a previous Node session crashed and left Port 3000 occupied. If so, it aggressively kills the orphaned process to prevent `EADDRINUSE` errors.
3.  **LAN IP Detection**: It scans network adapters, filters out loopbacks and VMs, and extracts the active physical Wi-Fi IPv4 address. It prints this to the console (e.g., `https://192.168.1.6:3000`) so the developer knows exactly what URL to paste into the mobile app's API configuration.
4.  **Launch**: It finally executes `npm run start:dev` to boot NestJS with hot-reloading.

*Usage: Right-click `setup_dev_server.ps1` -> Run with PowerShell.*

---

## 3. Database Initialization & Seeding
Once the PostgreSQL server is running and the `.env` file is configured:

1.  **Push the Schema**: Run `npx prisma migrate dev` to sync the database schema.
2.  **Automatic Seeding**: The backend's `SeedService` runs automatically during bootstrap (in `main.ts` or via `AppModule`). It queries the `User` table; if no users exist, it securely hashes the `BOOTSTRAP_ADMIN_PASSWORD` and creates the master organization and admin account.

---

## 4. Docker Containerization Strategy
For production deployments, the backend utilizes a highly optimized, multi-stage Alpine Dockerfile.

### Stage 1: The Builder (`node:20-alpine`)
*   Copies all source code and `package.json`.
*   Runs `npm ci` to install *all* dependencies (including massive development tools like TypeScript compilers, Jest, and ESLint).
*   Executes `npx prisma generate` to build the query engine.
*   Executes `npm run build` to compile the TypeScript source down into raw JavaScript inside the `/dist` folder.

### Stage 2: The Production Image (`node:20-alpine`)
*   Starts completely fresh.
*   Copies *only* the compiled `/dist` folder and `prisma` schema from the Builder stage.
*   Runs `npm ci --only=production`. This explicitly ignores `devDependencies`, ensuring heavy tools like Jest and ESLint are not shipped.
*   **Security & Size**: This strategy reduces the final Docker image size by hundreds of megabytes and minimizes the attack surface area.
*   **Local Storage Fallback**: The Dockerfile executes `RUN mkdir -p storage`. This ensures that if the system is configured to use the `LocalDiskAdapter` instead of S3, the generic disk writer won't crash due to a missing target directory inside the container.
