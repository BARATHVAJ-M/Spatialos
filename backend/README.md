# SpatialOS Cloud Brain (Backend)

The **Backend** is the central nervous system of SpatialOS. It provides the core APIs, spatial logic processing, and database synchronization needed to map the real world and serve high-performance AR assets to end-users.

## 🚀 Technology Stack
- **Framework:** NestJS (TypeScript), Node.js
- **Database ORM:** Prisma
- **Database Engine:** PostgreSQL
- **Security:** bcrypt (Hashing), Stateless JWT Authentication, RBAC (Role-Based Access Control)
- **Port:** `3001` (to run alongside Dashboard on `3000`)

---

## 💻 Quick Setup Guide for Local Testing

### 1. Prerequisites
- **Node.js** (v18+ or v20+)
- **PostgreSQL** running locally on port 5432 (e.g., via pgAdmin, Docker, or native installer)

### 2. Configure Environment
Copy the example environment file:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Open `.env` and verify your PostgreSQL credentials in `DATABASE_URL`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/spatialos?schema=public"
```

### 3. Install Dependencies & Push Schema
```bash
# Install dependencies
npm install

# Push Prisma schema to your PostgreSQL database
npm run prisma:push
```

### 4. Start Development Server
```bash
npm run start:dev
```
- **Backend API:** `http://localhost:3001`
- **Swagger Docs:** `http://localhost:3001/api/docs`
- **Default Super Admin:** Auto-created on startup:
  - **Email:** `admin@spatialos.com`
  - **Password:** `admin123`

---

## 📱 Mobile App Connection Notice
If testing with a mobile device on the same local Wi-Fi:
1. Allow port `3001` in your Windows Firewall:
   ```powershell
   netsh advfirewall firewall add rule name="SpatialOS Backend 3001" dir=in action=allow protocol=TCP localport=3001
   ```
2. Find your local IP (`ipconfig`, e.g., `192.168.1.15`).
3. In the mobile app, tap the top-bar **DNS icon** and point it to: `http://192.168.1.15:3001`.
