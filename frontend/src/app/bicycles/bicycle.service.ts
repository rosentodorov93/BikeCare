import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Bicycle, BicyclePayload } from './bicycle.model';

// Backend wraps every response in { data } — unwrap it at this boundary so the
// rest of the app works with plain domain objects.
interface ApiEnvelope<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class BicycleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/bicycles';

  getAll(): Observable<Bicycle[]> {
    return this.http
      .get<ApiEnvelope<Bicycle[]>>(this.baseUrl)
      .pipe(map((res) => res.data));
  }

  getById(id: string): Observable<Bicycle> {
    return this.http
      .get<ApiEnvelope<Bicycle>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(payload: BicyclePayload): Observable<Bicycle> {
    return this.http
      .post<ApiEnvelope<Bicycle>>(this.baseUrl, payload)
      .pipe(map((res) => res.data));
  }

  update(id: string, payload: BicyclePayload): Observable<Bicycle> {
    return this.http
      .put<ApiEnvelope<Bicycle>>(`${this.baseUrl}/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  downloadReport(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/report`, { responseType: 'blob' });
  }
}
