# Smart College Canteen Management & Food Ordering Platform

A production-grade, zero-queue campus food ordering system designed for students, canteen staff, and administrators. Built with a shared backend architecture supporting both a responsive web client and a standalone native Android application (`Smart-Canteen.apk`).

---

## 🏛️ System Architecture

```text
                  SMART COLLEGE CANTEEN
                           │
                 ┌─────────┴─────────┐
                 │                   │
            WEB CLIENT          ANDROID APP
         (React 19 + Vite)    (React Native / Expo)
                 │                   │
                 └─────────┬─────────┘
                           │  HTTP / REST (CORS & Proxy-aware)
                      BACKEND API
                  (Express 4 + Node.js)
                           │
                ┌──────────┴──────────┐
                │                     │
      POSTGRESQL / CLOUD SQL      AI SERVICE (Fail-Safe)
          (Drizzle ORM)               │
                │              ┌──────┴──────┐
        Core Operations        │             │
        (Zero AI dependency) Gemini API   Local ML Provider
                               │      (Cloud SQL Historical)
                               └──────┬──────┘
                                      │
                               Fallback Provider
                               (Static Heuristics)
```

---

## 🌟 Key Features

### 👨‍🎓 Student Experience (Web & Android)
- **Interactive Menu**: Category filtering, pure veg/non-veg toggles, text search, price & popularity sorting.
- **Detailed Food Modals**: Portion sizes, nutritional details, allergen alerts, and preparation time.
- **Tray & Cart Management**: Real-time quantity adjustments, custom cooking instructions, and tray persistence.
- **Zero-Queue Checkout**: Pay-at-canteen counter flow generating collision-safe digital tokens (e.g. `#C101`).
- **Live Digital Token Stepper**: Real-time order preparation status (`Confirmed` ➔ `Cooking` ➔ `Ready for Pickup` ➔ `Completed`) with automated polling.
- **Order History & Reviews**: Past receipts, itemized token records, and 1–5 star food ratings with comments.
- **AI Campus Food Assistant**: Natural language culinary answers with instant heuristic fallback when offline.

### 👨‍🍳 Canteen Staff Dashboard
- **Live Kitchen Queue**: Real-time board filtering active orders by preparation stage.
- **State Machine Enforcement**: One-click valid status transitions (`confirmed` ➔ `preparing` ➔ `ready` ➔ `completed`).
- **Inventory Control**: Live stock portion counters, daily prepared vs sold analytics, reorder thresholds, and inline restock controls.

### 🛡️ Administrator Operations
- **Canteen Status Center**: Live open/close toggle, estimated queue wait time adjustment, and campus announcement banner broadcast.
- **Sales & Revenue Analytics**: Gross revenue, hourly order volume charts, ticket sizes, and top-selling items via Recharts.
- **Smart Culinary Intelligence**: Next-day meal demand predictions, rush hour forecasts, and food waste reduction insights.
- **System Observability Telemetry**: Live database health check (`SELECT 1`), AI circuit breaker status, error counters, and rate-limit event metrics.

---

## 🔒 Core Reliability & Security Principles

1. **Zero External AI Dependency**:
   - The entire core canteen workflow (login, menu browsing, ordering, token generation, kitchen status, inventory, and analytics) **never** depends on Gemini or external AI.
   - If Gemini is blocked, rate-limited, or unavailable, the system transparently serves heuristic baselines without errors or UI disruption.
2. **Circuit Breaker & Fallback Chain**:
   - `CircuitBreaker` monitors failure thresholds, isolates repeated 429/500 errors into `OPEN` state, enters `HALF-OPEN` after a cooldown period, and routes queries to `LocalMLProvider` or `FallbackProvider`.
3. **Server-Side Idempotency & Duplicate Order Prevention**:
   - Fast client double-clicks, duplicate submits, and network retries are deduplicated via server-side idempotency keys and request payload signatures.
4. **ACID Concurrency Protection**:
   - Orders are wrapped in PostgreSQL database transactions enforcing row-level inventory checks (`WHERE availableStock >= quantity`). Negative stock is strictly prevented.
5. **Backend Role-Based Access Control (RBAC)**:
   - Server-enforced roles (`student`, `staff`, `admin`) validated against Firebase Auth tokens and PostgreSQL records.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express 4, TypeScript, Drizzle ORM, node-postgres (`pg.Pool`), CORS, Express Rate Limit.
- **Database**: Cloud SQL / PostgreSQL 15+.
- **Authentication**: Firebase Client SDK & Firebase Admin SDK.
- **Frontend (Web)**: React 19, Vite 6, Tailwind CSS v4, Lucide React, Recharts, Motion.
- **Mobile (Android)**: React Native / Expo 52, TypeScript, EAS Build (Standalone APK target).
- **AI / ML**: `@google/genai` (Gemini Flash), Cloud SQL regression algorithms, in-memory circuit breaker.

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js 20+
- PostgreSQL database (local or Cloud SQL)

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your database credentials and optional Gemini API key:
```env
SQL_HOST="127.0.0.1"
SQL_USER="postgres"
SQL_PASSWORD="your_password"
SQL_DB_NAME="smart_canteen"
CORS_ORIGIN="http://localhost:3000,http://localhost:5173,http://10.0.2.2:3000,http://10.0.2.2:8081"
GEMINI_API_KEY="optional_api_key"
```

### 3. Start Development Server
```bash
npm run dev
```
The full-stack development server will start on `http://localhost:3000` with hot asset compilation.

### 4. Run Automated Test Suite
Verify core operations, duplicate order idempotency, concurrency, and circuit breaker resilience:
```bash
npm run test
```

---

## 📱 Standalone Android App (`Smart-Canteen.apk`)

The mobile client is located under the `/mobile` directory and shares the exact same backend REST API and PostgreSQL database.

### Android Networking Rule
On physical Android phones or emulators, `localhost` resolves to `127.0.0.1` (the phone itself).
- **Android Emulator**: Set API endpoint to `http://10.0.2.2:3000`.
- **Physical Device on Campus Wi-Fi**: Set API endpoint to your computer's LAN IP, e.g. `http://192.168.1.15:3000`.
- **Cloud Run / Production**: Set `EXPO_PUBLIC_API_BASE_URL` to your production domain.

The mobile app includes an in-app **Backend Configuration** setting in the Login and Profile screens, allowing students and testers to update the server URL without rebuilding the APK.

### Building `Smart-Canteen.apk`

#### Option A: Using GitHub Actions (Automated)
1. Push a release tag to GitHub:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. GitHub Actions runs `.github/workflows/build-apk.yml`, compiles the release build, and publishes `Smart-Canteen.apk` directly to GitHub Releases.

#### Option B: Local Gradle APK Build
```bash
cd mobile
npm install
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
```
The compiled APK will be located at:
`mobile/android/app/build/outputs/apk/release/app-release-unsigned.apk`

---

## 🧪 Verification Matrix

| Test Category | Target Component | Verification Mechanism | Status |
|---|---|---|---|
| Zero AI Dependency | Browsing, Tray, Orders, Tokens | AIService circuit breaker bypass | PASS |
| Concurrency & Stock | `createStudentOrder` | Atomic SQL deduction (`availableStock >= qty`) | PASS |
| Duplicate Order Prevention | `/api/orders` | Idempotency Key cache & signature check | PASS |
| Token Collision Safety | Server-side generator | Unique collision-safe counter `#C100+` | PASS |
| Cross-Origin & Mobile | `server.ts` CORS middleware | Android emulator, LAN IP, and web origins | PASS |
| System Observability | `/api/admin/health` | Live DB `SELECT 1` & circuit breaker state | PASS |

---

## 📄 License
MIT License. Developed for University & Campus Canteen Environments.
