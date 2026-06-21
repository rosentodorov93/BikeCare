import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { User } from './auth.model';

const mockUser: User = { id: 'u1', username: 'rider', email: 'rider@example.com' };

function configureFreshService(): AuthService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  return TestBed.inject(AuthService);
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should start with no current user when localStorage is empty', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  describe('login()', () => {
    it('should post credentials and store the session on success', () => {
      let result: User | undefined;
      service
        .login({ email: 'rider@example.com', password: 'secret123' })
        .subscribe((u) => (result = u));

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'rider@example.com', password: 'secret123' });
      req.flush({ data: { user: mockUser, token: 'jwt-token' } });

      expect(result).toEqual(mockUser);
      expect(service.currentUser()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBeTrue();
      expect(service.getToken()).toBe('jwt-token');
      expect(localStorage.getItem('bikecare_user')).toBe(JSON.stringify(mockUser));
    });
  });

  describe('register()', () => {
    it('should post the new account and store the session on success', () => {
      let result: User | undefined;
      service
        .register({ username: 'rider', email: 'rider@example.com', password: 'secret123' })
        .subscribe((u) => (result = u));

      const req = httpMock.expectOne('/api/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        username: 'rider',
        email: 'rider@example.com',
        password: 'secret123',
      });
      req.flush({ data: { user: mockUser, token: 'jwt-token' } });

      expect(result).toEqual(mockUser);
      expect(service.currentUser()).toEqual(mockUser);
      expect(service.getToken()).toBe('jwt-token');
    });
  });

  describe('logout()', () => {
    it('should clear the stored session and reset currentUser', () => {
      service.login({ email: 'rider@example.com', password: 'secret123' }).subscribe();
      httpMock
        .expectOne('/api/auth/login')
        .flush({ data: { user: mockUser, token: 'jwt-token' } });

      service.logout();

      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.getToken()).toBeNull();
      expect(localStorage.getItem('bikecare_user')).toBeNull();
    });
  });

  describe('seeding from localStorage', () => {
    it('should seed currentUser from a previously stored session', () => {
      localStorage.setItem('bikecare_user', JSON.stringify(mockUser));
      localStorage.setItem('bikecare_token', 'jwt-token');

      const seededService = configureFreshService();

      expect(seededService.currentUser()).toEqual(mockUser);
      expect(seededService.isAuthenticated()).toBeTrue();
    });

    it('should treat malformed stored user JSON as logged out', () => {
      localStorage.setItem('bikecare_user', 'not-json');

      const seededService = configureFreshService();

      expect(seededService.currentUser()).toBeNull();
    });
  });
});
