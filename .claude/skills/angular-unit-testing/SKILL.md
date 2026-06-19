---
name: angular-unit-testing
description: Creates and updates Jasmine/Karma unit tests in lockstep with Angular code changes, and runs the test suite to confirm everything passes before finishing. Use whenever a new Angular component, service, pipe, directive, or model is created, or an existing one's logic, template bindings, inputs/outputs, or signals are modified.
---

# Angular Unit Testing (BikeCare frontend)

This project's frontend uses Jasmine + Karma (`frontend/package.json`'s
`test` script → `ng test`). This skill is a workflow contract, not just a
style guide: a change to Angular code is not done until its test is written
or updated *and* the full suite has been run and is green.

## Core rule

No edit to a `.ts` file under `frontend/src/app` is finished until:

1. its `*.spec.ts` reflects the new/changed behavior (created if it didn't
   exist, updated if it did), and
2. the full suite has been run headlessly and passes.

Don't hand back a change with a red suite, and don't skip the spec because
"it's a small change" — small changes are exactly what regress silently.

## Workflow

- **New component/service/pipe/directive** → create a sibling `*.spec.ts`
  covering its public behavior (rendered output, emitted events, exposed
  signals, service calls) — not internal implementation details.
- **Modified component/service** → open its existing spec first. Add cases
  for the new behavior (new input, new branch, new computed signal, changed
  template condition). Remove or update assertions for behavior that no
  longer exists — stale passing assertions are worse than no test.
- **After every edit**, run the suite (command below) and fix failures
  before considering the task complete.

## Running tests (non-interactive)

`frontend/package.json` only defines `"test": "ng test"`, and there is no
`karma.conf.js` override — the default Karma builder runs in watch mode
against a real Chrome window, which hangs in a non-interactive/headless
session. Use this instead, run from `frontend/`:

```
cd frontend && npx ng test --no-watch --no-progress --browsers=ChromeHeadless
```

Verified in this environment: single run, exits on completion, no display
required (113/113 passing at time of writing). `--no-progress` keeps the
output from spamming one line per spec.

To iterate quickly on one file while writing a test, scope the run:

```
npx ng test --no-watch --no-progress --browsers=ChromeHeadless --include='**/bicycle-card.component.spec.ts'
```

Always finish with a full unscoped run — a scoped run passing tells you
nothing about whether you broke something else.

## Test structure conventions

Match the existing pattern in the codebase (e.g. `bicycle-list.component.spec.ts`):

```ts
describe('BicycleListComponent', () => {
  let fixture: ComponentFixture<BicycleListComponent>;
  let component: BicycleListComponent;
  let bicycleSpy: jasmine.SpyObj<BicycleService>;

  beforeEach(() => {
    bicycleSpy = jasmine.createSpyObj('BicycleService', ['getAll']);
    TestBed.configureTestingModule({
      imports: [BicycleListComponent],
      providers: [
        provideRouter([]),
        { provide: BicycleService, useValue: bicycleSpy },
      ],
    });
    bicycleSpy.getAll.and.returnValue(of([]));
    fixture = TestBed.createComponent(BicycleListComponent);
    component = fixture.componentInstance;
  });

  it('loads bicycles on init', () => {
    fixture.detectChanges();
    expect(bicycleSpy.getAll).toHaveBeenCalled();
  });
});
```

- Standalone components go in `imports: [TheComponent]`, never `declarations`.
- Mock every `inject()`-based dependency with `jasmine.createSpyObj`; never
  let a unit test hit a real `HttpClient`/backend.
- Set signal inputs via `fixture.componentRef.setInput('name', value)`,
  never by direct property assignment (`component.name = value` won't work
  against `input()`-defined signals).
- Assert on signal/computed values by calling them — `component.someSignal()`
  — not by reaching into private internals.
- For an Observable→signal bridge via `toSignal()`, drive it with
  `fakeAsync()` + `tick()`, and cover both the success path (`of(...)`) and
  an error path (`throwError(() => ...)`).
- For reactive forms (`FormBuilder.nonNullable`), assert validity/values via
  `form.controls.x.setValue(...)` + `form.valid`/`form.controls.x.errors`,
  not by scraping rendered DOM error text unless the component actually
  renders one and that's what's under test.

## What to test vs. skip

Assert observable behavior — rendered output, emitted events, signal
values, calls made to mocked services with the right arguments. Don't test
Angular internals (change detection mechanics, template compilation). One
happy path plus the realistic edge cases per component (empty list,
loading, error) is the right grain — not exhaustive input permutations.

## Known coverage gaps

As of writing, `frontend/src/app` has component specs for all 8 components
but **no specs for services** (`bicycle.service.ts`, `component.service.ts`,
`activity.service.ts`, `dashboard.service.ts`) and **no specs for model
utility functions** (e.g. label/wear-level helpers in `bicycle.model.ts`).
If you touch one of these files, add its first spec rather than skipping
testing just because there's no existing local pattern to copy — a service
spec follows the same `TestBed`/`HttpTestingController` (or plain
constructor-call, if the service has no DI deps) shape as any other Jasmine
spec; a pure model function just needs direct `expect(fn(input)).toBe(...)`
calls, no `TestBed` at all.

## Quick checklist for any change touching `frontend/src/app`

- [ ] New file → spec created. Modified file → spec updated to match.
- [ ] Standalone component tested via `imports: [Component]`, not `declarations`.
- [ ] Every injected dependency mocked — no real HTTP/backend calls in a unit test.
- [ ] Signal inputs set via `setInput()`; signal/computed reads via the signal call, not private-field access.
- [ ] Observable→signal (`toSignal`) paths covered with `fakeAsync`/`tick`, success and error.
- [ ] Stale assertions for removed behavior deleted, not left in place.
- [ ] `cd frontend && npx ng test --no-watch --no-progress --browsers=ChromeHeadless` run, full suite green, before calling the change done.
