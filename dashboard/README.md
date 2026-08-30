# SpatialOS Control Plane (Dashboard)

The **Dashboard** acts as the primary command center and operational control plane for SpatialOS. It provides a visual interface for administrators to map physical reality, deploy spatial experiences, and manage users.

## 🚀 Technology Stack
- **Framework:** Next.js 16 (App Router)
- **UI & Styling:** React, Tailwind CSS V4, Deep Space OLED Theme
- **State Management & Routing:** Next.js Server Components, React Hooks

## 🏗️ Core Responsibilities

1. **Reality Mapping & Places**
   Administrators can define "Places" (e.g., specific floors, rooms, or outdoor coordinates). Each Place serves as a bounded reality matrix where augmented experiences can be anchored.
2. **Experience Deployment**
   Through the Control Plane, operators construct AR "Experiences"—scene graphs containing 3D models, video layers, and interactive UI widgets—and push them to active Places.
3. **Queue & Publishing**
   A global Release Queue system allows admins to stage, review, and safely roll out new logic and assets to the physical world in real time.
4. **Identity & Authorization**
   Complete integration with the Backend via JWT-based authentication. Role-based access ensures only authorized architects can modify reality.

## 💻 Development
```bash
# Install dependencies
npm install

# Run the local development server
npm run dev
```
The dashboard runs securely against the SpatialOS backend API.
