# SpatialOS Control Plane (Dashboard)

The **Dashboard** acts as the primary command center and operational control plane for SpatialOS. It provides a visual interface for administrators to map physical reality, deploy spatial experiences, and manage users.

## 🚀 Technology Stack
- **Framework:** Next.js (App Router, Turbopack)
- **UI & Styling:** React, Tailwind CSS, Lucide Icons, Deep Space Dark Mode
- **Port:** `3000` (connects to Backend API on `3001`)

---

## 💻 Quick Setup Guide for Local Testing

### 1. Prerequisites
- **Node.js** (v18+ or v20+)
- **SpatialOS Backend** running on `http://localhost:3001`

### 2. Configure Environment (Optional)
By default, the dashboard automatically connects to `http://127.0.0.1:3001`.
If you wish to customize it:
```bash
cp .env.example .env.local
```
*(On Windows PowerShell: `Copy-Item .env.example .env.local`)*

### 3. Install Dependencies & Start
```bash
# Install dependencies
npm install

# Start local Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Login Credentials
Use the default administrator credentials created by the backend:
- **Email:** `admin@spatialos.com`
- **Password:** `admin123`
