# RESCUEGO — Ambulance Dispatch & Emergency Management System

RESCUEGO is a backend-heavy REST API for real-time ambulance dispatching. Patients can raise emergency requests with their live GPS location, the system finds and assigns the nearest available ambulance using the Haversine distance formula, drivers accept/track the trip through a full status lifecycle, and payment is settled through Stripe once the trip is completed.

Built for the **B7A6 Backend Project Assignment**.

---

## Table of Contents

- [Problem Domain](#-problem-domain)
- [Tech Stack](#-tech-stack)
- [User Roles](#-user-roles)
- [Core Workflow](#-core-workflow)
- [Database Design](#-database-design)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Overview](#-api-overview)
- [Nearest Ambulance Algorithm](#-nearest-ambulance-algorithm)
- [Payment Flow (Stripe)](#-payment-flow-stripe)
- [API Documentation](#-api-documentation)
- [Admin Demo Credentials](#-admin-demo-credentials)
- [Deployment](#-deployment)
- [Live API](#-live-api)

---

## Problem Domain

Emergency ambulance response in many cities is slow and manual — patients call around, dispatchers guess which ambulance is closest, and there's no live tracking or digital record of the trip. RESCUEGO solves this by:

- Letting a patient raise an emergency request with one tap, sharing live GPS coordinates
- Automatically locating the nearest **available, approved** ambulance using real driver GPS history
- Giving drivers a clear accept/reject flow and a step-by-step trip status pipeline
- Recording every trip, payment, and admin action for accountability (audit logs)

---

## Tech Stack

| Category | Technology |
|---|---|
| Runtime & Framework | Node.js, TypeScript, Express.js |
| Database & ORM | PostgreSQL + Prisma ORM |
| Validation | Zod |
| Authentication | JWT (Bearer Token) + bcrypt password hashing |
| Payments | Stripe Checkout + Webhooks |
| Security | Helmet, CORS |
| Deployment | Vercel (Serverless Functions) |
| API Docs | Postman Collection |

---

## User Roles

RESCUEGO has **3 fixed roles**, each with strictly separated permissions:

### Patient
- Register/login, manage profile & medical info
- Create emergency requests with GPS location
- Track request status, view trip history
- Pay for completed trips via Stripe
- Rate and review the driver

### Driver
- Register/login, manage profile, register ambulance(s)
- Start/stop duty (shares live GPS location)
- Accept/reject dispatched emergencies
- Update trip status through the full lifecycle
- View trip history and performance statistics

### Admin / Dispatcher
- Approve/reject driver applications
- Manage hospitals (CRUD)
- Find nearest ambulances & assign emergencies to drivers
- View dashboard statistics, all payments, and audit logs
- Activate/deactivate user accounts

---

**Emergency status lifecycle:**
`PENDING → ASSIGNED → ACCEPTED → EN_ROUTE → ARRIVED → PATIENT_PICKED_UP → AT_HOSPITAL → COMPLETED` (or `CANCELLED` from PENDING/ASSIGNED)

---

## Database Design

Key entities and relationships (PostgreSQL + Prisma):

- **User** — base account (email, password, phone, role) → one-to-one with Patient / Driver / Admin
- **Patient** — medical info, emergency contact → has many EmergencyRequests, Payments, Reviews
- **Driver** — license info, `isApproved`, `isAvailable` → has many Ambulances, DriverLocations, Trips
- **Ambulance** — registration, type, capacity, equipment (owned by a Driver)
- **DriverLocation** — GPS history (lat/lng/accuracy), one row per location ping — used to resolve "current location" via `ORDER BY createdAt DESC LIMIT 1`
- **Hospital** — name, address, coordinates, capacity
- **EmergencyRequest** — the core entity: patient location, severity, status, assigned driver/hospital
- **Trip** — created once a driver accepts; tracks distance, fare, and status timestamps
- **Payment** — Stripe session/payment intent, amount, status
- **Review** — patient's rating (1–5) + sub-ratings (cleanliness, professionalism, communication) for a driver
- **AuditLog** — records admin actions (approve driver, toggle user status, etc.)

All deletable models use **soft deletes** (`deletedAt` timestamp) rather than hard deletes. Indexes are applied on frequently-queried fields (`email`, `phone`, `role`, `status`, `createdAt`, geolocation fields).

---

## Project Structure

```
rescuego-backend/
├── api/
│   └── index.ts                 # Vercel serverless entry point
├── prisma/
│   ├── schema/
│   │   └── schema.prisma        # Full data model
│   └── migrations/
├── src/
│   ├── app.ts                   # Express app (middleware, routes)
│   ├── server.ts                # DB connection + server bootstrap
│   ├── index.ts                 # Entry point
│   ├── config/                  # env, database, cors, constants, stripe
│   ├── middleware/               # auth, error handler, logger
│   ├── utils/                    # jwt, password, validation, distance (Haversine)
│   ├── services/                 # business logic per domain
│   ├── controllers/              # request handlers per domain
│   └── routes/                   # route definitions per domain
├── vercel.json
├── .env
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- A PostgreSQL database (local or cloud, e.g. Prisma Postgres / Neon / Supabase)
- Stripe account (test mode) + Stripe CLI for local webhook testing

### Installation

```bash
git clone <repository-url>
cd rescuego-backend
npm install
```

### Setup

```bash
# 1. Configure environment variables
cp .env.example .env
# then fill in DATABASE_URL, JWT_SECRET, STRIPE keys, etc.

# 2. Generate Prisma Client & run migrations
npx prisma generate
npx prisma migrate dev --name init

# 3. Start the dev server
npm run dev
```

### Local Stripe Webhook Testing

```bash
stripe login
stripe listen --forward-to localhost:5000/api/v1/payments/webhook
# copy the printed whsec_... into STRIPE_WEBHOOK_SECRET in .env, then restart the server
```

Server runs at: `http://localhost:5000`

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Server port (default 5000) |
| `NODE_ENV` | `development` / `production` |
| `APP_URL` | Base URL of the deployed API |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_EXPIRE` | Token expiry (e.g. `7d`) |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds |
| `STRIPE_SECRET_KEY` | Stripe secret key (test mode) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| `CORS_ORIGIN` | Comma-separated allowed origins |

---

## API Overview

All endpoints are versioned under `/api/v1`. **49 endpoints** across 7 modules:

| Module | Endpoints | Examples |
|---|---|---|
| **Auth** | 3 | register, login, get current user |
| **Patient** | 7 | profile, create/list/cancel emergency request, stats |
| **Driver** | 12 | profile, ambulance registration, duty start/stop, GPS updates, trip history, statistics |
| **Dispatch** | 5 | find nearest ambulances, assign, accept/reject, update trip status |
| **Payments** | 5 | Stripe checkout, webhook, payment history/status |
| **Admin** | 12 | dashboard stats, user/driver management, hospital CRUD, audit logs |
| **Reviews** | 5 | create/update/delete review, driver reviews, my reviews |

### Standard Response Format

```json
// Success
{ "success": true, "message": "Operation successful", "data": {} }

// Error
{ "success": false, "message": "Something went wrong", "errors": [] }
```

Protected routes require a Bearer token:
```
Authorization: Bearer <jwt_token>
```

### Notable Features
- **Pagination** on all list endpoints (`?page=1&limit=10`)
- **Filtering & sorting** (`?status=PENDING&sortBy=createdAt&sortOrder=desc`)
- **Soft deletes** via `deletedAt`
- **Audit logs** for admin actions (approve driver, toggle user status, etc.)
- **Role-based middleware** (`authenticate` + `authorize(...roles)`) on every protected route

---

## Nearest Ambulance Algorithm

1. Drivers share GPS coordinates (`navigator.geolocation`) when starting duty and periodically while on duty; each ping is stored as a new `DriverLocation` row (history is preserved, not overwritten).
2. A driver's **current location** = the most recent `DriverLocation` row (`ORDER BY createdAt DESC LIMIT 1`).
3. When dispatching, all `isAvailable && isApproved` drivers are fetched with their latest location.
4. Distance from the patient to each driver is computed using the **Haversine formula** (great-circle distance on a sphere, accounts for the Earth's curvature — a flat Pythagorean distance would be inaccurate for lat/lng coordinates).
5. Results are sorted ascending by distance and the nearest N are returned; an estimated time is derived from an assumed average speed.

```ts
const R = 6371; // Earth radius in km
const dLat = toRad(lat2 - lat1);
const dLng = toRad(lng2 - lng1);
const a = sin(dLat/2)**2 + cos(toRad(lat1)) * cos(toRad(lat2)) * sin(dLng/2)**2;
const c = 2 * atan2(sqrt(a), sqrt(1 - a));
return R * c; // distance in km
```

> At larger scale this would move to a PostGIS-indexed geospatial query or Redis `GEOADD`/`GEORADIUS`, but the current in-memory approach is well within scope for this assignment's data volume.

---

## Payment Flow (Stripe)

1. Patient completes a trip (`EmergencyRequest.status = COMPLETED`)
2. `POST /payments/checkout` creates a Stripe Checkout Session and a `Payment` row (`status: PENDING`)
3. Patient pays on Stripe's hosted checkout page
4. Stripe sends a `checkout.session.completed` webhook to `POST /payments/webhook`
5. The webhook handler verifies the signature and updates `Payment.status → SUCCESS`
6. Patient can view payment history/status at any time

> The webhook route uses `express.raw()` (registered **before** `express.json()`) because Stripe's signature verification requires the raw request body.

---

## Admin Demo Credentials

> Create a dedicated admin account for evaluation — do not reuse a personal account.

```
Email:    admin@rescuego-demo.com
Password: <set during registration, share separately with evaluator>
```

---

## Deployment

Deployed as Vercel Serverless Functions:

- `api/index.ts` re-exports the Express `app` as the serverless entry point
- `vercel.json` routes all traffic to that function
- Database uses a pooled cloud PostgreSQL connection
- Migrations are applied with `npx prisma migrate deploy` (not `migrate dev`) against production
- A separate production Stripe webhook endpoint is configured in the Stripe Dashboard pointing at the deployed `/api/v1/payments/webhook` URL

---

## Live API

- **Live API URL:** [Rescuego](https://rescuego-backend.vercel.app)
- **Postman Docs:** [POSTMAN](https://documenter.getpostman.com/view/54724313/2sBYB2r7H2)




