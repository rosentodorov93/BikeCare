import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../auth.service';
import { User } from '../auth.model';

const mockUser: User = { id: 'u1', username: 'rider', email: 'rider@example.com' };

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let authSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['register']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authSpy }],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('form validation', () => {
    it('should be invalid when fields are empty', () => {
      expect((component as any).form.invalid).toBeTrue();
    });

    it('should be invalid when username is too short', () => {
      (component as any).form.patchValue({
        username: 'ab',
        email: 'rider@example.com',
        password: 'secret123',
      });
      expect((component as any).form.invalid).toBeTrue();
    });

    it('should be invalid when password is too short', () => {
      (component as any).form.patchValue({
        username: 'rider',
        email: 'rider@example.com',
        password: 'short',
      });
      expect((component as any).form.invalid).toBeTrue();
    });

    it('should be valid with all fields satisfying their rules', () => {
      (component as any).form.patchValue({
        username: 'rider',
        email: 'rider@example.com',
        password: 'secret123',
      });
      expect((component as any).form.valid).toBeTrue();
    });
  });

  describe('submit()', () => {
    it('should mark all touched and abort when form is invalid', () => {
      (component as any).submit();
      expect(authSpy.register).not.toHaveBeenCalled();
      expect((component as any).form.touched).toBeTrue();
    });

    it('should register and navigate to dashboard on success', fakeAsync(() => {
      authSpy.register.and.returnValue(of(mockUser));
      (component as any).form.patchValue({
        username: 'rider',
        email: 'rider@example.com',
        password: 'secret123',
      });
      (component as any).submit();
      tick();

      expect(authSpy.register).toHaveBeenCalledWith({
        username: 'rider',
        email: 'rider@example.com',
        password: 'secret123',
      });
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    }));

    it('should show a specific message for EMAIL_TAKEN', fakeAsync(() => {
      authSpy.register.and.returnValue(
        throwError(
          () =>
            new HttpErrorResponse({ status: 409, error: { error: { code: 'EMAIL_TAKEN' } } }),
        ),
      );
      (component as any).form.patchValue({
        username: 'rider',
        email: 'rider@example.com',
        password: 'secret123',
      });
      (component as any).submit();
      tick();

      expect((component as any).error()).toBe('That email is already registered.');
      expect((component as any).submitting()).toBeFalse();
    }));

    it('should show a specific message for USERNAME_TAKEN', fakeAsync(() => {
      authSpy.register.and.returnValue(
        throwError(
          () =>
            new HttpErrorResponse({ status: 409, error: { error: { code: 'USERNAME_TAKEN' } } }),
        ),
      );
      (component as any).form.patchValue({
        username: 'rider',
        email: 'rider@example.com',
        password: 'secret123',
      });
      (component as any).submit();
      tick();

      expect((component as any).error()).toBe('That username is already taken.');
    }));

    it('should show a generic message for other failures', fakeAsync(() => {
      authSpy.register.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500, error: {} })),
      );
      (component as any).form.patchValue({
        username: 'rider',
        email: 'rider@example.com',
        password: 'secret123',
      });
      (component as any).submit();
      tick();

      expect((component as any).error()).toBe('Could not create your account. Please try again.');
      expect(router.navigate).not.toHaveBeenCalled();
    }));
  });
});
