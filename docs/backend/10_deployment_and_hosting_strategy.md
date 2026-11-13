# Deployment & Hosting Strategy

SpatialOS is designed with a "Stateless Node" architecture. This means the NestJS application itself holds no persistent data in its memory. All state is pushed to PostgreSQL (Data) or Redis (Cache). 

Because of this strict architectural choice, the backend can be hosted on a single $5/month VPS or scaled instantly across a massive Kubernetes cluster without modifying a single line of business logic.

---

## 1. The Generic Hosting Philosophy
We intentionally avoid vendor lock-in.
*   Instead of AWS DynamoDB, we use generic **PostgreSQL**, which can run anywhere.
*   Instead of hardcoding AWS S3 SDKs, we use the **`IStorageAdapter`** interface.
*   Instead of proprietary cloud build pipelines, we use standard **Docker** multi-stage builds.

This guarantees that a university can host SpatialOS entirely on their internal rack servers for maximum privacy, while an enterprise can deploy it to AWS for global scale.

---

## 2. Tier 1: Single VPS Deployment (The MVP)
For startups, small campuses, or beta testing, SpatialOS can run entirely on a single Virtual Private Server (VPS) like a DigitalOcean Droplet, AWS EC2 instance, or Hetzner server.

**The `docker-compose` Strategy**:
Instead of installing Node and Postgres manually on the server, the entire stack is run via `docker-compose.yml`.
1.  **Node API Container**: Runs the compiled `/dist` output.
2.  **PostgreSQL Container**: Runs the database. Data is persisted to a Docker Volume so it survives container restarts.
3.  **Local Storage**: The `LocalDiskAdapter` is utilized. The `/storage` folder inside the Node container is mapped (bind-mounted) to a physical folder on the VPS hard drive.
4.  **Reverse Proxy**: A container running Nginx or Caddy sits at the edge, terminating SSL (HTTPS via Let's Encrypt) and forwarding traffic to the internal Node API port (3001).

*Cost footprint: Extremely low. Architecture footprint: Highly portable.*

---

## 3. Tier 2: Scalable Cloud Architecture (Enterprise)
When traffic grows to thousands of concurrent AR scans, a single server will bottleneck on CPU or disk I/O. The architecture seamlessly transitions to a distributed model.

1.  **Stateless API Nodes**: The single Node container is replicated across multiple servers (or Kubernetes Pods). A Cloud Load Balancer (e.g., AWS ALB) distributes incoming HTTP requests across all nodes round-robin.
2.  **Managed Database**: The Dockerized PostgreSQL container is removed. Instead, the backend connects to a managed, highly available database cluster (like AWS RDS or Google Cloud SQL) with automatic backups and read-replicas.
3.  **Cloud Storage Transition**: A single VPS hard drive cannot store terabytes of 3D models.
    *   The `STORAGE_ADAPTER` token in `ContentModule.ts` is switched from `LocalDiskStorageAdapter` to `S3StorageAdapter`.
    *   The Node API now pushes all incoming file buffers directly to AWS S3.
    *   Media streaming is offloaded from the Node API to a Content Delivery Network (CDN) like AWS CloudFront, instantly accelerating global AR load times.

---

## 4. Continuous Integration / Continuous Deployment (CI/CD)
To maintain code quality and deployment velocity, manual FTP uploads are forbidden. All deployments must flow through a CI/CD pipeline (e.g., GitHub Actions).

**Standard Pipeline Flow**:
1.  **Push**: A developer merges a PR into the `main` branch.
2.  **Test**: The CI server spins up an isolated container and runs `npm run test` (Jest unit tests) and ESLint to guarantee code quality.
3.  **Build**: If tests pass, the CI server builds the multi-stage Alpine Docker image.
4.  **Publish**: The resulting lean image is pushed to a secure registry (like Docker Hub or AWS ECR).
5.  **Deploy**: 
    *   For Tier 1: A webhook triggers the VPS to run `docker pull` and restart the compose stack.
    *   For Tier 2: The Kubernetes cluster performs a rolling update, spinning up the new containers and shutting down the old ones with zero downtime.
6.  **Migrate**: During the boot sequence, the deployment orchestrator executes `npx prisma migrate deploy` to safely apply any new SQL schema changes before accepting traffic.
