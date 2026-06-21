import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { BicycleListComponent } from './bicycle-list.component';
import { BicycleService } from '../bicycle.service';
import { ComponentService } from '../../components/component.service';
import { Bicycle } from '../bicycle.model';
import { BikeComponent } from '../../components/component.model';

const makeBicycle = (id: string): Bicycle => ({
  id,
  name: `Bike ${id}`,
  brand: 'Trek',
  model: 'Test',
  type: 'road',
  purchaseDate: null,
  frameSize: null,
  wheelSize: null,
  imageUrl: null,
  totalDistance: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const makeComponent = (bikeId: string): BikeComponent => ({
  id: 'c1',
  bikeId,
  name: 'Chain',
  serviceIntervalKm: 2000,
  distanceAtService: 0,
  wearState: 20,
});

describe('BicycleListComponent', () => {
  let bicycleSpy: jasmine.SpyObj<BicycleService>;
  let componentSpy: jasmine.SpyObj<ComponentService>;

  // Helpers that create the component after mocks are configured.
  function createComponent() {
    const fixture = TestBed.createComponent(BicycleListComponent);
    return { fixture, component: fixture.componentInstance };
  }

  beforeEach(async () => {
    bicycleSpy = jasmine.createSpyObj('BicycleService', ['getAll']);
    componentSpy = jasmine.createSpyObj('ComponentService', ['getByBike']);

    await TestBed.configureTestingModule({
      imports: [BicycleListComponent],
      providers: [
        { provide: BicycleService, useValue: bicycleSpy },
        { provide: ComponentService, useValue: componentSpy },
        provideRouter([]),
      ],
    }).compileComponents();
  });

  it('should create', () => {
    bicycleSpy.getAll.and.returnValue(of([]));
    componentSpy.getByBike.and.returnValue(of([]));
    const { component } = createComponent();
    expect(component).toBeTruthy();
  });

  it('should be in loading state before the observable emits', () => {
    const subject = new Subject<Bicycle[]>();
    bicycleSpy.getAll.and.returnValue(subject.asObservable());
    const { component } = createComponent();
    expect((component as any).status()).toBe('loading');
  });

  it('should transition to loaded state with an empty list', fakeAsync(() => {
    bicycleSpy.getAll.and.returnValue(of([]));
    componentSpy.getByBike.and.returnValue(of([]));
    const { fixture, component } = createComponent();
    fixture.detectChanges();
    tick(0);
    expect((component as any).status()).toBe('loaded');
    expect((component as any).bicycles()).toEqual([]);
  }));

  it('should expose bicycles after load', fakeAsync(() => {
    const bikes = [makeBicycle('1'), makeBicycle('2')];
    bicycleSpy.getAll.and.returnValue(of(bikes));
    componentSpy.getByBike.and.returnValue(of([]));
    const { fixture, component } = createComponent();
    fixture.detectChanges();
    tick(0);
    expect((component as any).bicycles()).toEqual(bikes);
  }));

  it('should build componentsMap keyed by bike id', fakeAsync(() => {
    const bikes = [makeBicycle('1')];
    const comps = [makeComponent('1')];
    bicycleSpy.getAll.and.returnValue(of(bikes));
    componentSpy.getByBike.and.returnValue(of(comps));
    const { fixture, component } = createComponent();
    fixture.detectChanges();
    tick(0);
    const map: Map<string, BikeComponent[]> = (component as any).componentsMap();
    expect(map.get('1')).toEqual(comps);
  }));

  it('should call getByBike once per bicycle', fakeAsync(() => {
    const bikes = [makeBicycle('1'), makeBicycle('2')];
    bicycleSpy.getAll.and.returnValue(of(bikes));
    componentSpy.getByBike.and.returnValue(of([]));
    const { fixture } = createComponent();
    fixture.detectChanges();
    tick(0);
    expect(componentSpy.getByBike).toHaveBeenCalledTimes(2);
  }));

  it('should transition to error state when bicycle service fails', fakeAsync(() => {
    bicycleSpy.getAll.and.returnValue(throwError(() => new Error('network error')));
    const { fixture, component } = createComponent();
    fixture.detectChanges();
    tick(0);
    expect((component as any).status()).toBe('error');
  }));

  it('should return empty bicycles and componentsMap in error state', fakeAsync(() => {
    bicycleSpy.getAll.and.returnValue(throwError(() => new Error('fail')));
    const { fixture, component } = createComponent();
    fixture.detectChanges();
    tick(0);
    expect((component as any).bicycles()).toEqual([]);
    expect((component as any).componentsMap().size).toBe(0);
  }));

  it('should not call getByBike when bikes list is empty', fakeAsync(() => {
    bicycleSpy.getAll.and.returnValue(of([]));
    const { fixture } = createComponent();
    fixture.detectChanges();
    tick(0);
    expect(componentSpy.getByBike).not.toHaveBeenCalled();
  }));
});
