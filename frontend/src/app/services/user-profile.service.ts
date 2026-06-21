import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UpdateProfilePayload {
  username?: string;
  email?: string;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  constructor(private http: HttpClient) {}

  /** Met à jour le profil de l'utilisateur connecté */
  updateMe(payload: UpdateProfilePayload): Observable<any> {
    // On n'envoie le mot de passe que s'il est renseigné
    const body: UpdateProfilePayload = {};
    if (payload.username) body.username = payload.username;
    if (payload.email)    body.email    = payload.email;
    if (payload.password) body.password = payload.password;
    return this.http.patch('/api/auth/me', body);
  }

  /** Supprime le compte de l'utilisateur connecté */
  deleteMe(): Observable<any> {
    return this.http.delete('/api/auth/me');
  }
}
