SpatialOS Implementation Specification: Infrastructure & Cloud Deployment

**Document ID:** 09_Infrastructure_&_Cloud_Deployment  
**Target Audience:** DevOps Engineers, System Administrators, Full-Stack Developers  
**Objective:** Define the continuous integration, runtime environment, hosting architecture, and edge asset delivery pipelines for a highly scalable production cluster.

---

## 1. High-Level Production Infrastructure Layout

To remain cost-effective while keeping core API latency well below 20ms, we separate standard stateful processes (Database) from stateless computing containers (Next.js/NestJS servers) and heavy objects (Videos, Glb assets).

```text
[ Incoming Web/Mobile Traffic ]
               │
               ▼
   [ AWS CloudFront / Cloudflare CDN ] ──(Cache Hit: Static Videos/Images)──> [ S3 Asset Bucket ]
               │
               ▼ (Cache Miss / API Operations)
    [ Nginx Reverse Proxy / SSL ]
               │
       ┌───────┴───────┐
       ▼               ▼
 [ NestJS API ] [ Next.js Admin ]
       │               │
       └───────┬───────┘
               ▼
   [ PostgreSQL + Redis Cluster ]
2. Containerization: Docker Configurations
We run independent micro-containers inside an isolated network mesh. This setup allows you to host everything on a single instance (like an AWS EC2 or DigitalOcean Droplet) for initial deployment, and easily move to Kubernetes as traffic climbs.

A. Core API Service Container Configuration
Developer Instruction: Place this file inside apps/backend-api/Dockerfile.

Dockerfile
# --- STEP 1: Build Layer ---
FROM node:20-alpine AS builder
WORKDIR /app

# Ingest workspace management files
COPY package*.json ./
COPY turbo.json ./
COPY apps/backend-api ./apps/backend-api
COPY packages/database ./packages/database
COPY packages/types ./packages/types

# Install dependencies and build files
RUN npm ci
RUN npx turbo run build --filter=backend-api

# --- STEP 2: Execution Layer ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend-api/dist ./dist
COPY --from=builder /app/packages/database/prisma ./prisma

EXPOSE 4000
CMD ["node", "dist/main.js"]
3. High-Performance Reverse Proxy Layout: Nginx
Nginx intercepts incoming public connections, manages safe SSL certification handshakes, forces HTTP-to-HTTPS redirect patterns, and maps incoming requests directly to internal Docker service layers.

Developer Instruction: Place this inside your server configuration path at /etc/nginx/sites-available/spatialos.conf.

Nginx
upstream backend_cluster {
    server 127.0.0.1:4000;
    keepalive 32;
}

upstream admin_dashboard {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name api.spatialos.com admin.spatialos.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.spatialos.com;

    ssl_certificate /etc/letsencrypt/live/[spatialos.com/fullchain.pem](https://spatialos.com/fullchain.pem);
    ssl_certificate_key /etc/letsencrypt/live/[spatialos.com/privkey.pem](https://spatialos.com/privkey.pem);

    # Performance Tuning Headers
    client_max_body_size 50M; # Accommodates large custom video uploads
    proxy_read_timeout 10s;
    proxy_connect_timeout 5s;

    location / {
        proxy_pass http://backend_cluster;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
4. Edge-Network Optimized CDN & Asset Architecture
Because your AR apps load heavy loop video frames and complex 3D graphic models right on the spot, you cannot stream assets directly from a database or a weak web app server. Doing so would crash your system under load.

Storage Isolation Mechanics
The Object Bucket Storage (AWS S3 or Supabase Storage): The Admin Dashboard uploads assets directly to a private cloud bucket.

The Distribution Cache Engine (AWS CloudFront / Cloudflare CDN): Public URLs point directly to edge locations. When a phone scans a target, the video streams from the closest regional edge node, achieving immediate media initialization without touching your primary database server.

Cache Expiry Rule Definitions
API Metadata Routes (/api/v1/scene): Capped to clear after 10 seconds or instantly invalidated through an Admin webhook call during code deployment.

Static Graphics Assets (.mp4, .png, .glb): Cached persistently for up to 365 days (Cache-Control: max-age=31536000, public). Because these files utilize unique random hash prefixes upon upload, they are completely safe from collision issues.

5. Automated CI/CD Deployment Script
Developer Instruction: Save this simple, reliable runner pipeline script in your root configuration workspace as deploy.sh to automate system code updates.

Bash
#!/bin/bash
set -e

echo "🚀 Initiating Automated Production Build Pipeline..."

# 1. Pull latest code modifications from production branch
git pull origin main

# 2. Re-install updated platform node dependencies safely
npm ci

# 3. Synchronize PostgreSQL database schema models using Prisma
echo "🔄 Synchronizing Database Schemas..."
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma

# 4. Compile system assets using Turbo pipeline rules
echo "📦 Compiling Container Workspaces..."
npx turbo run build

# 5. Recycle application container tasks smoothly
echo "⚙️ Hot-reloading Docker Micro-services..."
docker compose up -d --build backend-api admin-dashboard

# 6. Purge obsolete tracking data caches from memory store
echo "🧹 Flushing Redis Scene Cache Layer..."
redis-cli FLUSHALL

echo "✅ Deployment Process Completed Successfully!"

***

### Current Platform Architecture Matrix
With this infrastructure layer in place, your core architecture specification is complete. Every single phase of your development is mapped out:

* `01` System Organization & Structure
* `02` Database Entities Schema Configuration
* `03` Universal Core API Contract Definition
* `04` Data Translation Compiler Module
* `05` External Webhook Transaction Broker
* `06` Client Side Parser Implementation Model
* `07` Dynamic visual asset Web builder layout
* `08` Cryptographic anti-spoof system rules
* `09` Micro-services container & delivery hosting

The complete architectural foundation of your platform is now fully documented. What part of y