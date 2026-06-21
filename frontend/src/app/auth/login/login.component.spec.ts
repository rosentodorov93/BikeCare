import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../auth.service';
import { User } from '../auth.model';

const mockUser: User = { id: 'u1', username: 'rider', email: 'rider@example.com' };

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authSpy }],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(LoginComponent);
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

    it('should be invalid with a malformed email', () => {
      (component as any).form.patchValue({ email: 'not-an-email', password: 'secret123' });
      expect((component as any).form.invalid).toBeTrue();
    });

    it('should be valid with a proper email and a password', () => {
      (component as any).form.patchValue({ email: 'rider@example.com', password: 'secret123' });
      expect((component as any).form.valid).toBeTrue();
    });
  });

  describe('submit()', () => {
    it('should mark all touched and abort when form is invalid', () => {
      (component as any).submit();
      expect(authSpy.login).not.toHaveBeenCalled();
      expect((component as any).form.touched).toBeTrue();
    });

    it('should not submit when already submitting', () => {
      (component as any).submitting.set(true);
      (component as any).form.patchValue({ email: 'rider@example.com', password: 'secret123' });
      (component as any).submit();
      expect(authSpy.login).not.toHaveBeenCalled();
    });

    it('should log in and navigate to dashboard on success', fakeAsync(() => {
      authSpy.login.and.returnValue(of(mockUser));
      (component as any).form.patchValue({ email: 'rider@example.com', password: 'secret123' });
      (component as any).submit();
      tick();

      expect(authSpy.login).toHaveBeenCalledWith({
        email: 'rider@example.com',
        password: 'secret123',
      });
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    }));

    it('should show an error and reset submitting on failure', fakeAsync(() => {
      authSpy.login.and.returnValue(throwError(() => new Error('invalid credentials')));
      (component as any).form.patchValue({ email: 'rider@example.com', password: 'wrong' });
      (component as any).submit();
      tick();

      expect((component as any).submitting()).toBeFalse();
      expect((component as any).error()).toBe('Invalid email or password.');
      expect(router.navigate).not.toHaveBeenCalled();
    }));
  });
});
