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

export interface ApiSession {
  session: ApiConversation;
  messages: ApiMessage[];
}

export interface ChatResponse {
  reply: ApiMessage;
  user_message: ApiMessage;
}

export interface CreateConversationPayload {
  title?: string;
  metadata?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class ConversationService {
  private readonly llmBase  = '/api/llm/sessions';
  private readonly convBase = '/api/conversations';

  constructor(private http: HttpClient) {}

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  // ── Normalisation ─────────────────────────────────────────────────────────

  private unwrapOne(res: any): ApiConversation {
    if (res?.conversation?.id) return res.conversation;
    if (res?.session?.id)      return res.session;
    if (res?.id)               return res as ApiConversation;
    console.error('ConversationService: réponse inattendue', res);
    return res;
  }

  private unwrapList(res: any): ApiConversation[] {
    if (Array.isArray(res))                return res;
    if (Array.isArray(res?.sessions))      return res.sessions;
    if (Array.isArray(res?.conversations)) return res.conversations;
    return [];
  }

  // ── Sessions LLM — remplacent GET/POST/DELETE /conversations ─────────────

  getConversations(): Observable<ApiConversation[]> {
    return this.http
      .get<any>(this.llmBase, { headers: this.headers })
      .pipe(map((res) => this.unwrapList(res)));
  }

  createConversation(payload: CreateConversationPayload = {}): Observable<ApiConversation> {
    return this.http
      .post<any>(this.llmBase, {}, { headers: this.headers })
      .pipe(
        map((res) => this.unwrapOne(res)),
        switchMap((session) => {
          if (payload.title && session?.id) {
            return this.updateConversation(session.id, { title: payload.title });
          }
          return of(session);
        }),
        tap((conv) => {
          if (!conv?.id) console.error('createConversation: id manquant', conv);
        })
      );
  }

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
    return this.http.delete(`${this.llmBase}/${id}`, { headers: this.headers });
  }

  // ── Conversation — unique (PATCH /conversations/{id}) ────────────────────

  updateConversation(
    id: string,
    payload: Partial<CreateConversationPayload>
  ): Observable<ApiConversation> {
    return this.http
      .patch<any>(`${this.convBase}/${id}`, payload, { headers: this.headers })
      .pipe(map((res) => this.unwrapOne(res)));
  }

  // ── Session LLM — remplace GET /conversations/{id}/messages ──────────────

  getSession(sessionId: string): Observable<ApiSession> {
    return this.http
      .get<any>(`${this.llmBase}/${sessionId}`, { headers: this.headers })
      .pipe(
        map((res) => {
          const session  = res?.session ?? res?.conversation ?? res;
          const messages = Array.isArray(res?.messages) ? res.messages
                         : Array.isArray(res?.history)  ? res.history
                         : [];
          return { session, messages } as ApiSession;
        })
      );
  }

  // ── Chat LLM — remplace POST /conversations/{id}/messages ────────────────

  sendChat(sessionId: string, content: string): Observable<ChatResponse> {
    return this.http
      .post<ChatResponse>(
        `${this.llmBase}/${sessionId}/chat`,
        { content },
        { headers: this.headers }
      );
  }

  // ── Messages — uniques (PATCH / DELETE /conversations/{id}/messages/{msg}) ─

  updateMessage(conversationId: string, messageId: string, content: string): Observable<ApiMessage> {
    return this.http
      .patch<any>(
        `${this.convBase}/${conversationId}/messages/${messageId}`,
        { content },
        { headers: this.headers }
      )
      .pipe(map((res) => (res?.message ?? res) as ApiMessage));
  }

  deleteMessage(conversationId: string, messageId: string): Observable<unknown> {
    return this.http.delete(
      `${this.convBase}/${conversationId}/messages/${messageId}`,
      { headers: this.headers }
    );
  }
}
