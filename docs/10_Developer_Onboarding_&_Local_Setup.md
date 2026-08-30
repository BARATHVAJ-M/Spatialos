rkdown
# SpatialOS Implementation Specification: Developer Onboarding & Local Setup

**Document ID:** 10_Developer_Onboarding_&_Local_Setup  
**Target Audience:** All Software Engineers (Full-Stack, Mobile, DevOps)  
**Objective:** Provide the exact step-by-step runbook to clone the SpatialOS monorepo, bootstrap the local environment, seed the database, and test the AR Engine against `localhost`.

---

## 1. System Prerequisites

Before pulling the codebase, ensure your local development machine has the following installed:
* **Node.js** (v20 LTS or higher)
* **Docker Desktop** (For spinning up local PostgreSQL & Redis)
* **Git**
* **Mobile Device:** iOS (ARKit compatible) or Android (ARCore compatible) for physical testing.
* **Ngrok:** (Required to expose your `localhost` to your mobile phone over cellular/Wi-Fi).

---

## 2. Repository Initialization

Clone the monorepo and install the dependencies. We use Turborepo to manage the packages.

```bash
# 1. Clone the repository
git clone [https://github.com/your-org/spatialos-monorepo.git](https://github.com/your-org/spatialos-monorepo.git)
cd spatialos-monorepo

# 2. Install all dependencies across all workspaces
npm install
3. Environment Configuration
You must define the local environment variables for the Backend and the Admin Dashboard.

Create a .env file in the root of apps/backend-api/:

Code snippet
# --- SPATIALOS LOCAL ENVIRONMENT ---

# 1. Database Connections
DATABASE_URL="postgresql://postgres:spatialos_dev@localhost:5432/spatialos?schema=public"

# 2. Security & Auth
JWT_SECRET="local_dev_jwt_secret_998877"
SPATIALOS_QR_SECRET="local_qr_signing_secret"

# 3. Server Config
PORT=4000
NODE_ENV="development"
4. Bootstrapping the Local Database
Instead of installing PostgreSQL on your Mac/Windows machine manually, use the provided Docker Compose file to spin up an isolated database container.

Bash
# 1. Start PostgreSQL & Redis locally
docker-compose -f docker-compose.dev.yml up -d

# 2. Push the Prisma Schema to the empty database (From Doc 02)
npx prisma db push --schema=packages/database/prisma/schema.prisma

# 3. Generate the Prisma Client types
npx prisma generate
The Database Seeder
To test the AR app, you need data. Run the Prisma seeder to automatically create a test Organization, an Admin User, a Place (QR_DEV_01), and a basic Experience.

Bash
# 4. Run the seed script
npx ts-node packages/database/prisma/seed.ts
Output: ✅ Successfully seeded local database. Dev QR ID: QR_DEV_01

5. Starting the Monorepo (The "Dev" Command)
Because we use a Monorepo, you do not need to open multiple terminals. Turborepo will start the Backend API and the Admin Dashboard simultaneously.

Bash
# Start all apps in development mode with Hot-Module Replacement (HMR)
npm run dev
What happens now:

The NestJS Backend boots up on http://localhost:4000

The Next.js Admin Dashboard boots up on http://localhost:3000

Any changes to packages/types will instantly type-check across both apps.

6. Mobile AR Client Testing (The Ngrok Tunnel)
Your mobile phone cannot connect to localhost:4000 easily, especially over different Wi-Fi networks. To test the AR Engine on a real device, you must expose your local backend to the internet securely.

Bash
# 1. Open a new terminal and run Ngrok on the backend port
ngrok http 4000
Ngrok will give you a public URL (e.g., https://8a7b-99-12-33.ngrok.io).

On your Mobile AR Codebase:

Open your AR project (SwiftUI / Unity).

Change the SPATIALOS_BASE_URL from production to your Ngrok URL.

Build and run the app on your physical phone.

The "Day 1" Test Flow:
Open your browser to http://localhost:3000 (Admin Dashboard).

Log in using the seeded credentials (admin@spatialos.dev).

Open the Visual Builder and drag a "Button" onto the screen. Click "Save".

Open the AR App on your phone.

Point the phone camera at a printed QR code containing QR_DEV_01.

Success: The button you just dragged on your web browser should instantly appear floating in AR on your phone!

7. Developer Guidelines & PR Rules
When contributing to SpatialOS, you must follow these strict architectural rules:

Never modify the AR Engine to add business logic. If a feature requires an if/else statement regarding a specific industry (e.g., if (isHospital)), that logic belongs in the Backend Action Broker (Doc 05), never the client.

Type Safety is Mandatory. If you add a new UI element (e.g., a "Slider"), you must first define it in packages/types/scene-graph.ts. The build will fail if the frontend and backend contracts do not match.

Database Migrations: Never alter the database schema without generating a Prisma migration. Run npx prisma migrate dev --name added_new_table to ensure the production deployment script (Doc 09) can upgrade the DB safely.


***

### 🎯 Mission Accomplished.

You now possess the complete, 10-part master blueprint for the **SpatialOS Platform**. 

From the conceptual architecture down to the exact terminal commands needed to start coding on Day 1, you have everything required to hand this off to a team of developers and say, *"Build it exactly like this."*

Is there anything else regarding the system architecture, product strategy, or technical design you w