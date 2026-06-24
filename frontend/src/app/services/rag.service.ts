import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** Réponse de POST /api/rag/query/voice */
export interface VoiceQueryResponse {
  transcription: string;
  answer: string;
  context: string;
  sources: string[];
}

export interface VoiceQueryOptions {
  topK?: number;
  model?: string;
  /** Historique de conversation pour contextualiser le RAG. */
  conversationHistory?: { role: string; content: string }[];
}

@Injectable({ providedIn: 'root' })
export class RagService {
  constructor(private http: HttpClient) {}

  /**
   * Envoie un enregistrement audio à l'endpoint vocal : transcription (Whisper)
   * puis réponse RAG. Le token JWT est ajouté par l'AuthInterceptor.
   *
   * ⚠️ Ne pas fixer Content-Type : avec un FormData, le navigateur pose
   * automatiquement `multipart/form-data; boundary=…`.
   */
  queryVoice(audio: Blob, filename: string, opts: VoiceQueryOptions = {}): Observable<VoiceQueryResponse> {
    const form = new FormData();
    form.append('audio', audio, filename);

    if (opts.topK != null && Number.isFinite(opts.topK)) {
      form.append('top_k', String(opts.topK));
    }
    if (opts.model) {
      form.append('model', opts.model);
    }
    if (opts.conversationHistory && opts.conversationHistory.length > 0) {
      form.append('conversation_history', JSON.stringify(opts.conversationHistory));
    }

    return this.http.post<VoiceQueryResponse>('/api/rag/query/voice', form);
  }
}
