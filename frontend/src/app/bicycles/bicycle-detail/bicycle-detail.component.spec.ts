import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BicycleDetailComponent } from './bicycle-detail.component';
import { BicycleService } from '../bicycle.service';
import { ComponentService } from '../../components/component.service';
import { Bicycle } from '../bicycle.model';
import { BikeComponent } from '../../components/component.model';

const mockBicycle: Bicycle = {
  id: 'b1',
  name: 'Road Bike',
  brand: 'Trek',
  model: 'Domane',
  type: 'road',
  purchaseDate: '2024-01-15',
  frameSize: '56cm',
  wheelSize: '700c',
  totalDistance: 1200,
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

const mockComponent: BikeComponent = {
  id: 'c1',
  bikeId: 'b1',
  name: 'Chain',
  serviceIntervalKm: 2000,
  distanceAtService: 0,
  wearState: 60,
};

describe('BicycleDetailComponent', () => {
  let fixture: ComponentFixture<BicycleDetailComponent>;
  let component: BicycleDetailComponent;
  let bicycleSpy: jasmine.SpyObj<BicycleService>;
  let componentSpy: jasmine.SpyObj<ComponentService>;
  let router: Router;

  beforeEach(async () => {
    bicycleSpy = jasmine.createSpyObj('BicycleService', ['getById', 'delete']);
    componentSpy = jasmine.createSpyObj('ComponentService', ['getByBike', 'resetService']);

    bicycleSpy.getById.and.returnValue(of(mockBicycle));
    componentSpy.getByBike.and.returnValue(of([mockComponent]));

    await TestBed.configureTestingModule({
      imports: [BicycleDetailComponent],
      providers: [
        provideRouter([]),
        { provide: BicycleService, useValue: bicycleSpy },
        { provide: ComponentService, useValue: componentSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (_: string) => 'b1' } } },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(BicycleDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should read the id from the route', () => {
    expect((component as any).id).toBe('b1');
  });

  it('should load components on init', () => {
    expect(componentSpy.getByBike).toHaveBeenCalledWith('b1');
    expect((component as any).components()).toEqual([mockComponent]);
  });

  it('should transition to loaded state after service emits', fakeAsync(() => {
    fixture.detectChanges();
    tick(0);
    expect((component as any).status()).toBe('loaded');
  }));

  it('should expose bicycle after load', fakeAsync(() => {
    fixture.detectChanges();
    tick(0);
    expect((component as any).bicycle()).toEqual(mockBicycle);
  }));

  it('should compute typeLabel from bicycle type', fakeAsync(() => {
    fixture.detectChanges();
    tick(0);
    expect((component as any).typeLabel()).toBe('Road');
  }));

  it('should expose the bicycle computed from the state signal', () => {
    // toSignal resolves synchronously for synchronous observables, so bicycle
    // is available immediately after createComponent.
    expect((component as any).bicycle()).toBeTruthy();
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
      expect((component as any).wearLevel(110)).toBe('worn');
    });
  });

  describe('resetComponent()', () => {
    it('should do nothing when another reset is in progress', () => {
      (component as any).resettingId.set('other-id');
      (component as any).resetComponent(mockComponent);
      expect(componentSpy.resetService).not.toHaveBeenCalled();
    });

    it('should update the component in the list after successful reset', fakeAsync(() => {
      const updated: BikeComponent = { ...mockComponent, wearState: 0 };
      componentSpy.resetService.and.returnValue(of(updated));
      spyOn(window, 'confirm').and.returnValue(true);

      (component as any).resetComponent(mockComponent);
      tick();

      const comps: BikeComponent[] = (component as any).components();
      expect(comps.find((c: BikeComponent) => c.id === 'c1')?.wearState).toBe(0);
      expect((component as any).resettingId()).toBeNull();
    }));

    it('should not call resetService when user cancels the confirm dialog', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      (component as any).resetComponent(mockComponent);
      expect(componentSpy.resetService).not.toHaveBeenCalled();
    });
  });

  describe('confirmDelete()', () => {
    it('should do nothing when deleting is already in progress', fakeAsync(() => {
      fixture.detectChanges();
      tick(0);
      (component as any).deleting.set(true);
      (component as any).confirmDelete();
      expect(bicycleSpy.delete).not.toHaveBeenCalled();
    }));

    it('should navigate to /bicycles after successful deletion', fakeAsync(() => {
      fixture.detectChanges();
      tick(0);
      bicycleSpy.delete.and.returnValue(of(undefined));
      spyOn(window, 'confirm').and.returnValue(true);

      (component as any).confirmDelete();
      tick();

      expect(bicycleSpy.delete).toHaveBeenCalledWith('b1');
      expect(router.navigate).toHaveBeenCalledWith(['/bicycles']);
    }));

    it('should not call delete when user cancels the confirm dialog', fakeAsync(() => {
      fixture.detectChanges();
      tick(0);
      spyOn(window, 'confirm').and.returnValue(false);
      (component as any).confirmDelete();
      expect(bicycleSpy.delete).not.toHaveBeenCalled();
    }));
  });
});

describe('BicycleDetailComponent — error state', () => {
  it('should transition to error state when bicycle fetch fails', async () => {
    const bicycleSpy = jasmine.createSpyObj<BicycleService>('BicycleService', ['getById', 'delete']);
    const componentSpy = jasmine.createSpyObj<ComponentService>('ComponentService', ['getByBike', 'resetService']);
    bicycleSpy.getById.and.returnValue(throwError(() => new Error('not found')));
    componentSpy.getByBike.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [BicycleDetailComponent],
      providers: [
        provideRouter([]),
        { provide: BicycleService, useValue: bicycleSpy },
        { provide: ComponentService, useValue: componentSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (_: string) => 'b1' } } },
        },
      ],
    }).compileComponents();

    return new Promise<void>((resolve) => {
      const f = TestBed.createComponent(BicycleDetailComponent);
      f.detectChanges();
      setTimeout(() => {
        expect((f.componentInstance as any).status()).toBe('error');
        expect((f.componentInstance as any).bicycle()).toBeNull();
        resolve();
      }, 0);
    });
  });
});
