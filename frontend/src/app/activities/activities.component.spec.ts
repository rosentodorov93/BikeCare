import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ActivitiesComponent } from './activities.component';
import { ActivityService } from './activity.service';
import { BicycleService } from '../bicycles/bicycle.service';
import { Activity } from './activity.model';
import { Bicycle } from '../bicycles/bicycle.model';

const mockActivity: Activity = {
  id: 'a1',
  bikeId: 'b1',
  bikeName: 'Road Bike',
  bikeImageUrl: null,
  date: '2026-06-19',
  distanceKm: 50,
  createdAt: '2026-06-19T10:00:00.000Z',
};

const mockBicycle: Bicycle = {
  id: 'b1',
  name: 'Road Bike',
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

describe('ActivitiesComponent', () => {
  let activitySpy: jasmine.SpyObj<ActivityService>;
  let bicycleSpy: jasmine.SpyObj<BicycleService>;

  beforeEach(() => {
    activitySpy = jasmine.createSpyObj('ActivityService', ['getAll', 'create']);
    bicycleSpy = jasmine.createSpyObj('BicycleService', ['getAll']);
  });

  describe('with activities and bikes available', () => {
    let fixture: ComponentFixture<ActivitiesComponent>;
    let component: ActivitiesComponent;

    beforeEach(async () => {
      activitySpy.getAll.and.returnValue(of([mockActivity]));
      bicycleSpy.getAll.and.returnValue(of([mockBicycle]));

      await TestBed.configureTestingModule({
        imports: [ActivitiesComponent],
        providers: [
          { provide: ActivityService, useValue: activitySpy },
          { provide: BicycleService, useValue: bicycleSpy },
          provideRouter([]),
        ],
      }).compileComponents();
      fixture = TestBed.createComponent(ActivitiesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load activities on init', () => {
      expect(activitySpy.getAll).toHaveBeenCalled();
      expect((component as any).activities()).toEqual([mockActivity]);
      expect((component as any).loading()).toBeFalse();
    });

    it('should initialise the form with today\'s date', () => {
      const today = new Date().toISOString().slice(0, 10);
      expect((component as any).form.controls.date.value).toBe(today);
    });

    it('should have hasBikes true when bikes are available', fakeAsync(() => {
      tick(0);
      fixture.detectChanges();
      expect((component as any).hasBikes()).toBeTrue();
    }));

    describe('submit()', () => {
      it('should mark all controls as touched when form is invalid', () => {
        (component as any).form.controls.bikeId.setValue('');
        (component as any).submit();
        expect((component as any).form.touched).toBeTrue();
        expect(activitySpy.create).not.toHaveBeenCalled();
      });

      it('should not call create when already submitting', () => {
        (component as any).submitting.set(true);
        (component as any).submit();
        expect(activitySpy.create).not.toHaveBeenCalled();
      });

      it('should call create with valid form and prepend the result', fakeAsync(() => {
        const newActivity: Activity = { ...mockActivity, id: 'a2', distanceKm: 30 };
        activitySpy.create.and.returnValue(of(newActivity));

        (component as any).form.controls.bikeId.setValue('b1');
        (component as any).form.controls.date.setValue('2026-06-19');
        (component as any).form.controls.distanceKm.setValue(30);

        (component as any).submit();
        tick();

        const list: Activity[] = (component as any).activities();
        expect(list[0]).toEqual(newActivity);
        expect((component as any).submitting()).toBeFalse();
      }));

      it('should reset distanceKm after successful submission', fakeAsync(() => {
        activitySpy.create.and.returnValue(of(mockActivity));

        (component as any).form.controls.bikeId.setValue('b1');
        (component as any).form.controls.date.setValue('2026-06-19');
        (component as any).form.controls.distanceKm.setValue(50);

        (component as any).submit();
        tick();

        expect((component as any).form.controls.distanceKm.value).toBeNull();
      }));
    });
  });

  describe('when activity service fails', () => {
    let fixture: ComponentFixture<ActivitiesComponent>;
    let component: ActivitiesComponent;

    beforeEach(async () => {
      activitySpy.getAll.and.returnValue(throwError(() => new Error('fail')));
      bicycleSpy.getAll.and.returnValue(of([mockBicycle]));

      await TestBed.configureTestingModule({
        imports: [ActivitiesComponent],
        providers: [
          { provide: ActivityService, useValue: activitySpy },
          { provide: BicycleService, useValue: bicycleSpy },
          provideRouter([]),
        ],
      }).compileComponents();
      fixture = TestBed.createComponent(ActivitiesComponent);
      component = fixture.componentInstance;
    });

    it('should set loadError when getAll fails', () => {
      expect((component as any).loadError()).toBeTrue();
      expect((component as any).loading()).toBeFalse();
    });
  });

  describe('when no bikes are registered', () => {
    let fixture: ComponentFixture<ActivitiesComponent>;
    let component: ActivitiesComponent;

    beforeEach(async () => {
      activitySpy.getAll.and.returnValue(of([]));
      bicycleSpy.getAll.and.returnValue(of([]));

      await TestBed.configureTestingModule({
        imports: [ActivitiesComponent],
        providers: [
          { provide: ActivityService, useValue: activitySpy },
          { provide: BicycleService, useValue: bicycleSpy },
          provideRouter([]),
        ],
      }).compileComponents();
      fixture = TestBed.createComponent(ActivitiesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should have hasBikes false when no bikes', fakeAsync(() => {
      tick(0);
      fixture.detectChanges();
      expect((component as any).hasBikes()).toBeFalse();
    }));
  });
});
