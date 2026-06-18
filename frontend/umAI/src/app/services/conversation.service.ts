import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface ApiConversation {
  id: string;
  user_id: string;
  title: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ApiMessage {
  id: string;
  conversation_id: string;
  user_id: string | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface CreateConversationPayload {
  title?: string;
  metadata?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class ConversationService {
  private readonly base = '/api/conversations';

  constructor(private http: HttpClient) {}

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  // ── Helpers de normalisation ──────────────────────────────────────────────

  /**
   * L'API peut renvoyer soit l'objet directement, soit un wrapper.
   * On normalise dans tous les cas.
   */
  private unwrapOne(res: any): ApiConversation {
    if (res?.conversation?.id) return res.conversation;
    if (res?.id)               return res as ApiConversation;
    console.error('ConversationService: réponse inattendue', res);
    return res;
  }

  private unwrapList(res: any): ApiConversation[] {
    if (Array.isArray(res))              return res;
    if (Array.isArray(res?.conversations)) return res.conversations;
    return [];
  }

  // ── API calls ─────────────────────────────────────────────────────────────

  getConversations(): Observable<ApiConversation[]> {
    return this.http
      .get<any>(this.base, { headers: this.headers })
      .pipe(map((res) => this.unwrapList(res)));
  }

  createConversation(payload: CreateConversationPayload = {}): Observable<ApiConversation> {
    return this.http
      .post<any>(this.base, payload, { headers: this.headers })
      .pipe(
        map((res) => this.unwrapOne(res)),
        tap((conv) => {
          if (!conv?.id) {
            console.error('createConversation: id manquant dans la réponse API', conv);
          }
        })
      );
  }

  /**
   * Charge les conversations ; si aucune n'existe, en crée une par défaut
   * et retourne le tableau résultant.
   */
  loadOrCreate(): Observable<ApiConversation[]> {
    return this.getConversations().pipe(
      switchMap((list) => {
        if (list.length > 0) return of(list);
        return this.createConversation({ title: 'Nouvelle conversation' }).pipe(
          map((created) => [created])
        );
      })
    );
  }

  deleteConversation(id: string): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`, { headers: this.headers });
  }

  updateConversation(
    id: string,
    payload: Partial<CreateConversationPayload>
  ): Observable<ApiConversation> {
    return this.http
      .patch<any>(`${this.base}/${id}`, payload, { headers: this.headers })
      .pipe(map((res) => this.unwrapOne(res)));
  }

  // ── Messages ──────────────────────────────────────────────────────────────

  getMessages(conversationId: string): Observable<ApiMessage[]> {
    return this.http
      .get<any>(`${this.base}/${conversationId}/messages`, { headers: this.headers })
      .pipe(map((res) => (Array.isArray(res) ? res : (res?.messages ?? []))));
  }

  createMessage(conversationId: string, content: string, role: 'user' | 'assistant' = 'user'): Observable<ApiMessage> {
    return this.http
      .post<any>(
        `${this.base}/${conversationId}/messages`,
        { content, role },
        { headers: this.headers }
      )
      .pipe(map((res) => (res?.message ?? res) as ApiMessage));
  }

  deleteMessage(conversationId: string, messageId: string): Observable<unknown> {
    return this.http.delete(
      `${this.base}/${conversationId}/messages/${messageId}`,
      { headers: this.headers }
    );
  }

  updateMessage(conversationId: string, messageId: string, content: string): Observable<ApiMessage> {
    return this.http
      .patch<any>(
        `${this.base}/${conversationId}/messages/${messageId}`,
        { content },
        { headers: this.headers }
      )
      .pipe(map((res) => (res?.message ?? res) as ApiMessage));
  }
}
