import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Activity, ActivityPayload } from './activity.model';

// Backend wraps every response in { data } — unwrap it at this boundary so the
// rest of the app works with plain domain objects.
interface ApiEnvelope<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/activities';

  getAll(): Observable<Activity[]> {
    return this.http
      .get<ApiEnvelope<Activity[]>>(this.baseUrl)
      .pipe(map((res) => res.data));
  }

  create(payload: ActivityPayload): Observable<Activity> {
    return this.http
      .post<ApiEnvelope<Activity>>(this.baseUrl, payload)
      .pipe(map((res) => res.data));
  }
}
