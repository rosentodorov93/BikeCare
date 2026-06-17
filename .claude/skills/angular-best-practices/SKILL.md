---
name: angular-best-practices
description: Modern Angular development guidelines — standalone components, signals, signal-based inputs/outputs, the new control-flow syntax, reactive forms, and dependency injection with inject(). Use when writing, reviewing, or refactoring any Angular code in this project's frontend (components, services, forms, routing, state).
---

# Angular Best Practices (BikeCare frontend)

This project's frontend is Angular (see root `CLAUDE.md`). This skill captures the
conventions to use for _all_ new Angular code so the codebase stays consistent
as it grows. These reflect Angular's current (v17+) idiomatic style — no
NgModules, no `*ngIf`/`*ngFor`, no `@Input()`/`@Output()` decorators unless
there's a specific reason.

When in doubt: prefer the standalone/signals API over the legacy
decorator/RxJS-everywhere API. Only reach for RxJS when the problem is
genuinely asynchronous-stream shaped (HTTP, websockets, debounced events) —
synchronous UI state belongs in signals.

## Components: standalone only

Never generate or write an NgModule. Every component, directive, and pipe is
standalone (this is the default since Angular 19 — don't even add
`standalone: true` explicitly, it's implied).

```ts
@Component({
  selector: 'bc-bicycle-card',
  imports: [RouterLink, DatePipe],
  templateUrl: './bicycle-card.component.html',
})
export class BicycleCardComponent { ... }
```

- Import exactly what the template uses (`CommonModule` as a whole is a
  smell — import `DatePipe`, `NgOptimizedImage`, etc. individually).
- Bootstrap via `bootstrapApplication(AppComponent, appConfig)` in `main.ts`,
  never `platformBrowserDynamic().bootstrapModule(...)`.
- Routes are provided with `provideRouter(routes)` in `app.config.ts`, and
  lazy-loaded with `loadComponent`/`loadChildren` pointing at standalone
  components, not modules.

## State: signals first

Use `signal()` for any piece of local, synchronous component/service state.
Don't model it as a `BehaviorSubject` unless you need RxJS operators on it.

```ts
export class BicycleListComponent {
  protected readonly bicycles = signal<Bicycle[]>([]);
  protected readonly filter = signal("");

  protected readonly filteredBicycles = computed(() =>
    this.bicycles().filter((b) => b.name.includes(this.filter())),
  );
}
```

- `computed()` for derived state — never recompute derived values in the
  template or in a method called from the template (that re-runs on every CD
  cycle for no reason).
- `effect()` only for side effects that must react to signal changes
  (syncing to `localStorage`, imperative DOM/3rd-party-lib calls). Effects
  are not a general-purpose "run when X changes" hook for business logic —
  if you're computing a value, use `computed`, not an effect that sets
  another signal.
- Mutate via `set()`/`update()`, never mutate the underlying array/object in
  place: `this.bicycles.update(list => [...list, newBike])`, not
  `this.bicycles().push(newBike)`.

## Inputs, outputs, and two-way binding: signal-based APIs

Use the function-based `input()`, `output()`, and `model()` APIs instead of
the `@Input()`/`@Output()` decorators.

```ts
export class ComponentWearGaugeComponent {
  readonly component = input.required<BikeComponent>();
  readonly threshold = input(0.8); // default value, type inferred as number
  readonly replace = output<BikeComponent>();

  // two-way bindable: [(selected)]="x" in the parent template
  readonly selected = model<boolean>(false);
}
```

- `input.required<T>()` when the parent must always provide it — this is
  checked at compile time, unlike a decorator with no default.
- Read inputs as `this.component()` inside the class, same as any signal.
- Emit with `this.replace.emit(component)` — `output()` keeps the familiar
  `.emit()` call site.
- Use `model()` only for genuine two-way bindings (form-control-like
  components); for everything else prefer `input()` + `output()` so data
  flow stays explicit and traceable.

## Dependency injection: `inject()`, not constructor params

```ts
export class MaintenanceService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
}
```

- Use `inject()` at field-initializer position in components, services,
  directives, guards, resolvers, and interceptors.
- Constructor injection still works but mixing the two styles in the same
  class is inconsistent — pick `inject()` for everything in new code.
- Functional guards/resolvers/interceptors over class-based ones:
  `export const authGuard: CanActivateFn = () => { ... inject(AuthService) ... }`,
  registered via `provideHttpClient(withInterceptors([authInterceptor]))`.

## Templates: new control-flow syntax

Use `@if`, `@for`, `@switch` — never `*ngIf`/`*ngFor`/`*ngSwitch` in new
templates.

```html
@if (bicycles().length > 0) {
<ul>
  @for (bike of bicycles(); track bike.id) {
  <li>{{ bike.name }}</li>
  } @empty {
  <li>No bicycles yet.</li>
  }
</ul>
} @else {
<bc-empty-state />
}
```

- `track` is mandatory on `@for` — always track by a stable id (`bike.id`),
  never by index unless the list truly has no identity.
- `@empty` instead of a separate `*ngIf="list.length === 0"` block sitting
  next to the `*ngFor`.
- Self-closing component tags (`<bc-empty-state />`) where there's no
  content projection — this is the current formatter default.

## Reactive forms (typed)

Use `ReactiveFormsModule` with typed forms — never template-driven forms
(`[(ngModel)]` on a form) and never untyped `FormGroup`/`FormControl`.

```ts
export class BicycleFormComponent {
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly form = this.fb.group({
    name: this.fb.control("", { validators: [Validators.required] }),
    year: this.fb.control<number | null>(null),
    type: this.fb.control<"road" | "mtb" | "gravel" | "commuter">("road"),
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue(); // fully typed, no `| null` noise
  }
}
```

- `FormBuilder.nonNullable` so plain `string`/`number` controls don't widen
  to `string | null` — reserve explicit `| null` typing for controls that
  are genuinely optional/clearable.
- Validate with `Validators` / custom `ValidatorFn`s, surface errors via
  `form.controls.name.errors` in the template, not ad-hoc signal-based
  validation that duplicates what reactive forms already does.
- For a form-like reusable input component, implement
  `ControlValueAccessor` (or `model()` for simple cases) rather than
  hand-rolling two-way binding with `@Output()`.
- Convert a stream into form updates with `form.valueChanges` + `toSignal()`
  when a computed/template value depends on live form state.

## RxJS interop: bridge at the edges

Keep RxJS for genuinely async/stream sources (HTTP, router events,
websockets); convert to signals as soon as the data lands in component
state, using `toSignal()`/`toObservable()` from `@angular/core/rxjs-interop`.

```ts
export class BicycleListComponent {
  private readonly bicycleService = inject(BicycleService);
  protected readonly bicycles = toSignal(this.bicycleService.getAll(), {
    initialValue: [],
  });
}
```

- Don't `subscribe()` manually in a component to push results into a
  signal — that's what `toSignal` is for, and it handles unsubscription on
  destroy automatically.
- Don't wrap a signal in `toObservable()` just to use an RxJS operator that
  has a direct signal equivalent (`computed`, `debounce` via
  `effect`+`setTimeout` is usually avoidable — only bridge when the
  operator (`switchMap`, `debounceTime` on a real async source, `retry`)
  has no signal equivalent).

## Change detection

New apps/components should be written assuming `provideZonelessChangeDetection()`
is the direction Angular is heading, even if this project hasn't flipped the
flag yet:

- Don't rely on "Zone.js will pick it up" — always go through a signal
  write, `markForCheck()`, or an `AsyncPipe`/`toSignal()` bound value so the
  component is correct under zoneless CD too.
- Avoid manual `ChangeDetectorRef.detectChanges()` calls; if you find
  yourself needing one, the state is probably not flowing through a signal
  correctly.

## File & naming conventions

- One concern per file: component class + inline template only for trivial
  components (a handful of lines); otherwise separate `.html`/`.scss`.
- Selector prefix `bc-` for this project's components (BikeCare), e.g.
  `bc-bicycle-card`, `bc-maintenance-schedule-list`.
- Suffix-free class names matching Angular's current schematics output:
  `BicycleCard` + `@Component` is fine without a forced `Component` suffix,
  but stay consistent with whatever the rest of the codebase already does —
  don't mix styles.
- Feature-folder structure under `frontend/src/app/`, e.g.:
  ```
  app/
    bicycles/
      bicycle-list/
      bicycle-card/
      bicycle.service.ts
      bicycle.model.ts
    maintenance/
      maintenance-schedule/
      service-record-form/
    core/
      interceptors/
      guards/
  ```

## Quick checklist for any new/edited component

- [ ] Standalone, explicit `imports: [...]`, no NgModule.
- [ ] State as `signal()`/`computed()`, not manual fields + manual CD.
- [ ] `input()`/`output()`/`model()` instead of decorators.
- [ ] `inject()` instead of constructor injection.
- [ ] `@if`/`@for`(`track`)/`@switch` instead of structural directive stars.
- [ ] Reactive, typed forms — no `[(ngModel)]` on forms.
- [ ] RxJS only at async boundaries, bridged to signals with `toSignal()`.
