import { Component, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  BICYCLE_TYPES,
  BicyclePayload,
  BicycleType,
  WHEEL_SIZES,
  WheelSize,
} from '../bicycle.model';
import { BicycleService } from '../bicycle.service';

@Component({
  selector: 'bc-bicycle-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './bicycle-form.component.html',
  styleUrl: './bicycle-form.component.scss',
})
export class BicycleFormComponent {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly service = inject(BicycleService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly types = BICYCLE_TYPES;
  protected readonly wheelSizes = WHEEL_SIZES;

  protected readonly id = this.route.snapshot.paramMap.get('id');
  protected readonly isEdit = computed(() => this.id !== null);

  protected readonly submitting = signal(false);
  protected readonly loadError = signal(false);

  protected readonly form = this.fb.group({
    name: this.fb.control('', { validators: [Validators.required] }),
    brand: this.fb.control('', { validators: [Validators.required] }),
    model: this.fb.control('', { validators: [Validators.required] }),
    type: this.fb.control<BicycleType>('road', { validators: [Validators.required] }),
    purchaseDate: this.fb.control<string | null>(null),
    frameSize: this.fb.control<string | null>(null),
    wheelSize: this.fb.control<WheelSize | null>(null),
  });

  constructor() {
    if (this.id) {
      this.service.getById(this.id).subscribe({
        next: (bike) => this.form.patchValue(bike),
        error: () => this.loadError.set(true),
      });
    }
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: BicyclePayload = {
      name: value.name.trim(),
      brand: value.brand.trim(),
      model: value.model.trim(),
      type: value.type,
      purchaseDate: value.purchaseDate || null,
      frameSize: value.frameSize?.trim() || null,
      wheelSize: value.wheelSize || null,
    };

    this.submitting.set(true);
    const request$ = this.id
      ? this.service.update(this.id, payload)
      : this.service.create(payload);

    request$.subscribe({
      next: (bike) => this.router.navigate(['/bicycles', bike.id]),
      error: () => {
        this.submitting.set(false);
        alert('Failed to save the bike. Please check the fields and try again.');
      },
    });
  }
}
