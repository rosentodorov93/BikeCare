import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from './auth/auth.service';

const AUTH_ROUTES = ['/login', '/register'];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly showShell = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => !AUTH_ROUTES.some((path) => (event as NavigationEnd).urlAfterRedirects.startsWith(path))),
    ),
    { initialValue: !AUTH_ROUTES.some((path) => this.router.url.startsWith(path)) },
  );

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
