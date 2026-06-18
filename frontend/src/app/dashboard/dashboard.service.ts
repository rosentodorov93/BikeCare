import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DashboardData, DashboardPeriod } from './dashboard.model';

// Backend wraps every response in { data } — unwrap it at this boundary so the
// rest of the app works with plain domain objects.
interface ApiEnvelope<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/dashboard';

  get(period: DashboardPeriod): Observable<DashboardData> {
    return this.http
      .get<ApiEnvelope<DashboardData>>(this.baseUrl, {
        params: new HttpParams().set('period', period),
      })
      .pipe(map((res) => res.data));
  }
}
