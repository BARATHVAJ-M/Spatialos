# SpatialOS User Application (`user_app`)

## Overview
**SpatialOS User** is the dedicated public-facing viewer mobile application for the SpatialOS Real-Time Augmented Reality (AR) ecosystem. Built on Flutter and powered by Riverpod state management, this application enables end users to scan physical QR Anchor locations and instantly view high-fidelity 3D AR content (Images, Wall Notes, and Looping Videos) anchored in real-world space.

---

## 🔒 Security & Public Hardening Architecture
Because this application is intended for public consumption and distribution, rigorous defense-in-depth security principles have been architected into every layer:

### 1. Zero-Privilege Sandbox & View-Only Enforcement
- **No Write Authority**: Unlike the `admin_app`, `user_app` entirely strips out object manipulation controls (translation, rotation handles, deletion commands, media upload routes).
- **Role-Based Access Control (RBAC)**: All accounts created through the registration modal are automatically assigned the strictly unprivileged `USER` role at the backend database layer. Even if an attacker interrogates the API endpoints with a user token, the backend denies modifying actions with `403 Forbidden`.

### 2. Network & Storage Protection
- **JWT Bearer Authentication**: Every request made after sign-in transmits an encrypted JSON Web Token (JWT) in the headers via an interceptor pattern (`ApiService`).
- **Encrypted Token Persistence**: Sensitive authorization tokens are never saved to plain-text shared preferences. They are securely held inside Android KeyStore / iOS Keychain utilizing `flutter_secure_storage`.
- **Sanitized QR Resolution**: When scanning real-world barcodes, input strings are evaluated against strict structural matching (`LOC-xxxx`) before reaching network handlers, mitigating malicious code injection or arbitrary URL forwarding attempts.
- **Timeout Protection & Rate Limiting**: Network connectors employ 10-second connect and read timeout bounds to protect user devices against slowloris Denial of Service (DoS) conditions or unresponsive server IP addresses.

---

## 💻 Local Development & Laptop-As-Server Testing
For current prototype evaluation without paying high cloud hosting fees, the app natively supports local Wi-Fi LAN routing where your computer acts as the live server.

### Setup Instructions:
1. **Start Backend Server**: Ensure your NestJS backend is running on your computer at Port 3000 (`npm run start:dev` inside `backend/`).
2. **Verify Same Network**: Ensure both your laptop and Android testing mobile device are connected to the exact same Wi-Fi network or mobile hotspot.
3. **Open Windows Defender Firewall**: Run the provided PowerShell helper script on your computer (`setup_dev_server.ps1`) to allow incoming traffic on TCP Port 3000.
4. **Configure Address in App**:
   - Launch **SpatialOS User**.
   - On the Login screen or inside **Profile -> General Setting**, click the **Server** address button.
   - Enter your laptop's IPv4 address (e.g., `http://192.168.1.6:3000`).
   - Click **Save & Connect**.

---

## 🎨 UI & Design Philosophy (ChatGPT Monochrome Theme)
- **Minimalist Aesthetic**: Features a clean, high-contrast dark charcoal and white palette (`#171717` background, `#ECECF1` typography) directly inspired by ChatGPT interfaces, avoiding excessive color clutter or visually overwhelming elements.
- **Stable 2D/3D AR Projection**: Decouples spatial matrix roll and scale from unwanted camera sensor shaking, ensuring pinned AR wall paintings, notes, and MP4 video screens remain perfectly stationary on the physical target.

---

## 📱 Build & Distribution
To compile the self-contained Release Android binary (`SpatialOS user.apk`):
```bash
cd user_app
flutter build apk --release
```
The compiled release artifact will be saved to `build/app/outputs/flutter-apk/app-release.apk` and copied out to the master project folder as `SpatialOS user.apk`.
