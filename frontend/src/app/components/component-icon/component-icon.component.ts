import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// Renders a small inline SVG for a known component name (themeable via
// currentColor). Falls back to a generic cog for unknown names. Keys are the
// lowercased component names produced by the backend.
@Component({
  selector: 'bc-component-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (key()) {
        @case ('chain') {
          <circle cx="7.5" cy="12" r="3.2" />
          <circle cx="16.5" cy="12" r="3.2" />
          <path d="M10.7 12h2.6" />
        }
        @case ('brake pads') {
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2.3" />
          <path d="M5 9h-2M5 15h-2" />
        }
        @case ('tires') {
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="4" />
        }
        @case ('cables') {
          <path d="M4 18c3 0 3-12 8-12 3 0 4 4 8 4" />
          <circle cx="4" cy="18" r="1" />
        }
        @case ('cassette') {
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="5.5" />
          <circle cx="12" cy="12" r="2.5" />
        }
        @case ('crankset') {
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2v3.8M12 18.2V22M2 12h3.8M18.2 12H22" />
        }
        @case ('bottom bracket') {
          <rect x="3.5" y="9" width="17" height="6" rx="2" />
          <circle cx="12" cy="12" r="2" />
        }
        @case ('front fork shock') {
          <path d="M9 3v6M15 3v6" />
          <path d="M9 9c0 4-3 5-3 8M15 9c0 4 3 5 3 8" />
          <path d="M7 13h4M13 13h4" />
        }
        @case ('rear shock') {
          <circle cx="6" cy="6" r="1.6" />
          <circle cx="18" cy="18" r="1.6" />
          <path d="M7.2 7.2l2 2M14 10l-2 2 2 0-2 2 2 0-2 2" />
        }
        @default {
          <circle cx="12" cy="12" r="3" />
          <path
            d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"
          />
        }
      }
    </svg>
  `,
})
export class ComponentIconComponent {
  readonly name = input.required<string>();

  protected readonly key = computed(() => this.name().toLowerCase());
}
