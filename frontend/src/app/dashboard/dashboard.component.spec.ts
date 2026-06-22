import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from './dashboard.service';
import { DashboardData } from './dashboard.model';
import { BicycleService } from '../bicycles/bicycle.service';

const mockData: DashboardData = {
  period: 'month',
  range: { from: '2026-06-01', to: '2026-06-30' },
  stats: { totalBikes: 2, distanceKm: 150, activityCount: 10, maintenanceEvents: 1 },
  upcomingJobs: [],
  bikes: [
    {
      id: '1',
      name: 'Road Bike',
      type: 'road',
      imageUrl: null,
      periodDistanceKm: 100,
      totalDistance: 1000,
      periodServiceCount: 1,
      totalServiceCount: 3,
    },
    {
      id: '2',
      name: 'MTB',
      type: 'mountain',
      imageUrl: null,
      periodDistanceKm: 50,
      totalDistance: 500,
      periodServiceCount: 0,
      totalServiceCount: 2,
    },
  ],
};

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let serviceSpy: jasmine.SpyObj<DashboardService>;
  let bicycleSpy: jasmine.SpyObj<BicycleService>;

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('DashboardService', ['get']);
    serviceSpy.get.and.returnValue(of(mockData));
    bicycleSpy = jasmine.createSpyObj('BicycleService', ['downloadReport']);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: DashboardService, useValue: serviceSpy },
        { provide: BicycleService, useValue: bicycleSpy },
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

  it('renders a thumbnail per bike, using the placeholder when no photo is set', fakeAsync(() => {
    fixture.detectChanges();
    tick(0);
    fixture.detectChanges();
    const photos: HTMLImageElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.bike-thumb'),
    );
    expect(photos.length).toBe(2);
    expect(photos[0].getAttribute('src')).toBe('/images/bike-placeholder.svg');
  }));

  it('uses the uploaded photo for a bike that has an imageUrl', fakeAsync(() => {
    serviceSpy.get.and.returnValue(
      of({
        ...mockData,
        bikes: [{ ...mockData.bikes[0], imageUrl: 'data:image/jpeg;base64,abc' }],
      }),
    );
    const f = TestBed.createComponent(DashboardComponent);
    f.detectChanges();
    tick(0);
    f.detectChanges();
    const photo: HTMLImageElement = f.nativeElement.querySelector('.bike-thumb');
    expect(photo.getAttribute('src')).toBe('data:image/jpeg;base64,abc');
  }));

  it('renders period and total distance/service counts on each bike row', fakeAsync(() => {
    fixture.detectChanges();
    tick(0);
    fixture.detectChanges();
    const rows: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.bike-row'));
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('100'); // Road Bike periodDistanceKm
    expect(rows[0].textContent).toContain('1000'); // Road Bike totalDistance
    expect(rows[0].textContent).toContain('3'); // Road Bike totalServiceCount
    expect(rows[1].textContent).toContain('50'); // MTB periodDistanceKm
    expect(rows[1].textContent).toContain('500'); // MTB totalDistance
    expect(rows[1].textContent).toContain('2'); // MTB totalServiceCount
  }));

  describe('getReport()', () => {
    function fakeEvent(): Event {
      return jasmine.createSpyObj('Event', ['preventDefault', 'stopPropagation']);
    }

    it('does nothing when a download is already in progress', () => {
      (component as any).reportDownloadingId.set('1');
      (component as any).getReport(fakeEvent(), '1', 'Road Bike');
      expect(bicycleSpy.downloadReport).not.toHaveBeenCalled();
    });

    it('downloads the report and clears the downloading id on success', fakeAsync(() => {
      bicycleSpy.downloadReport.and.returnValue(of(new Blob(['x'])));
      spyOn(URL, 'createObjectURL').and.returnValue('blob:fake');
      spyOn(URL, 'revokeObjectURL');

      (component as any).getReport(fakeEvent(), '1', 'Road Bike');
      tick();

      expect(bicycleSpy.downloadReport).toHaveBeenCalledWith('1');
      expect((component as any).reportDownloadingId()).toBeNull();
    }));

    it('clears the downloading id when the download fails', fakeAsync(() => {
      bicycleSpy.downloadReport.and.returnValue(throwError(() => new Error('fail')));

      (component as any).getReport(fakeEvent(), '1', 'Road Bike');
      tick();

      expect((component as any).reportDownloadingId()).toBeNull();
    }));
  });

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

});
