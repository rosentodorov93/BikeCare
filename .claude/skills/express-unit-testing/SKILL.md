---
name: express-unit-testing
description: Creates and updates Vitest unit tests in lockstep with backend code changes, and runs the suite to confirm everything passes before finishing. Use whenever a new Express service, repository, controller, middleware, or model/type is created, or an existing one's logic, error handling, or validation is modified.
---

# Express Unit Testing (BikeCare backend)

The backend uses Vitest (`backend/package.json`'s `test` script → `vitest run`).
Like `angular-unit-testing` on the frontend, this is a workflow contract: a
change to backend code is not done until its test is written or updated
*and* the full suite has been run and is green.

## Core rule

No edit to a `.ts` file under `backend/src` is finished until:

1. its `*.test.ts` reflects the new/changed behavior (created if it didn't
   exist, updated if it did), and
2. the full suite has been run and passes.

Don't hand back a change with a red suite, and don't skip the test because
"it's just a small service method" — that's exactly what regresses silently
once a repository or another service changes shape underneath it.

## Workflow

- **New service/repository/middleware/utility/type** → create a sibling
  `*.test.ts` covering its public behavior — not internal implementation
  details.
- **Modified service/controller/middleware** → open its existing test file
  first. Add cases for the new behavior (new branch, new error path, new
  validation rule). Remove or update assertions for behavior that no longer
  exists.
- **After every edit**, run the suite (command below) and fix failures
  before considering the task complete.

## Running tests

```
cd backend && npm test
```

This runs `vitest run` — a single pass, no watch mode, no flags needed (unlike
the frontend's Karma setup). Verified in this environment: 81/81 passing,
~1s. Use `npm run test:watch` only while interactively iterating on one file
in a long-lived session — never as the final check.

To scope a run to one file while writing a test:

```
npx vitest run src/services/bicycles.service.test.ts
```

Always finish with the full unscoped `npm test` — a scoped pass tells you
nothing about whether you broke something else (e.g. a shared repository
mock shape used by multiple service tests).

## Test structure conventions

Match the existing pattern in the codebase (`*.test.ts`, co-located with the
file under test, e.g. `bicycles.service.test.ts` next to `bicycles.service.ts`):

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../repositories/bicycles.repository.js', () => ({
  bicycleRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    deleteById: vi.fn(),
    newId: vi.fn(),
  },
}));

import { ApiError } from '../utils/api-response.js';
import { bicycleRepository } from '../repositories/bicycles.repository.js';
import { bicycleService } from './bicycles.service.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('bicycleService.getById', () => {
  it('returns the bicycle when found', async () => {
    vi.mocked(bicycleRepository.findById).mockReturnValue(sampleBike);
    const result = await bicycleService.getById('bike-1');
    expect(result).toEqual(sampleBike);
  });

  it('throws ApiError(404) when bicycle is not found', async () => {
    vi.mocked(bicycleRepository.findById).mockReturnValue(undefined);
    await expect(bicycleService.getById('missing')).rejects.toMatchObject({
      status: 404,
      code: 'BICYCLE_NOT_FOUND',
    });
  });
});
```

- Mock at the module boundary with `vi.mock('../repositories/x.repository.js', () => ({ ... }))`
  — import paths keep the `.js` extension (ESM + NodeNext resolution), even
  though the source file is `.ts`.
- `vi.mock(...)` calls and their `vi.fn()` stubs go *before* the real imports
  of the mocked module's consumers, matching the existing files.
- `vi.clearAllMocks()` in a top-level `beforeEach` so mock call counts/return
  values don't leak between tests.
- A service test never touches the real `db` connection — mock every
  repository it calls. If a service test needs `db.transaction`, mock
  `../db/connection.js` directly (see `bicycles.service.test.ts`) rather than
  letting it hit SQLite.
- Assert thrown `ApiError`s with `.rejects.toMatchObject({ status, code })`,
  not just `.rejects.toThrow()` — the status/code is the contract controllers
  and the central error handler depend on.
- For middleware (`error-handler.ts`, `validate.ts`), build minimal
  `Request`/`Response`/`NextFunction` fakes with `vi.fn()` (see
  `error-handler.test.ts`'s `makeRes()`), not a real Express app — middleware
  unit tests should not spin up `app.ts`.
- For pure type/model helpers, no mocking at all — call the function and
  assert the result directly (see `component.test.ts`).

## What to test vs. skip

Assert observable behavior: return values, thrown `ApiError` status/code,
which repository/service methods were called and with what arguments. Don't
test the SQL inside a repository by mocking `better-sqlite3` line-by-line —
repositories are deliberately the layer this project doesn't unit-test (see
gaps below); don't test framework internals (Express routing itself,
`better-sqlite3` driver behavior).

## Known coverage gaps

As of writing, `backend/src` has tests for **services**, **middleware**,
**utils**, and one **type** module, but **no tests for repositories** or
**controllers** or **routes**. This is a deliberate-by-default gap in a
thin-controller/repository architecture (see `express-best-practices`):
repositories are thin SQL wrappers best covered by integration tests against
a real (in-memory or temp-file) SQLite DB rather than mocking the driver, and
routes/controllers are thin enough that their logic is usually exercised via
the service tests plus the `asyncHandler`/`errorHandler` middleware tests.

If you add meaningful logic to a repository (e.g. anything beyond a single
parameterized query — a multi-statement transaction, a non-trivial `WHERE`
clause) or a controller (e.g. request-shape branching beyond what Zod
already validates), add its first test rather than skipping just because
there's no existing local pattern: for a repository, spin up a real
`better-sqlite3` instance against an in-memory DB (`new Database(':memory:')`)
with the project's migration applied, not a mocked driver.

## Quick checklist for any change touching `backend/src`

- [ ] New file → test created. Modified file → test updated to match.
- [ ] Mocked at the module/repository boundary with `vi.mock(...)`, never hitting real SQLite from a service/middleware test.
- [ ] `vi.clearAllMocks()` present so tests don't leak state.
- [ ] Thrown errors asserted as `ApiError` with the right `status`/`code`, not just "throws something."
- [ ] Stale assertions for removed behavior deleted, not left in place.
- [ ] `cd backend && npm test` run, full suite green, before calling the change done.
