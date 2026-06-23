# BikeCare

BikeCare is a web-based bicycle maintenance management application. It gives cyclists a single place to register their bikes, log rides, track how much wear each component has accumulated, record services and part replacements, and plan maintenance before something fails.

For any bike in the garage, BikeCare answers: **what shape is it in, what was done to it, and what needs attention next.**

## Features

- **User accounts** — register and log in; data is scoped per user (JWT-based auth).
- **Bicycle registry** — add bikes with identifying details (name, brand, model, type, purchase date, frame size, wheel size, photo) and the components fitted to them.
- **Component tracking** — track individual parts (chain, tires, brake pads, cassette, cables, etc.) and their accumulated wear/usage.
- **Activity log** — log rides (distance, duration, date, conditions) per bike; activities drive wear accumulation on components.
- **Maintenance records** — a chronological history of services, repairs, and part replacements per bike/component, including cost and notes.
- **Dashboard** — an overview per bike and across all bikes showing condition, recent activity, and what needs attention.
- **Reports** — export maintenance/activity reports per bike (DOCX export).
- **Sorting & filtering** — sort and filter the activities list.

## Architecture

```
┌──────────────────┐        REST/JSON        ┌───────────────────┐        SQL        ┌──────────────┐
│  Angular SPA      │ ──────────────────────> │  Express.js API    │ ────────────────> │  SQLite (.db) │
│  (frontend/)       │ <────────────────────── │  (backend/)         │ <──────────────── │               │
└──────────────────┘                          └───────────────────┘                    └──────────────┘
```

- **Frontend** ([frontend/](frontend)) — Angular 19 SPA. Talks to the backend exclusively through the REST API. Organized by feature area: `auth`, `bicycles`, `activities`, `components`, `dashboard`.
- **Backend** ([backend/](backend)) — Express.js REST API written in TypeScript, with a layered structure: `routes` → `controllers` → `services` → `repositories`. Owns business logic such as wear calculation and authentication, and is the only layer with database access.
- **Database** — SQLite, accessed only from the backend via `better-sqlite3`. Schema is managed through migrations ([backend/src/db/migrate.ts](backend/src/db/migrate.ts)); the `.db` file lives under `backend/data/` (git-ignored).

### Domain model

- **Bicycle** — a bike owned by a user, with identifying info and a set of Components.
- **Component** — a part fitted to a bicycle (chain, tires, brake pads, cassette, cables, ...), with install date, expected lifespan, and accumulated wear.
- **Activity** — a logged ride/usage event for a bicycle; drives wear accumulation.
- **MaintenanceRecord** — a record of service, repair, inspection, or replacement performed on a bicycle/component.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 19 |
| Backend | Express.js (TypeScript) |
| Database | SQLite (`better-sqlite3`) |
| Auth | JWT (`jsonwebtoken`, `bcrypt`) |
| Validation | `zod` |
| Reports | `docx` |
| Backend tests | Vitest |
| Frontend tests | Karma/Jasmine |

## Prerequisites

- Node.js (Node 18+; Node 18 caps the Angular CLI at v19, which is what this repo uses)
- npm

## Getting Started

### 1. Backend

```bash
cd backend
npm install
```

Create a `backend/.env` file with a JWT secret (required to start the server):

```
JWT_SECRET=replace-with-a-long-random-string
```

Run database migrations, then start the API in watch mode:

```bash
npm run migrate
npm run dev
```

The API starts on `http://localhost:3000` (health check at `/api/health`).

### 2. Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm start
```

The Angular dev server starts on `http://localhost:4200` and proxies `/api` requests to the backend (see [frontend/proxy.conf.json](frontend/proxy.conf.json)).

Open `http://localhost:4200` in your browser, register a user, and start adding bikes.

## Running Tests

```bash
# backend
cd backend && npm test

# frontend
cd frontend && npm test
```
