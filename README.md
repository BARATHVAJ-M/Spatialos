<div align="center">
  <img src="https://raw.githubusercontent.com/unknown/spatialos/main/dashboard/public/logo.png" alt="SpatialOS Logo" width="120" height="120" />
  
  <h1>SpatialOS</h1>
  <p><em>Changing real world into interface.</em></p>
  
  <h3><b>"Pure Vision from the Pure Mind."</b></h3>
  
  <p>
    <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version 1.0.0" />
    <img src="https://img.shields.io/badge/team-Unknown-purple.svg" alt="Team Unknown" />
    <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License MIT" />
  </p>
</div>

---

## 🌍 About SpatialOS

**SpatialOS** is an advanced augmented reality (AR) operating system built to map, augment, and interface with physical reality. Developed entirely by **Team Unknown**, the platform allows administrators to deploy digital logic, interactive mini-apps, and visual rendering anchors into physical space, delivering them seamlessly to end-users traversing the real world. 

By binding traditional cloud microservices to physical GPS and local space matrices, we blur the line between software and physical architecture.

---

## 🏗️ Core Concepts & Global Architecture

SpatialOS abandons traditional 2D web architectures and relies on a "Spatial Canvas" model, defined by three global concepts:

### 📍 Places (Physical Anchors)
A **Place** is a mathematically mapped physical location in the real world (e.g., a university floor, an office room, a public square).
- Acts as the root geographical bounding box.
- Handles coordinate transformations, origin mapping, and physical state synchronization.
- Powered by high-contrast QR visual anchors and continuous spatial tracking.

### 🌌 Experiences (The Scene Graph)
An **Experience** is the spatial application logic bound to a Place.
- Acts as a dynamic "Scene Graph" consisting of Spatial Nodes (X, Y, Z coordinates).
- Admins can inject 3D Models, Video Planes, and interactive UI Widgets into this graph.
- Experiences are hot-swappable, version-controlled, and feature an emergency "Rollback" system to instantly revert real-world states.

### ⚙️ Services (Interactive Micro-Apps)
A **Service** is a self-contained, interactive digital widget injected into an Experience's Spatial Node.
- Rather than rendering static text, Services fetch live data, process user inputs, and sync across the cloud.
- Example: A **Notice Board** service hovering in a hallway that broadcasts university announcements in real-time.

---

## 💻 Technology Stack

SpatialOS is a massive monorepo divided into three highly optimized core modules:

### 1. `dashboard/` (Control Plane)
The web-based Admin Control Plane where operators construct and deploy reality.
- **Framework:** Next.js 16 (App Router), React
- **Design System:** Deep Space OLED Dark Mode, Tailwind CSS V4, Google Fonts (Nunito)
- **Features:** 2D-to-3D Spatial Visual Editor, Global Release Queue, Real-time JWT Logging, Secure API integration.

### 2. `backend/` (The Cloud Brain)
The centralized logic engine processing spatial geometry, authentication, and database synchronisation.
- **Framework:** NestJS (TypeScript), Node.js
- **Database:** PostgreSQL (via Prisma ORM)
- **Security:** bcrypt password hashing, stateless JWT authentication, secure media streaming, comprehensive Audit Ledger.

### 3. `user_app/` (The AR Engine)
The mobile Augmented Reality engine that renders the SpatialOS environment to the user.
- **Framework:** Flutter (Dart)
- **Features:** High-performance Frame-Rate optimization (Binary State Caching), Real-time QR Spatial calibration, immersive 3D/Video rendering planes.

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- PostgreSQL (Running locally or via Docker)
- Flutter SDK (for mobile compilation)

### 1. Spin up the Backend
```bash
cd backend
npm install
# Configure your .env with PostgreSQL connection strings
npx prisma db push
npm run start:dev
```

### 2. Launch the Dashboard
```bash
cd dashboard
npm install
npm run dev
# The Control Plane is now active on localhost:3000
```

### 3. Compile the AR Engine
```bash
cd user_app
flutter pub get
flutter run
```

---

---
<div align="center">
  <p>Built with precision by <b>Team Unknown</b></p>
</div>
