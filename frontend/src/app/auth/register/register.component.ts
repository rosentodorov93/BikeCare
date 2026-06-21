import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'bc-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    username: this.fb.control('', {
      validators: [Validators.required, Validators.minLength(3)],
    }),
    email: this.fb.control('', { validators: [Validators.required, Validators.email] }),
    password: this.fb.control('', {
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set(null);
    this.submitting.set(true);
    const { username, email, password } = this.form.getRawValue();

    this.auth.register({ username: username.trim(), email: email.trim(), password }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err: unknown) => {
        this.submitting.set(false);
        this.error.set(this.errorMessage(err));
      },
    });
  }

  private errorMessage(err: unknown): string {
    const code =
      err instanceof HttpErrorResponse
        ? (err.error as { error?: { code?: string } } | null)?.error?.code
        : undefined;
    if (code === 'EMAIL_TAKEN') {
      return 'That email is already registered.';
    }
    if (code === 'USERNAME_TAKEN') {
      return 'That username is already taken.';
    }
    return 'Could not create your account. Please try again.';
  }
}
