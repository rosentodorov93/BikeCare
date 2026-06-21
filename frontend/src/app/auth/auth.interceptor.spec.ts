import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { authErrorInterceptor, authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getToken', 'logout']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authSpy },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should attach an Authorization header when a token is present', () => {
    authSpy.getToken.and.returnValue('jwt-token');
    http.get('/api/bicycles').subscribe();

    const req = httpMock.expectOne('/api/bicycles');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    req.flush({});
  });

  it('should leave the request unmodified when there is no token', () => {
    authSpy.getToken.and.returnValue(null);
    http.get('/api/auth/login').subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });
});

describe('authErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getToken', 'logout']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authErrorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  afterEach(() => httpMock.verify());

  it('should log out and redirect to /login on a 401 response', () => {
    http.get('/api/bicycles').subscribe({ error: () => {} });
    const req = httpMock.expectOne('/api/bicycles');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authSpy.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should leave non-401 errors untouched and not log out', () => {
    http.get('/api/bicycles').subscribe({ error: () => {} });
    const req = httpMock.expectOne('/api/bicycles');
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(authSpy.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should still propagate the error to the caller', () => {
    let caught: unknown;
    http.get('/api/bicycles').subscribe({ error: (e) => (caught = e) });
    const req = httpMock.expectOne('/api/bicycles');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(caught).toBeTruthy();
  });
});
