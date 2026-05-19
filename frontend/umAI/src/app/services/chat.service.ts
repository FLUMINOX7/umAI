import { Injectable } from '@angular/core';
import { signal } from '@angular/core';
import { Conversation, Message } from '../interfaces/chat.interface';
import { ConversationModel } from '../models/conversation.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private conversations = signal<Conversation[]>([
    new ConversationModel(
      'Discussion générale',
      [
        {
          role: 'ai',
          text: 'Bonjour ! Je suis prêt à discuter avec vous. Posez-moi une question ou commencez une conversation.',
          timestamp: new Date()
        }
      ]
    )
  ]);

  private currentConversationIndex = signal(0);

  constructor() {
    this.loadConversationsFromStorage();
  }

  get conversations$() {
    return this.conversations;
  }

  get currentConversationIndex$() {
    return this.currentConversationIndex;
  }

  getCurrentConversation(): Conversation {
    const index = this.currentConversationIndex();
    return this.conversations()[index] ?? this.conversations()[0];
  }

  addMessage(message: Message): void {
    const index = this.currentConversationIndex();
    this.conversations.update((convs) => {
      const updated = [...convs];
      updated[index].messages.push(message);
      updated[index].preview = message.text.substring(0, 50) + '...';
      updated[index].updated = 'À l\'instant';
      return updated;
    });
    this.saveConversationsToStorage();
  }

  createConversation(): Conversation {
    const newConversation = new ConversationModel(
      `Conversation ${this.conversations().length + 1}`,
      [
        {
          role: 'ai',
          text: this.getInitialAIPrompt(),
          timestamp: new Date()
        }
      ]
    );

    let newLength = 0;
    this.conversations.update((convs) => {
      const updated = [...convs, newConversation];
      newLength = updated.length;
      return updated;
    });
    this.currentConversationIndex.set(newLength - 1);
    this.saveConversationsToStorage();
    return newConversation;
  }

  private getInitialAIPrompt(): string {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return 'Bonjour ! Que souhaitez-vous cuisiner ce matin ?';
    }
    if (hour >= 12 && hour < 18) {
      return 'Bon après-midi ! Que voulez-vous préparer aujourd’hui ?';
    }
    return 'Bonsoir ! Que souhaitez-vous cuisiner ce soir ?';
  }

  selectConversation(index: number): void {
    if (index >= 0 && index < this.conversations().length) {
      this.currentConversationIndex.set(index);
    }
  }

  clearCurrentConversation(): void {
    const index = this.currentConversationIndex();
    this.conversations.update((convs) => {
      const updated = [...convs];
      updated[index].messages = [];
      updated[index].preview = 'Conversation vide';
      updated[index].updated = 'À l\'instant';
      return updated;
    });
    this.saveConversationsToStorage();
  }

  deleteConversation(index: number): void {
    if (this.conversations().length > 1) {
      this.conversations.update((convs) => convs.filter((_, i) => i !== index));
      if (this.currentConversationIndex() === index) {
        this.currentConversationIndex.set(0);
      }
      this.saveConversationsToStorage();
    }
  }

  private saveConversationsToStorage(): void {
    if (!this.isBrowser()) {
      return;
    }

    try {
      const data = this.conversations().map((conv) => ({
        ...conv,
        createdAt: conv.createdAt?.toISOString()
      }));
      localStorage.setItem('conversations', JSON.stringify(data));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des conversations:', error);
    }
  }

  private loadConversationsFromStorage(): void {
    if (!this.isBrowser()) {
      return;
    }

    try {
      const stored = localStorage.getItem('conversations');
      if (stored) {
        const data = JSON.parse(stored);
        const loaded = data.map((conv: any) =>
          new ConversationModel(
            conv.title,
            conv.messages,
            new Date(conv.createdAt || Date.now())
          )
        );
        if (loaded.length > 0) {
          this.conversations.set(loaded);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
    }
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
}
