import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ComponentIconComponent } from './component-icon.component';

describe('ComponentIconComponent', () => {
  let fixture: ComponentFixture<ComponentIconComponent>;
  let component: ComponentIconComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentIconComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ComponentIconComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('name', 'chain');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render an SVG element', () => {
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('should set width and height from the size input', () => {
    fixture.componentRef.setInput('size', 32);
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('width')).toBe('32');
    expect(svg.getAttribute('height')).toBe('32');
  });

  it('should default size to 24', () => {
    expect(component.size()).toBe(24);
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('width')).toBe('24');
  });

  it('should compute key as lowercase of name', () => {
    fixture.componentRef.setInput('name', 'Brake Pads');
    fixture.detectChanges();
    expect((component as any).key()).toBe('brake pads');
  });

  const knownNames = ['chain', 'brake pads', 'tires', 'cables', 'cassette', 'crankset', 'bottom bracket', 'front fork shock', 'rear shock'];

  knownNames.forEach(name => {
    it(`should render without error for known component name "${name}"`, () => {
      fixture.componentRef.setInput('name', name);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('svg')).not.toBeNull();
    });
  });

  it('should render fallback SVG for an unknown component name', () => {
    fixture.componentRef.setInput('name', 'unknown-part');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('svg')).not.toBeNull();
  });
});
