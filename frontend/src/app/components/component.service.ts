import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BikeComponent } from './component.model';

// Backend wraps every response in { data } — unwrap it at this boundary so the
// rest of the app works with plain domain objects.
interface ApiEnvelope<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ComponentService {
  private readonly http = inject(HttpClient);

  getByBike(bikeId: string): Observable<BikeComponent[]> {
    return this.http
      .get<ApiEnvelope<BikeComponent[]>>(`/api/bicycles/${bikeId}/components`)
      .pipe(map((res) => res.data));
  }

  // Marks a component as serviced/replaced; its wear resets to 0 server-side.
  resetService(bikeId: string, componentId: string): Observable<BikeComponent> {
    return this.http
      .post<ApiEnvelope<BikeComponent>>(
        `/api/bicycles/${bikeId}/components/${componentId}/reset`,
        {},
      )
      .pipe(map((res) => res.data));
  }

  // Adjusts the component's service interval (km between services); the backend
  // returns the component with its wear recomputed against the new interval.
  updateServiceInterval(
    bikeId: string,
    componentId: string,
    serviceIntervalKm: number,
  ): Observable<BikeComponent> {
    return this.http
      .patch<ApiEnvelope<BikeComponent>>(
        `/api/bicycles/${bikeId}/components/${componentId}`,
        { serviceIntervalKm },
      )
      .pipe(map((res) => res.data));
  }
}
