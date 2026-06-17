# BikeCare

## Vision

BikeCare is a web-based bicycle maintenance management application for cyclists who own one or more bikes and want to stay on top of upkeep. Bicycles are made of components that wear out at different rates (chains, tires, brake pads, cassettes, bearings, cables, etc.), and most riders track this informally or not at all. BikeCare gives owners a single place to register their bikes, log rides/activities, track how much wear each component has accumulated, record services and part replacements, and plan maintenance before something fails.

The long-term goal is a tool that answers, for any bike in the garage: *what shape is it in, what was done to it, and what needs attention next.*

## Core Domain Goals

- **Register bicycles** — owners add bikes with identifying details (make, model, year, type, purchase date, etc.) and the set of components fitted to them.
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
- **Backend (Express.js)**: exposes a REST API for all domain operations (CRUD on bicycles, components, activities, maintenance/service records, schedules). Owns business logic such as wear calculation and maintenance due-status.
- **Database (SQLite)**: single local file, accessed only from the backend. Schema should be managed through migrations rather than ad-hoc changes once implementation begins.

Expected top-level layout (to be created during implementation):

```
BikeCare/
├── frontend/        # Angular application
├── backend/         # Express.js REST API
└── CLAUDE.md
```

## Domain Model (conceptual)

These are the core entities the system is built around. Exact schema/fields will be finalized during implementation, but the relationships are foundational to the design:

- **Bicycle** — a single bike owned by a user. Has identifying info (name, make, model, year, type) and owns a set of Components.
- **Component** — a part fitted to a bicycle (e.g. chain, tires, brake pads, cassette, cables). Has an install date, expected lifespan (by time and/or distance), and accumulated wear/usage derived from Activities. May be replaced, which closes out its history and starts a new Component instance.
- **Activity** — a logged ride/usage event for a bicycle (distance, duration, date, conditions). Drives wear accumulation on the bicycle's components.
- **MaintenanceRecord / ServiceRecord** — a record of work performed on a bicycle or a specific component: service, repair, inspection, or part replacement. Includes date, usage at time of service, parts/cost/notes. Forms the maintenance history.
- **MaintenanceSchedule** — a planned future maintenance task for a bicycle or component, defined by a time interval (e.g. every 6 months) and/or usage interval (e.g. every 2000 km), used to compute due/overdue status.

Relationships: a Bicycle has many Components; a Bicycle has many Activities; Components and Bicycles each have many MaintenanceRecords; MaintenanceSchedules apply to a Bicycle or a Component and are checked against logged Activities and elapsed time to determine due status.

## Project Status

This repository is at the design stage: the goal, domain, and stack are defined here, but the Angular frontend and Express backend have not yet been scaffolded. Treat this file as the source of truth for intent and architecture when starting implementation — prefer updating this document as decisions firm up (e.g. concrete schema, folder structure, auth approach) rather than letting it drift out of sync with the code.

## Open Questions / Future Considerations

- Single-user vs multi-user (auth/accounts) — not yet decided.
- Units (metric vs imperial) for distance-based wear tracking.
- Notification mechanism for due/overdue maintenance (in-app only vs email/push).
- Whether wear is calculated purely from logged Activities or also allows manual wear adjustment.
