import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'access_token';

  constructor(private http: HttpClient) {}

  register(payload: { username: string; email: string; password: string }): Observable<any> {
    return this.http.post('/api/auth/register', payload);
  }

  saveToken(token: string) {
    try {
      localStorage.setItem(this.tokenKey, token);
    } catch (e) {
      // ignore storage errors
    }
  }

  getToken() {
    try {
      return localStorage.getItem(this.tokenKey);
    } catch (e) {
      return null;
    }
  }

  clearToken() {
    try {
      localStorage.removeItem(this.tokenKey);
    } catch (e) {}
  }
}
