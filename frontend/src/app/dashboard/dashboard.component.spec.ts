import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from './dashboard.service';
import { DashboardData } from './dashboard.model';

const mockData: DashboardData = {
  period: 'month',
  range: { from: '2026-06-01', to: '2026-06-30' },
  stats: { totalBikes: 2, distanceKm: 150, activityCount: 10, maintenanceEvents: 1 },
  upcomingJobs: [],
  bikes: [
    { id: '1', name: 'Road Bike', type: 'road', periodDistanceKm: 100, totalDistance: 1000 },
    { id: '2', name: 'MTB', type: 'mountain', periodDistanceKm: 50, totalDistance: 500 },
  ],
};

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let serviceSpy: jasmine.SpyObj<DashboardService>;

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('DashboardService', ['get']);
    serviceSpy.get.and.returnValue(of(mockData));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: DashboardService, useValue: serviceSpy },
        provideRouter([]),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with period set to "month"', () => {
    expect((component as any).period()).toBe('month');
  });

  it('should transition to loaded state after service emits', fakeAsync(() => {
    fixture.detectChanges();
    tick(0);
    fixture.detectChanges();
    expect((component as any).status()).toBe('loaded');
  }));

  it('should transition to error state when service fails', fakeAsync(() => {
    serviceSpy.get.and.returnValue(throwError(() => new Error('network error')));
    fixture.detectChanges();
    tick(0);
    fixture.detectChanges();
    expect((component as any).status()).toBe('error');
  }));

  it('should expose stats from loaded data', fakeAsync(() => {
    fixture.detectChanges();
    tick(0);
    fixture.detectChanges();
    expect((component as any).stats()).toEqual(mockData.stats);
  }));

  it('should expose bikes from loaded data', fakeAsync(() => {
    fixture.detectChanges();
    tick(0);
    fixture.detectChanges();
    expect((component as any).bikes()).toEqual(mockData.bikes);
  }));

  it('should be in loading state while awaiting service response', () => {
    const subject = new Subject<DashboardData>();
    serviceSpy.get.and.returnValue(subject.asObservable());
    fixture.detectChanges();
    expect((component as any).status()).toBe('loading');
  });

  it('should change period signal on setPeriod()', () => {
    (component as any).setPeriod('week');
    expect((component as any).period()).toBe('week');
  });

  it('should call service with the initial period on load', fakeAsync(() => {
    fixture.detectChanges();
    tick(0);
    expect(serviceSpy.get).toHaveBeenCalledWith('month');
  }));

  it('should update period signal when setPeriod is called', fakeAsync(() => {
    fixture.detectChanges();
    tick(0);
    (component as any).setPeriod('year');
    expect((component as any).period()).toBe('year');
  }));

  describe('wearLevel()', () => {
    it('should return "warn" for wear <= 80', () => {
      expect((component as any).wearLevel(80)).toBe('warn');
      expect((component as any).wearLevel(50)).toBe('warn');
    });

    it('should return "danger" for wear > 80 and < 100', () => {
      expect((component as any).wearLevel(81)).toBe('danger');
      expect((component as any).wearLevel(99)).toBe('danger');
    });

    it('should return "worn" for wear >= 100', () => {
      expect((component as any).wearLevel(100)).toBe('worn');
      expect((component as any).wearLevel(150)).toBe('worn');
    });
  });

  describe('barWidth()', () => {
    it('should return 0 when max distance is 0', fakeAsync(() => {
      serviceSpy.get.and.returnValue(of({ ...mockData, bikes: [] }));
      fixture.detectChanges();
      tick(0);
      expect((component as any).barWidth(100)).toBe(0);
    }));

    it('should return 100 for the bike with max distance', fakeAsync(() => {
      fixture.detectChanges();
      tick(0);
      // maxPeriodDistance = 100 (Road Bike)
      expect((component as any).barWidth(100)).toBe(100);
    }));

    it('should scale proportionally', fakeAsync(() => {
      fixture.detectChanges();
      tick(0);
      // 50 / 100 * 100 = 50
      expect((component as any).barWidth(50)).toBe(50);
    }));
  });

  describe('typeLabel()', () => {
    it('should return the human-readable label for known types', () => {
      expect((component as any).typeLabel('road')).toBe('Road');
      expect((component as any).typeLabel('mountain')).toBe('Mountain');
      expect((component as any).typeLabel('gravel')).toBe('Gravel');
    });

    it('should return the raw value for unknown types', () => {
      expect((component as any).typeLabel('unknown')).toBe('unknown');
    });
  });

  describe('periodSuffix', () => {
    it('should return the suffix for the current period', fakeAsync(() => {
      fixture.detectChanges();
      tick(0);
      // Default period is 'month'
      expect((component as any).periodSuffix()).toBe('This Month');
    }));

    it('should update when period changes', fakeAsync(() => {
      fixture.detectChanges();
      tick(0);
      (component as any).setPeriod('week');
      expect((component as any).periodSuffix()).toBe('This Week');
    }));
  });

  describe('maxPeriodDistance', () => {
    it('should return 0 when bikes list is empty', fakeAsync(() => {
      serviceSpy.get.and.returnValue(of({ ...mockData, bikes: [] }));
      fixture.detectChanges();
      tick(0);
      expect((component as any).maxPeriodDistance()).toBe(0);
    }));

    it('should return the highest periodDistanceKm among bikes', fakeAsync(() => {
      fixture.detectChanges();
      tick(0);
      expect((component as any).maxPeriodDistance()).toBe(100);
    }));
  });
});
