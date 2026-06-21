import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { authGuard, redirectIfAuthenticatedGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  let authSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated']);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authSpy }],
    });
    router = TestBed.inject(Router);
  });

  function run(guard: typeof authGuard) {
    return TestBed.runInInjectionContext(() => guard({} as never, {} as never));
  }

  it('should allow navigation when authenticated', () => {
    authSpy.isAuthenticated.and.returnValue(true);
    expect(run(authGuard)).toBeTrue();
  });

  it('should redirect to /login when not authenticated', () => {
    authSpy.isAuthenticated.and.returnValue(false);
    const result = run(authGuard);
    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });
});

describe('redirectIfAuthenticatedGuard', () => {
  let authSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated']);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authSpy }],
    });
    router = TestBed.inject(Router);
  });

  function run() {
    return TestBed.runInInjectionContext(() =>
      redirectIfAuthenticatedGuard({} as never, {} as never),
    );
  }

  it('should allow navigation when not authenticated', () => {
    authSpy.isAuthenticated.and.returnValue(false);
    expect(run()).toBeTrue();
  });

  it('should redirect to /dashboard when already authenticated', () => {
    authSpy.isAuthenticated.and.returnValue(true);
    const result = run();
    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/dashboard');
  });
});
