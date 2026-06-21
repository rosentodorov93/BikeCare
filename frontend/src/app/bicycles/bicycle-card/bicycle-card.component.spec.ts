import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Bicycle } from '../bicycle.model';
import { BikeComponent } from '../../components/component.model';
import { BicycleCardComponent } from './bicycle-card.component';

const mockBicycle: Bicycle = {
  id: '1',
  name: 'Test Bike',
  brand: 'Trek',
  model: 'Domane',
  type: 'road',
  purchaseDate: null,
  frameSize: null,
  wheelSize: '700c',
  imageUrl: null,
  totalDistance: 500,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const makeComponent = (wearState: number, id = 'c1'): BikeComponent => ({
  id,
  bikeId: '1',
  name: 'Chain',
  serviceIntervalKm: 2000,
  distanceAtService: 0,
  wearState,
});

describe('BicycleCardComponent', () => {
  let fixture: ComponentFixture<BicycleCardComponent>;
  let component: BicycleCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BicycleCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(BicycleCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('bicycle', mockBicycle);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('typeLabel', () => {
    it('should return label for known type', () => {
      expect((component as any).typeLabel()).toBe('Road');
    });

    it('should return label for mountain type', () => {
      fixture.componentRef.setInput('bicycle', { ...mockBicycle, type: 'mountain' });
      fixture.detectChanges();
      expect((component as any).typeLabel()).toBe('Mountain');
    });
  });

  describe('photo', () => {
    it('shows the placeholder image when the bike has no photo', () => {
      const img: HTMLImageElement = fixture.nativeElement.querySelector('.card-photo');
      expect(img).toBeTruthy();
      expect(img.getAttribute('src')).toBe('/images/bike-placeholder.svg');
    });

    it('shows the uploaded photo when imageUrl is set', () => {
      fixture.componentRef.setInput('bicycle', {
        ...mockBicycle,
        imageUrl: 'data:image/jpeg;base64,abc',
      });
      fixture.detectChanges();
      const img: HTMLImageElement = fixture.nativeElement.querySelector('.card-photo');
      expect(img.getAttribute('src')).toBe('data:image/jpeg;base64,abc');
    });
  });

  describe('wearLevel()', () => {
    it('should return "ok" for wear <= 50', () => {
      expect((component as any).wearLevel(0)).toBe('ok');
      expect((component as any).wearLevel(50)).toBe('ok');
    });

    it('should return "warn" for wear 51–80', () => {
      expect((component as any).wearLevel(51)).toBe('warn');
      expect((component as any).wearLevel(80)).toBe('warn');
    });

    it('should return "danger" for wear 81–99', () => {
      expect((component as any).wearLevel(81)).toBe('danger');
      expect((component as any).wearLevel(99)).toBe('danger');
    });

    it('should return "worn" for wear >= 100', () => {
      expect((component as any).wearLevel(100)).toBe('worn');
      expect((component as any).wearLevel(150)).toBe('worn');
    });
  });

  describe('overallHealth', () => {
    it('should return "ok" when no components', () => {
      expect((component as any).overallHealth()).toBe('ok');
    });

    it('should return "ok" when all components are below 50%', () => {
      fixture.componentRef.setInput('components', [makeComponent(10), makeComponent(40)]);
      fixture.detectChanges();
      expect((component as any).overallHealth()).toBe('ok');
    });

    it('should return "warn" when worst component is in warn range', () => {
      fixture.componentRef.setInput('components', [makeComponent(10), makeComponent(60)]);
      fixture.detectChanges();
      expect((component as any).overallHealth()).toBe('warn');
    });

    it('should return "danger" when worst component is in danger range', () => {
      fixture.componentRef.setInput('components', [makeComponent(60), makeComponent(85)]);
      fixture.detectChanges();
      expect((component as any).overallHealth()).toBe('danger');
    });

    it('should return "worn" when any component is at or over 100%', () => {
      fixture.componentRef.setInput('components', [makeComponent(85), makeComponent(100)]);
      fixture.detectChanges();
      expect((component as any).overallHealth()).toBe('worn');
    });
  });

  describe('dueCount', () => {
    it('should be 0 with no components', () => {
      expect((component as any).dueCount()).toBe(0);
    });

    it('should count only components at or over 100%', () => {
      fixture.componentRef.setInput('components', [
        makeComponent(99, 'c1'),
        makeComponent(100, 'c2'),
        makeComponent(120, 'c3'),
      ]);
      fixture.detectChanges();
      expect((component as any).dueCount()).toBe(2);
    });
  });

  describe('cardClass', () => {
    it('should return "card" when no components are provided', () => {
      expect((component as any).cardClass()).toBe('card');
    });

    it('should return "card card--ok" for healthy components', () => {
      fixture.componentRef.setInput('components', [makeComponent(10)]);
      fixture.detectChanges();
      expect((component as any).cardClass()).toBe('card card--ok');
    });

    it('should return "card card--worn" when a component is due', () => {
      fixture.componentRef.setInput('components', [makeComponent(100)]);
      fixture.detectChanges();
      expect((component as any).cardClass()).toBe('card card--worn');
    });
  });

  describe('distance row', () => {
    it('should not render .dist-row when periodDistanceKm is not provided', () => {
      const row: HTMLElement | null = fixture.nativeElement.querySelector('.dist-row');
      expect(row).toBeNull();
    });

    it('should render .dist-row when periodDistanceKm is set', () => {
      fixture.componentRef.setInput('periodDistanceKm', 42);
      fixture.detectChanges();
      const row: HTMLElement | null = fixture.nativeElement.querySelector('.dist-row');
      expect(row).toBeTruthy();
    });

    it('should display the period distance value and label', () => {
      fixture.componentRef.setInput('periodDistanceKm', 120);
      fixture.componentRef.setInput('periodLabel', 'This Month');
      fixture.detectChanges();
      const text: string = fixture.nativeElement.querySelector('.dist-row').textContent;
      expect(text).toContain('120');
      expect(text).toContain('This Month');
    });

    it('should display bicycle().totalDistance in the dist-row', () => {
      fixture.componentRef.setInput('periodDistanceKm', 10);
      fixture.detectChanges();
      const text: string = fixture.nativeElement.querySelector('.dist-row').textContent;
      expect(text).toContain('500'); // mockBicycle.totalDistance = 500
    });
  });
});
