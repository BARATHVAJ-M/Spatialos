# SpatialOS V1: Master System Design & Development Blueprint

**Document ID:** 00_Master_Blueprint
**Current State:** We possess a functioning AR Engine (handles QR tracking, anchors, and rendering Image/Video/Text), a basic Admin App, and a User App.
**Target State:** To build the "Spatial Abstraction Middleware" so the AR Engine becomes completely "dumb" (data-driven) and generic, capable of serving any industry via dynamic JSON payloads without rewriting app code.

---

## 1. The Core Engineering Philosophy
To achieve a highly scalable platform, we must follow these three rules:
1. **The "Dumb" AR Engine:** The AR App must contain **zero** business logic. It does not know what a "Canteen" or "College" is. It only knows how to read a JSON file and render UI/3D elements at specific `(X, Y, Z)` coordinates.
2. **Data-Driven UI (Server-Driven UI):** Forms, buttons, and text are not hardcoded in the mobile app. The Admin Dashboard generates a JSON layout, and the mobile app simply draws it.
3. **Decoupled Actions:** When a user taps a button in AR, the AR Engine simply fires an event back to the backend: `{"action": "BUTTON_TAP", "id": "btn_01"}`. The backend decides what that tap means (e.g., booking a room, ordering food).

---

## 2. Master System Architecture (The "Glue")

Since the frontend and rendering are done, the development focus is entirely on the **Backend APIs & Data Contracts**.

```text
[ ADMIN APP ] ──(Creates Data)──> [ SPATIALOS BACKEND ] ──(Compiles JSON)──> [ USER AR APP ]
                                        │                                          │
    1. Defines Place (QR Target)        │ 1. Maps QR to Experience                 │ 1. Scans QR
    2. Links Content (Video/Img)        │ 2. Validates User Auth                   │ 2. Fetches Payload
    3. Sets Coordinates (X,Y)           │ 3. Generates the 'Scene Graph' Payload   │ 3. Renders AR Scene
    4. Creates Buttons/Forms            │                                          │ 4. Sends Tap Events