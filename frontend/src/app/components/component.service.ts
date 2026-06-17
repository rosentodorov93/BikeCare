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
}
