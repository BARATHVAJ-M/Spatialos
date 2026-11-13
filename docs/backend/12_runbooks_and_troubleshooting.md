# Runbooks & Troubleshooting

This document is the first responder's guide to fixing a broken SpatialOS backend. It contains immediate, copy-pasteable solutions for the most common deployment, database, and local testing failures.

---

## 1. Database Connection Exhaustion
**Symptom:**
The API responds with a generic `Internal server error` (Status 500). When checking `docker logs spatialos_api`, you see:
> `PrismaClientInitializationError: Error querying the database: too many clients already`

**Cause:**
PostgreSQL has a hard limit on simultaneous connections (default usually 100). If traffic spikes, or if the NestJS app is repeatedly restarting without closing Prisma connections, the pool exhausts.

**Solution (Immediate Recovery):**
1. Restart the API container to forcefully drop orphaned connections:
   ```bash
   docker restart spatialos_api
   ```
2. **Long-Term Fix:** If deploying to a massive production environment, do not connect Prisma directly to PostgreSQL. Instead, deploy **PgBouncer** in front of the database and append `?pgbouncer=true` to the `DATABASE_URL`.

---

## 2. Missing Environment Variables
**Symptom:**
The Node server instantly crashes on boot. Docker logs show:
> `Nest can't resolve dependencies of the...` or `PrismaClientInitializationError: Environment variable not found: DATABASE_URL`

**Cause:**
Critical `.env` values are missing. The backend strictly requires configuration to boot.

**Solution:**
1. Check that the `.env` file exists in the root of `/backend`.
2. Compare your `.env` against the `.env.example` file.
3. Ensure the two most critical keys exist:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/spatialos"
   JWT_SECRET="a-very-long-cryptographically-secure-random-string"
   ```

---

## 3. Docker Port Collisions
**Symptom:**
Running `docker-compose up -d` fails instantly with:
> `Error starting userland proxy: Bind for 0.0.0.0:3001 failed: port is already allocated.`

**Cause:**
Another service on your host machine (or a zombie Node.js process) is already listening on port 3001.

**Solution (Linux/Mac):**
1. Find the PID blocking the port:
   ```bash
   lsof -i :3001
   ```
2. Kill the process:
   ```bash
   kill -9 <PID>
   ```

**Solution (Windows PowerShell):**
1. Find the PID:
   ```powershell
   netstat -ano | findstr :3001
   ```
2. Kill the process:
   ```powershell
   taskkill /PID <PID> /F
   ```

---

## 4. Storage Directory Permission Errors
**Symptom:**
Users try to upload a 3D model, and the frontend shows an error. The backend logs show:
> `EACCES: permission denied, mkdir '/storage'`

**Cause:**
When using `LocalDiskStorageAdapter` via Docker Compose, the mapped `/storage` volume on the host OS does not grant write permissions to the Node user running *inside* the Docker container.

**Solution:**
Grant write access to the physical storage folder on the host machine.
```bash
sudo chown -R 1000:1000 ./backend/storage
sudo chmod -R 775 ./backend/storage
```

---

## 5. Flutter "Connection Refused" (Local Testing)
**Symptom:**
The backend is running perfectly on your laptop. Postman tests succeed. But when you build the Flutter app to a physical Android/iOS device and attempt to login, the app throws a `Connection Refused` or timeout error.

**Cause:**
1. **Localhost trap:** The Flutter app is trying to reach `http://localhost:3001`. On a phone, `localhost` means the phone itself, not your laptop.
2. **Windows Firewall:** Your PC is blocking incoming traffic from the LAN router.

**Solution:**
Do not run the backend manually via `npm run start`. Always use the provided automation script.
1. Run `.\setup_dev_server.ps1` from PowerShell as Administrator.
2. The script will automatically:
   - Punch a hole in Windows Firewall for Node.js on port 3001.
   - Detect your true LAN IPv4 address (e.g., `192.168.1.15`).
   - Inject that IP into the Flutter configuration file so the physical phone knows exactly where to route traffic.
