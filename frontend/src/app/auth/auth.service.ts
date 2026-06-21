import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { AuthResult, LoginPayload, RegisterPayload, User } from './auth.model';

// Backend wraps every response in { data } — unwrap it at this boundary so the
// rest of the app works with plain domain objects.
interface ApiEnvelope<T> {
  data: T;
}

const TOKEN_KEY = 'bikecare_token';
const USER_KEY = 'bikecare_user';

function readStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/auth';

  // Seeded synchronously from localStorage so it's available before any
  // guard or template check runs on app bootstrap.
  readonly currentUser = signal<User | null>(readStoredUser());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  login(payload: LoginPayload): Observable<User> {
    return this.http.post<ApiEnvelope<AuthResult>>(`${this.baseUrl}/login`, payload).pipe(
      map((res) => res.data),
      tap((result) => this.storeSession(result)),
      map((result) => result.user),
    );
  }

  register(payload: RegisterPayload): Observable<User> {
    return this.http.post<ApiEnvelope<AuthResult>>(`${this.baseUrl}/register`, payload).pipe(
      map((res) => res.data),
      tap((result) => this.storeSession(result)),
      map((result) => result.user),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private storeSession(result: AuthResult): void {
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    this.currentUser.set(result.user);
  }
}
