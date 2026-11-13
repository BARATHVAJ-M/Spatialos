# Auth & Security

This document details the robust security mechanisms protecting the SpatialOS backend. It explains cryptographic practices, brute-force mitigation, and Role-Based Access Control (RBAC).

---

## 1. Registration & OTP Verification
The backend strictly adheres to industry standards for storing user credentials and verifying identities.

*   **Password Cryptography**: Passwords are never stored in plain text. Upon registration or password reset, the backend automatically generates a unique salt and applies a `bcrypt` hash (10 rounds). This ensures that even in the event of a catastrophic database leak, passwords cannot be easily reversed.
*   **OTP Generation**: Verification codes (used for email verification and password resets) are generated using Node's `crypto.randomInt(100000, 1000000)`. This cryptographically secure pseudo-random number generator (CSPRNG) prevents attackers from predicting the next generated OTP (unlike the vulnerable `Math.random()`).
*   **OTP Expiration**: Verification codes are strictly time-bound (e.g., 24 hours for registration, 15 minutes for password resets).

---

## 2. Login, Lockouts & Brute Force Protection
To prevent credential stuffing and brute-force password guessing, `auth.service.ts` implements aggressive lockout logic directly at the database level.

*   **The 5-Strike Rule**: The system tracks `loginAttempts`. If a user enters an incorrect password 5 consecutive times (`MAX_LOGIN_ATTEMPTS`), their account is completely locked.
*   **Temporary Ban**: The `lockedUntil` timestamp is set to 15 minutes in the future (`LOCKOUT_DURATION_MS`). Any login attempts made before this timestamp expires are instantly rejected with an `UnauthorizedException`, even if the attacker happens to guess the correct password during the lockout period.
*   **OTP Lockouts**: A similar protective mechanism is applied to the OTP verification endpoints. After 3 failed OTP entries, the account is locked from attempting verification for 24 hours.

---

## 3. API Rate Limiting (Throttling)
While account lockouts protect specific users, Rate Limiting protects the server infrastructure from Denial of Service (DoS) attacks.

*   Sensitive endpoints in the `AuthController` utilize the `@Throttle()` decorator.
*   **Example**: The `@Post('login')` route limits requests to 5 hits per 15 minutes (`ttl: 900000`) per IP address.
*   **Example**: The `@Post('forgot-password')` route is further restricted to 3 hits per 15 minutes per IP address to prevent malicious actors from spamming a target's inbox with reset codes.

---

## 4. Role-Based Access Control (RBAC) & Guards
Access to API endpoints is strictly regulated using NestJS Guards and Decorators.

*   **The Global Default**: By default, the `JwtAuthGuard` intercepts requests, meaning a valid Bearer token is required to access the API.
*   **Bypassing the Guard**: Endpoints that must be accessible to unauthenticated users (like login, register, and password resets) must explicitly use the `@Public()` decorator.
*   **Enforcing Roles**: Endpoints can restrict access based on the role encoded inside the verified JWT token. For example, applying `@Roles('ADMIN')` to a controller route guarantees that only administrators can execute that function, regardless of whether a standard user has a valid JWT token.

---

## 5. Forensic Audit Logging
To ensure enterprise compliance and traceability, all authentication attempts are permanently recorded.

*   The `AuthAuditLog` database table stores immutable records of every login attempt.
*   **Tracked Metrics**:
    *   `email`: The string attempted.
    *   `ipAddress`: Extracted from the incoming HTTP request.
    *   `status`: Granular outcomes like `SUCCESS`, `FAILED_USER_NOT_FOUND`, `FAILED_BAD_PASSWORD`, and `FAILED_LOCKED_OUT`.
*   This audit trail allows security administrators to identify distributed botnet attacks or determine if a specific employee's account is being targeted.
