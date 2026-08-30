# SpatialOS Cloud Brain (Backend)

The **Backend** is the central nervous system of SpatialOS. It provides the core APIs, spatial logic processing, and database synchronisation needed to map the real world and serve high-performance AR assets to end-users.

## 🚀 Technology Stack
- **Framework:** NestJS (TypeScript), Node.js
- **Database ORM:** Prisma
- **Database Engine:** PostgreSQL
- **Security:** bcrypt (Hashing), Stateless JWT Authentication, RBAC (Role-Based Access Control)

## 🏗️ Core Responsibilities

1. **Spatial Logic & State Management**
   Maintains the active "Scene Graph" (Places and Experiences) and ensures that spatial coordinates are precisely tracked and served to the mobile AR engine.
2. **Stateless Authentication**
   Implements highly secure, high-throughput JWT authentication, allowing AR clients and Dashboard administrators to authenticate with zero-latency overhead.
3. **Services API Engine**
   Acts as the central router for interactive AR Micro-Apps (e.g., Notice Boards, Menus, Information Kiosks), processing their CRUD operations and broadcasting state changes.
4. **Data Persistence**
   Securely stores physical world matrices, user identities, and metadata in PostgreSQL via Prisma.

## 💻 Development
```bash
# Install dependencies
npm install

# Push database schema
npx prisma db push

# Start the NestJS development server
npm run start:dev
```
Ensure you have configured your `.env` file with a valid `DATABASE_URL` (PostgreSQL connection string).
