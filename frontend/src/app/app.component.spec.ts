import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { AuthService } from './auth/auth.service';
import { User } from './auth/auth.model';

@Component({ selector: 'bc-stub', template: '' })
class StubComponent {}

const mockUser: User = { id: 'u1', username: 'rider', email: 'rider@example.com' };

describe('AppComponent', () => {
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated', 'logout']);
    authSpy.isAuthenticated.and.returnValue(false);
    Object.defineProperty(authSpy, 'currentUser', { value: () => null, configurable: true });

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([
          { path: 'dashboard', component: StubComponent },
          { path: 'login', component: StubComponent },
        ]),
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render a router-outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
  });

  it('should show the sidenav on a non-auth route like /dashboard', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/dashboard');

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-sidenav')).not.toBeNull();
  });

  it('should hide the sidenav on /login', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/login');

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-sidenav')).toBeNull();
  });

  it('should hide the header logout button when not authenticated', () => {
    authSpy.isAuthenticated.and.returnValue(false);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.header-user')).toBeNull();
  });

  it('should show the username and logout button when authenticated', () => {
    authSpy.isAuthenticated.and.returnValue(true);
    Object.defineProperty(authSpy, 'currentUser', { value: () => mockUser, configurable: true });
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const headerUser = fixture.nativeElement.querySelector('.header-user');
    expect(headerUser).not.toBeNull();
    expect(headerUser.textContent).toContain('rider');
  });

  it('should call auth.logout() and navigate to /login when the logout button is clicked', () => {
    authSpy.isAuthenticated.and.returnValue(true);
    Object.defineProperty(authSpy, 'currentUser', { value: () => mockUser, configurable: true });
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.header-user button',
    );
    button.click();

    expect(authSpy.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
