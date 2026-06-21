import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BicycleFormComponent } from './bicycle-form.component';
import { BicycleService } from '../bicycle.service';
import { Bicycle } from '../bicycle.model';

const mockBicycle: Bicycle = {
  id: 'b1',
  name: 'Road Bike',
  brand: 'Trek',
  model: 'Domane',
  type: 'road',
  purchaseDate: null,
  frameSize: null,
  wheelSize: null,
  imageUrl: null,
  totalDistance: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('BicycleFormComponent — create mode', () => {
  let fixture: ComponentFixture<BicycleFormComponent>;
  let component: BicycleFormComponent;
  let bicycleSpy: jasmine.SpyObj<BicycleService>;
  let router: Router;

  beforeEach(async () => {
    bicycleSpy = jasmine.createSpyObj<BicycleService>('BicycleService', [
      'getById', 'create', 'update',
    ]);

    await TestBed.configureTestingModule({
      imports: [BicycleFormComponent],
      providers: [
        provideRouter([]),
        { provide: BicycleService, useValue: bicycleSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (_: string) => null } } },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(BicycleFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be in create mode when route has no id', () => {
    expect((component as any).isEdit()).toBeFalse();
    expect((component as any).id).toBeNull();
  });

  it('should not call getById in create mode', () => {
    expect(bicycleSpy.getById).not.toHaveBeenCalled();
  });

  it('should expose BICYCLE_TYPES for the type dropdown', () => {
    expect((component as any).types.length).toBeGreaterThan(0);
  });

  it('should expose WHEEL_SIZES for the wheel size dropdown', () => {
    expect((component as any).wheelSizes.length).toBeGreaterThan(0);
  });

  it('should expose COMPONENT_LIST_TYPES for the component list dropdown', () => {
    expect((component as any).componentListTypes.length).toBeGreaterThan(0);
  });

  describe('form validation', () => {
    it('should be invalid when required fields are empty', () => {
      expect((component as any).form.invalid).toBeTrue();
    });

    it('should be valid when required fields are filled', () => {
      (component as any).form.patchValue({
        name: 'My Bike',
        brand: 'Trek',
        model: 'Domane',
        type: 'road',
        componentListType: 'no_suspension',
      });
      expect((component as any).form.valid).toBeTrue();
    });
  });

  describe('submit()', () => {
    it('should mark all touched and abort when form is invalid', () => {
      (component as any).submit();
      expect(bicycleSpy.create).not.toHaveBeenCalled();
      expect((component as any).form.touched).toBeTrue();
    });

    it('should not submit when already submitting', () => {
      (component as any).submitting.set(true);
      (component as any).form.patchValue({ name: 'X', brand: 'Y', model: 'Z', type: 'road', componentListType: 'no_suspension' });
      (component as any).submit();
      expect(bicycleSpy.create).not.toHaveBeenCalled();
    });

    it('should call create with the payload and navigate on success', fakeAsync(() => {
      bicycleSpy.create.and.returnValue(of(mockBicycle));
      (component as any).form.patchValue({
        name: 'My Bike',
        brand: 'Trek',
        model: 'Domane',
        type: 'road',
        componentListType: 'no_suspension',
      });
      (component as any).submit();
      tick();

      expect(bicycleSpy.create).toHaveBeenCalled();
      const payload = bicycleSpy.create.calls.mostRecent().args[0];
      expect(payload.componentListType).toBe('no_suspension');
      expect(router.navigate).toHaveBeenCalledWith(['/bicycles', 'b1']);
    }));

    it('should trim string fields in the payload', fakeAsync(() => {
      bicycleSpy.create.and.returnValue(of(mockBicycle));
      (component as any).form.patchValue({
        name: '  My Bike  ',
        brand: '  Trek  ',
        model: '  Domane  ',
        type: 'road',
        componentListType: 'no_suspension',
      });
      (component as any).submit();
      tick();

      const payload = bicycleSpy.create.calls.mostRecent().args[0];
      expect(payload.name).toBe('My Bike');
      expect(payload.brand).toBe('Trek');
      expect(payload.model).toBe('Domane');
    }));

    it('should include the selected image data URL in the payload', fakeAsync(() => {
      bicycleSpy.create.and.returnValue(of(mockBicycle));
      (component as any).imageUrl.set('data:image/jpeg;base64,abc');
      (component as any).form.patchValue({
        name: 'My Bike',
        brand: 'Trek',
        model: 'Domane',
        type: 'road',
        componentListType: 'no_suspension',
      });
      (component as any).submit();
      tick();

      const payload = bicycleSpy.create.calls.mostRecent().args[0];
      expect(payload.imageUrl).toBe('data:image/jpeg;base64,abc');
    }));

    it('should send imageUrl null when no image is selected', fakeAsync(() => {
      bicycleSpy.create.and.returnValue(of(mockBicycle));
      (component as any).form.patchValue({
        name: 'My Bike',
        brand: 'Trek',
        model: 'Domane',
        type: 'road',
        componentListType: 'no_suspension',
      });
      (component as any).submit();
      tick();

      const payload = bicycleSpy.create.calls.mostRecent().args[0];
      expect(payload.imageUrl).toBeNull();
    }));

    it('clearImage() resets the preview back to no image', () => {
      (component as any).imageUrl.set('data:image/png;base64,zzz');
      (component as any).clearImage();
      expect((component as any).imageUrl()).toBeNull();
    });

    it('should reset submitting flag on error', fakeAsync(() => {
      bicycleSpy.create.and.returnValue(throwError(() => new Error('fail')));
      spyOn(window, 'alert');
      (component as any).form.patchValue({ name: 'X', brand: 'Y', model: 'Z', type: 'road', componentListType: 'no_suspension' });
      (component as any).submit();
      tick();

      expect((component as any).submitting()).toBeFalse();
    }));
  });
});

describe('BicycleFormComponent — edit mode', () => {
  let fixture: ComponentFixture<BicycleFormComponent>;
  let component: BicycleFormComponent;
  let bicycleSpy: jasmine.SpyObj<BicycleService>;
  let router: Router;

  beforeEach(async () => {
    bicycleSpy = jasmine.createSpyObj<BicycleService>('BicycleService', [
      'getById', 'create', 'update',
    ]);
    bicycleSpy.getById.and.returnValue(of(mockBicycle));

    await TestBed.configureTestingModule({
      imports: [BicycleFormComponent],
      providers: [
        provideRouter([]),
        { provide: BicycleService, useValue: bicycleSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (_: string) => 'b1' } } },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(BicycleFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be in edit mode when route has an id', () => {
    expect((component as any).isEdit()).toBeTrue();
    expect((component as any).id).toBe('b1');
  });

  it('should load the existing bicycle into the form', () => {
    expect(bicycleSpy.getById).toHaveBeenCalledWith('b1');
    expect((component as any).form.controls.name.value).toBe('Road Bike');
  });

  it('should call update instead of create on submit', fakeAsync(() => {
    bicycleSpy.update.and.returnValue(of(mockBicycle));
    (component as any).form.patchValue({ name: 'Updated', brand: 'Trek', model: 'Domane', type: 'road' });
    (component as any).submit();
    tick();

    expect(bicycleSpy.update).toHaveBeenCalledWith('b1', jasmine.any(Object));
    expect(bicycleSpy.create).not.toHaveBeenCalled();
  }));

  it('should not include componentListType in the update payload', fakeAsync(() => {
    bicycleSpy.update.and.returnValue(of(mockBicycle));
    (component as any).form.patchValue({ name: 'X', brand: 'Y', model: 'Z', type: 'road' });
    (component as any).submit();
    tick();

    const payload = bicycleSpy.update.calls.mostRecent().args[1];
    expect(payload.componentListType).toBeUndefined();
  }));

  it('should navigate to the bike detail page after update', fakeAsync(() => {
    bicycleSpy.update.and.returnValue(of(mockBicycle));
    (component as any).form.patchValue({ name: 'X', brand: 'Y', model: 'Z', type: 'road' });
    (component as any).submit();
    tick();

    expect(router.navigate).toHaveBeenCalledWith(['/bicycles', 'b1']);
  }));
});

describe('BicycleFormComponent — edit mode with load error', () => {
  it('should set loadError when getById fails', async () => {
    const bicycleSpy = jasmine.createSpyObj<BicycleService>('BicycleService', ['getById', 'create', 'update']);
    bicycleSpy.getById.and.returnValue(throwError(() => new Error('not found')));

    await TestBed.configureTestingModule({
      imports: [BicycleFormComponent],
      providers: [
        provideRouter([]),
        { provide: BicycleService, useValue: bicycleSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (_: string) => 'b1' } } },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(BicycleFormComponent);
    expect((fixture.componentInstance as any).loadError()).toBeTrue();
  });
});
