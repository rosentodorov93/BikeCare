---
name: express-best-practices
description: Modern Express.js REST API guidelines — TypeScript, layered architecture (controller/service/repository), centralized error handling, async/await, and consistent API response shape. Use when writing, reviewing, or refactoring any backend code in this project (routes, controllers, services, repositories, middleware).
---

# Express.js Best Practices (BikeCare backend)

This project's backend is an Express.js REST API over SQLite (see root `CLAUDE.md`).
This skill captures the conventions to use for *all* new backend code so the API
stays consistent as it grows. The rules below are non-negotiable defaults — only
deviate with a specific reason.

When in doubt: keep the dependency direction one-way —
`routes → controllers → services → repositories → DB`. Nothing ever calls
backwards or skips a layer.

## TypeScript baseline

The backend is TypeScript, not plain JS. Enable `strict` mode in `tsconfig.json`.

- DTOs (request/response shapes) live next to the controller that uses them.
- Domain types (`Bicycle`, `Component`, `MaintenanceRecord`, etc.) live next to
  the service/repository layer that owns them, and are reused across layers
  instead of redefined per file.
- No `any` to silence the compiler — type the SQLite row shape returned by a
  repository explicitly.

## Layered architecture & project structure

Three layers, one direction of dependency:

```
routes  →  controllers  →  services  →  repositories  →  DB (SQLite)
```

```
backend/src/
  routes/         # express.Router() per resource, wires HTTP verbs to controllers
  controllers/    # thin: parse req, call service, shape response
  services/       # business logic (wear calculation, due-status, orchestration)
  repositories/   # all SQLite access, parameterized queries only
  middleware/     # error handler, validation, auth, etc.
  db/             # connection + migrations
```

One file per resource per layer, named consistently, mirroring the domain
entities from `CLAUDE.md` (Bicycle, Component, Activity, MaintenanceRecord,
MaintenanceSchedule):

```
routes/bicycles.routes.ts
controllers/bicycles.controller.ts
services/bicycles.service.ts
repositories/bicycles.repository.ts
```

A layer only imports from the layer directly below it. Routes never import
repositories; controllers never import the DB connection module.

## Controllers: thin

A controller does exactly three things: extract/validate request data, call
one service method, shape the HTTP response. No business logic, no SQL, no
manual `try/catch` (errors propagate to the central handler).

```ts
// controllers/bicycles.controller.ts
export const getBicycle = asyncHandler(async (req: Request, res: Response) => {
  const bicycle = await bicycleService.getById(req.params.id);
  res.json(ok(bicycle));
});

export const createBicycle = asyncHandler(async (req: Request, res: Response) => {
  const bicycle = await bicycleService.create(req.body as CreateBicycleDto);
  res.status(201).json(ok(bicycle));
});
```

- If a controller has an `if`/`else` branch deciding *what* should happen
  (not just how to shape the response), that logic belongs in the service.
- Controllers never construct SQL or touch a repository directly.

## Services: own the business logic

Services contain domain rules — wear calculation, maintenance due-status,
cross-entity orchestration — and call one or more repositories. Services
never import `express` types (`Request`/`Response`): this keeps them
framework-agnostic and directly unit-testable.

```ts
// services/bicycles.service.ts
export const bicycleService = {
  async getById(id: string): Promise<Bicycle> {
    const bicycle = await bicycleRepository.findById(id);
    if (!bicycle) throw new ApiError(404, 'BICYCLE_NOT_FOUND', `Bicycle ${id} not found`);
    return bicycle;
  },

  async create(dto: CreateBicycleDto): Promise<Bicycle> {
    return bicycleRepository.insert(dto);
  },
};
```

- Validation of *domain* rules (e.g. "a schedule interval must be positive")
  belongs here; basic request-shape validation belongs in middleware (see
  below) before the controller even calls the service.
- A service orchestrating multiple repositories (e.g. computing wear from
  `activityRepository` data against `componentRepository` thresholds) is the
  normal case — that's exactly what this layer is for.

## Repositories: own all database access

Every SQLite query lives in a repository, one repository per
aggregate/table family. Parameterized queries only — never string-interpolate
values into SQL.

```ts
// repositories/bicycles.repository.ts
export const bicycleRepository = {
  async findById(id: string): Promise<Bicycle | undefined> {
    const row = db.prepare('SELECT * FROM bicycles WHERE id = ?').get(id) as BicycleRow | undefined;
    return row ? toBicycle(row) : undefined;
  },

  async insert(dto: CreateBicycleDto): Promise<Bicycle> {
    const id = randomUUID();
    db.prepare(
      'INSERT INTO bicycles (id, name, make, model, year, type) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, dto.name, dto.make, dto.model, dto.year, dto.type);
    return this.findById(id) as Promise<Bicycle>;
  },
};
```

- Repositories return plain domain objects (`Bicycle`), never raw
  `better-sqlite3` statement results or row objects — map at the boundary
  (`toBicycle(row)`).
- Controllers and services never import `db/connection` directly — only
  repositories do. If a service needs raw SQL, that's a sign the query
  belongs in a repository method instead.

## Consistent API responses

Every controller responds through the same envelope helpers, so every
endpoint in the API has the same success/error shape.

```ts
// shape
{ "data": { ... } }                                   // success
{ "error": { "code": "BICYCLE_NOT_FOUND", "message": "Bicycle 123 not found" } }  // failure
```

```ts
// utils/api-response.ts
export const ok = <T>(data: T) => ({ data });

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}
```

Standard status codes: `200` read, `201` create, `204` delete/no body,
`400` invalid input, `404` not found, `409` conflict, `500` unexpected error.
No controller invents its own response shape or status-code convention.

## Async/await everywhere

No raw `.then()` chains, no callback-style APIs. Every async function
returns a `Promise` and is awaited at the call site.

```ts
// middleware/async-handler.ts
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
```

Wrap every async route handler in `asyncHandler` (or rely on Express 5's
native async-rejection-to-`next()` behavior, if/when the project is on
Express 5) so a thrown or rejected error always reaches the central error
handler instead of crashing the process or hanging the request.

## Centralized error handling

One error-handling middleware, registered last in `app.ts`, is the only
place that turns an error into an HTTP response.

```ts
// middleware/error-handler.ts
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
};
```

- Registered after all routes: `app.use(errorHandler)`.
- Throw `ApiError` (or a subclass) from services/repositories to signal an
  expected, mappable failure (not found, conflict, validation); let
  everything else fall through as an unexpected `500`.
- Never leak stack traces or raw error messages to the client in the `500`
  branch; log them server-side instead.
- No per-route ad-hoc `try/catch` that formats its own error response —
  that defeats the point of centralizing this.

## Quick checklist for any new/edited backend code

- [ ] TypeScript, `strict` mode, no `any` escape hatches.
- [ ] Dependency direction respected: routes → controllers → services → repositories → DB.
- [ ] Controller is thin: extract, call one service method, shape response — nothing else.
- [ ] Business logic lives in a service, not a controller or repository.
- [ ] All SQLite access lives in a repository, behind parameterized queries.
- [ ] Controllers/services never import the DB connection directly.
- [ ] Every response uses the shared `{ data }` / `{ error }` envelope.
- [ ] Every async function uses `async`/`await`, wrapped with `asyncHandler` (or Express 5 native handling).
- [ ] Errors are thrown (`ApiError` or subclass) and handled by the single central error middleware — no local `try/catch` formatting responses.
