import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

export interface HealthResponse {
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class HealthService {
  /** Délai max avant de considérer l'API comme indisponible (ms). */
  private static readonly TIMEOUT_MS = 5000;

  constructor(private http: HttpClient) {}

  checkHealth(): Observable<HealthResponse> {
    // Sans timeout, une requête qui ne répond jamais laisse le badge bloqué
    // sur « Vérification… ». On force une erreur après 5 s → état « indisponible ».
    return this.http
      .get<HealthResponse>('/api/health')
      .pipe(timeout(HealthService.TIMEOUT_MS));
  }
}
