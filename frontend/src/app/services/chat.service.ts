import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { signal, computed, Signal } from '@angular/core';
import { Message } from '../interfaces/chat.interface';

/**
 * ChatService — responsabilité unique : gérer l'historique LOCAL des messages,
 * indexé par conversation ID (fourni par l'API).
 *
 * Le CRUD des conversations (create / list / delete) est délégué à
 * ConversationService + SidebarComponent.
 */
@Injectable({ providedIn: 'root' })
export class ChatService {

  /**
   * Map  conversationId → Message[]
   * Persistée dans localStorage pour survivre aux rechargements.
   */
  private messagesMap = signal<Record<string, Message[]>>(
    this.loadFromStorage()
  );

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  // ── Lecture ───────────────────────────────────────────────────────────────

  /** Retourne les messages d'une conversation (tableau vide si inconnue) */
  getMessagesForConversation(conversationId: string): Message[] {
    return this.messagesMap()[conversationId] ?? [];
  }

  /**
   * Signal calculé exposant les messages de la conversation courante.
   * À utiliser quand on veut réagir aux changements dans le template.
   */
  messagesSignal(conversationId: string): Signal<Message[]> {
    return computed(() => this.messagesMap()[conversationId] ?? []);
  }

  // ── Écriture ──────────────────────────────────────────────────────────────

  /** Ajoute un message à une conversation */
  addMessage(conversationId: string, message: Message): void {
    this.messagesMap.update((map) => ({
      ...map,
      [conversationId]: [...(map[conversationId] ?? []), message],
    }));
    this.saveToStorage();
  }

  /** Vide l'historique local d'une conversation */
  clearConversation(conversationId: string): void {
    this.messagesMap.update((map) => ({
      ...map,
      [conversationId]: [],
    }));
    this.saveToStorage();
  }

  /** Supprime complètement l'entrée (utile quand la conv est supprimée côté API) */
  removeConversation(conversationId: string): void {
    this.messagesMap.update((map) => {
      const next = { ...map };
      delete next[conversationId];
      return next;
    });
    this.saveToStorage();
  }

  // ── Persistance localStorage ──────────────────────────────────────────────

  private saveToStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem('chat_messages', JSON.stringify(this.messagesMap()));
    } catch (e) {
      console.error('ChatService: sauvegarde localStorage échouée', e);
    }
  }

  private loadFromStorage(): Record<string, Message[]> {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return {};
    }
    try {
      const raw = localStorage.getItem('chat_messages');
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, any[]>;
      // Rehydrate les dates
      return Object.fromEntries(
        Object.entries(parsed).map(([id, msgs]) => [
          id,
          msgs.map((m) => ({
            ...m,
            timestamp: m.timestamp ? new Date(m.timestamp) : undefined,
          })),
        ])
      );
    } catch (e) {
      console.error('ChatService: chargement localStorage échoué', e);
      return {};
    }
  }
}
