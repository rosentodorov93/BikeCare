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
  DEFAULT_BIKE_IMAGE,
  WHEEL_SIZES,
  WheelSize,
} from '../bicycle.model';
import { BicycleService } from '../bicycle.service';
import { COMPONENT_LIST_TYPES, ComponentListType } from '../../components/component.model';

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
  protected readonly componentListTypes = COMPONENT_LIST_TYPES;

  protected readonly id = this.route.snapshot.paramMap.get('id');
  protected readonly isEdit = computed(() => this.id !== null);

  protected readonly submitting = signal(false);
  protected readonly loadError = signal(false);

  protected readonly placeholder = DEFAULT_BIKE_IMAGE;
  // Holds the bike photo as a base64 data URL (or null when none is set). Kept
  // as a signal rather than a form control to avoid File/null typing friction
  // with the nonNullable form builder.
  protected readonly imageUrl = signal<string | null>(null);
  protected readonly imageError = signal<string | null>(null);

  protected readonly form = this.fb.group({
    name: this.fb.control('', { validators: [Validators.required] }),
    brand: this.fb.control('', { validators: [Validators.required] }),
    model: this.fb.control('', { validators: [Validators.required] }),
    type: this.fb.control<BicycleType>('road', { validators: [Validators.required] }),
    purchaseDate: this.fb.control<string | null>(null),
    frameSize: this.fb.control<string | null>(null),
    wheelSize: this.fb.control<WheelSize | null>(null),
    // Create-only: seeds the bike's components. Ignored on edit (see submit()).
    componentListType: this.fb.control<ComponentListType>('no_suspension', {
      validators: [Validators.required],
    }),
  });

  constructor() {
    if (this.id) {
      this.service.getById(this.id).subscribe({
        next: (bike) => {
          this.form.patchValue(bike);
          this.imageUrl.set(bike.imageUrl);
        },
        error: () => this.loadError.set(true),
      });
    }
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.imageError.set(null);
    if (!file.type.startsWith('image/')) {
      this.imageError.set('Please choose an image file.');
      return;
    }
    // Guard against very large originals before we even decode them.
    if (file.size > 8 * 1024 * 1024) {
      this.imageError.set('Image is too large (max 8 MB).');
      return;
    }

    downscaleImage(file)
      .then((dataUrl) => this.imageUrl.set(dataUrl))
      .catch(() => this.imageError.set("Couldn't read that image."));
    // Allow re-selecting the same file later.
    input.value = '';
  }

  protected clearImage(): void {
    this.imageUrl.set(null);
    this.imageError.set(null);
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
      imageUrl: this.imageUrl(),
    };
    // Only attach the component list type when creating — edits never touch
    // the existing components.
    if (!this.isEdit()) {
      payload.componentListType = value.componentListType;
    }

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

// Longest edge of the stored image. Keeps the base64 payload small enough to
// travel in the JSON body and sit comfortably in SQLite.
const MAX_IMAGE_DIMENSION = 800;

// Reads an image File, scales it down so its longest edge is at most
// MAX_IMAGE_DIMENSION, and returns a JPEG data URL. Images already within the
// limit are re-encoded at the same size (still compresses photos).
function downscaleImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode failed'));
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('no 2d context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
