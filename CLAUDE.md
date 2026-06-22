# BikeCare

## Vision

BikeCare is a web-based bicycle maintenance management application for cyclists who own one or more bikes and want to stay on top of upkeep. Bicycles are made of components that wear out at different rates (chains, tires, brake pads, cassettes, bearings, cables, etc.), and most riders track this informally or not at all. BikeCare gives owners a single place to register their bikes, log rides/activities, track how much wear each component has accumulated, record services and part replacements, and plan maintenance before something fails.

The long-term goal is a tool that answers, for any bike in the garage: *what shape is it in, what was done to it, and what needs attention next.*

## Core Domain Goals

- **Register bicycles** — owners add bikes with identifying details (name, brand, model, type, purchase date, frame size, wheel size, etc.) and the set of components fitted to them.
- **Track maintenance history** — a chronological record of everything done to a bike: services, repairs, part replacements, inspections.
- **Schedule future maintenance** — maintenance can be planned ahead of time, either on a calendar basis (e.g. every 6 months) or a usage basis (e.g. every 2000 km), with reminders/due-status surfaced to the user.
- **Monitor component wear** — individual components (chain, tires, brake pads, cassette, etc.) accumulate wear from logged activities and are flagged as they approach end-of-life.
- **Maintain service records** — every service or replacement event is logged with date, mileage/usage at the time, parts involved, cost, and notes, building an auditable history per bike and per component.
- **Log activities** — rides/usage are logged (distance, duration, conditions) and feed into wear calculations and maintenance scheduling.

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Angular | SPA client consuming the REST API |
| Backend | Express.js | Node.js REST API server |
| Database | SQLite | Local, file-based storage |
| API style | REST | JSON over HTTP between Angular client and Express server |

This is a local-first / self-hosted style application: SQLite is used as the persistence layer rather than a hosted database service, so the backend owns a single `.db` file on disk.

## Architecture Overview

```
┌─────────────────┐        REST/JSON        ┌──────────────────┐        SQL        ┌──────────────┐
│  Angular SPA     │ ──────────────────────> │  Express.js API   │ ────────────────> │  SQLite (.db) │
│  (frontend/)      │ <────────────────────── │  (backend/)        │ <──────────────── │               │
└─────────────────┘                          └──────────────────┘                    └──────────────┘
```

- **Frontend (Angular)**: presentation and client-side state. Talks to the backend exclusively through the REST API — no direct database access from the client.
- **Backend (Express.js)**: layered as routes → controllers → services → repositories. Owns business logic such as wear calculation, and runs migrations on startup so a fresh checkout works without a manual step.
- **Database (SQLite)**: single local file under `backend/data/`, accessed only from the backend via `better-sqlite3`. Schema lives in `backend/src/db/migrate.ts` as an idempotent migration function (uses `CREATE TABLE IF NOT EXISTS` plus `addColumnIfMissing` for incremental column additions).

Top-level layout:

```
BikeCare/
├── frontend/        # Angular SPA (standalone components, lazy-loaded routes)
│   └── src/app/
│       ├── auth/        # login, register, guard, JWT interceptor
│       ├── bicycles/     # list, detail, form, card
│       ├── components/   # component icon/model/service
│       ├── activities/   # ride log, with sort/filter
│       └── dashboard/
└── backend/         # Express + TypeScript REST API
    └── src/
        ├── routes/        # auth, bicycles, activities, dashboard
        ├── controllers/   # auth, bicycles, components, activities, dashboard
        ├── services/      # auth, bicycles, components, activities, dashboard, report
        ├── repositories/  # users, bicycles, components, activities, maintenance
        ├── types/         # domain types + raw SQLite row shapes
        ├── db/            # connection.ts, migrate.ts
        └── middleware/
```

## Domain Model (as implemented)

- **User** — `id`, `username`, `email`, `password_hash` (bcrypt). Auth is JWT-based (`jsonwebtoken`, 7-day token), issued on register/login and checked by `auth.interceptor.ts` / `authGuard` on the frontend and an Express auth middleware on the backend. Multi-user: every bicycle is scoped to a `user_id`.
- **Bicycle** — `name`, `brand`, `model`, `type`, `purchase_date`, `frame_size`, `wheel_size`, `total_distance` (accumulated from activities), optional `image_url` (base64 data URL), `user_id`.
- **Component** — belongs to a bicycle. Has `name`, `service_interval_km`, `distance_at_service` (the bike's `total_distance` at last service/reset). Wear is *not* stored — it's computed on read as `wearState = round((total_distance - distance_at_service) / service_interval_km * 100)`, uncapped so overdue parts show >100%. Components are seeded automatically from the bike's suspension type (`no_suspension` / `hardtail` / `full_suspension`), each extending a shared base set (Chain, Brake pads, Tires, Cables, Cassette, Crankset, Bottom bracket; hardtail adds Front fork shock; full suspension adds Front fork shock + Rear shock), with per-name default service intervals (e.g. Chain 3000 km, Tires 4000 km, Cassette 8000 km).
- **Activity** — a logged ride: `bike_id`, `date`, `distance_km`. Adding one increases the bike's `total_distance`, which feeds every component's wear calculation. Frontend activities view supports sort/filter and shows the bike's image.
- **MaintenanceRecord** — logged whenever a component's service is reset: `bike_id`, `component_id` (nullable — survives component deletion via `ON DELETE SET NULL`), a snapshotted `component_name`, `type` (currently always `'service'`; `'replacement'`/`'inspection'` reserved for later), `date`, `distance_at_service`, `notes`. This is the maintenance history; resetting a component's service simultaneously writes a record and bumps `distance_at_service`.
- **Reporting** — `report.service.ts` generates a per-bike maintenance report (exported as `.docx` via the `docx` package).

Note: the originally-envisioned standalone **MaintenanceSchedule** entity (time *and* usage-interval based, separate from Component) was simplified — due/overdue status is currently derived purely from each Component's `service_interval_km` vs. accumulated distance. There is no calendar-based (e.g. "every 6 months") scheduling yet.

## API Surface (implemented)

- `auth.routes.ts` — register, login.
- `bicycles.routes.ts` — CRUD on bicycles, nested component service-reset, maintenance history, report export.
- `activities.routes.ts` — CRUD on activities.
- `dashboard.routes.ts` — `GET /dashboard?period=...` (week/month/etc., defaults to current month) — aggregated stats for the signed-in user.

## Project Status

Past the design stage — both apps are scaffolded and functional:

- **Backend**: Express + TypeScript, `better-sqlite3`, `zod` validation, `bcrypt`/`jsonwebtoken` auth, layered architecture with unit tests (Vitest) alongside services/types. Run with `npm run dev` (or `migrate`/`build`/`start`/`test`) from `backend/`.
- **Frontend**: Angular standalone components, lazy-loaded routes, an `authGuard`/`redirectIfAuthenticatedGuard` pair, and a JWT auth interceptor. Routes: `/login`, `/register`, `/dashboard`, `/activities`, `/bicycles`, `/bicycles/new`, `/bicycles/:id`, `/bicycles/:id/edit`.
- Recent work (see git log): bike image display across views, per-bike report export, activities list now shows bike image with sort/filter.

Treat this file as the source of truth for intent and architecture, and keep it in sync as the schema/feature set evolves — update it directly rather than letting it drift, since the codebase is now the actual reference, not just a design target.

## Open Questions / Future Considerations

- ~~Single-user vs multi-user~~ — resolved: multi-user with JWT auth, bicycles scoped per `user_id`.
- Calendar-based maintenance scheduling (e.g. "every 6 months") — not implemented; only usage-interval (km) based due-status exists today.
- Units (metric vs imperial) for distance-based wear tracking — currently km-only (`distance_km`, `service_interval_km`).
- Notification mechanism for due/overdue maintenance (in-app only vs email/push) — not yet implemented; due status is computed but not pushed.
- Whether wear is calculated purely from logged Activities or also allows manual wear adjustment — currently purely derived from activities (no manual override).
- Cost tracking on maintenance records (mentioned in the original vision) — not yet in the `maintenance_records` schema.
