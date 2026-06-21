import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import { ConversationService, ApiConversation, ApiMessage, ChatResponse } from '../../services/conversation.service';
import { RetrievalMode } from '../../components/chat-header/chat-header.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ChatHeaderComponent } from '../../components/chat-header/chat-header.component';
import { MessageListComponent } from '../../components/message-list/message-list.component';
import { ComposerComponent } from '../../components/composer/composer.component';
import { Conversation, Message } from '../../interfaces/chat.interface';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    ChatHeaderComponent,
    MessageListComponent,
    ComposerComponent,
  ],
  template: `
    <div class="app-shell">

      <app-sidebar
        [currentIndex]="selectedIndex()"
        (selectConversation)="selectConversation($event)"
        (createConversation)="onSidebarCreate()"
        (deleteConversation)="onSidebarDelete($event)"
        (conversationsLoaded)="onConversationsLoaded($event)"
      ></app-sidebar>

      <main class="chat-panel">
        <app-chat-header
          [title]="currentConversation().title"
          [updated]="currentConversation().updated"
          [retrievalMode]="retrievalMode()"
          (retrievalModeChange)="retrievalMode.set($event)"
          (clear)="clearChat()"
        ></app-chat-header>

        <app-message-list
          [messages]="messages()"
          (messageEdited)="onMessageEdited($event)"
          (messageDeleted)="onMessageDeleted($event)"
        ></app-message-list>

        <app-composer
          [sending]="sending()"
          (messageSent)="sendMessage($event)"
        ></app-composer>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100dvh;
      font-family: Inter, system-ui, sans-serif;
      background: #f7f7f7;
      color: #111;
    }

    .app-shell {
      display: grid;
      grid-template-columns: 320px minmax(0, 1fr);
      min-height: 100dvh;
      gap: 1rem;
      padding: 1rem;
      box-sizing: border-box;
    }

    .chat-panel {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      background: #ffffff;
      border-radius: 1.5rem;
      border: 1px solid #ece9e6;
      box-shadow: 0 18px 50px rgba(0, 0, 0, 0.05);
      padding: 1.5rem;
    }

    @media (max-width: 1040px) {
      .app-shell { grid-template-columns: 1fr; }
    }

    @media (max-width: 720px) {
      .app-shell { padding: 0.75rem; }
      .chat-panel { border-radius: 1.25rem; padding: 1rem; }
    }
  `],
})
export class ChatPageComponent {

  // ── Signaux internes ──────────────────────────────────────────────────────

  private apiConversations = signal<ApiConversation[]>([]);
  selectedIndex = signal(0);
  messages = signal<Message[]>([]);
  sending = signal(false);
  retrievalMode = signal<RetrievalMode>('rag');

  // ── Conversation courante (computed) ──────────────────────────────────────

  currentConversation = computed<Conversation>(() => {
    const list  = this.apiConversations();
    const index = this.selectedIndex();
    const api   = list[index];

    const empty: Conversation = {
      id: '', title: 'Nouvelle conversation',
      preview: '', updated: '', messages: [],
    };
    if (!api) return empty;

    return {
      id:       api.id,
      title:    api.title ?? 'Sans titre',
      preview:  '',
      updated:  api.updated_at
        ? new Date(api.updated_at).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'short', year: 'numeric',
          })
        : '',
      messages: [],
    };
  });

  constructor(
    private chatService: ChatService,
    private conversationService: ConversationService,
  ) {
    effect(() => {
      const id = this.currentConversation().id;
      if (id) this.loadMessages(id);
      else this.messages.set([]);
    });
  }

  // ── Mapping API → local ───────────────────────────────────────────────────

  private toLocalMessage(m: ApiMessage): Message {
    return {
      id:        m.id,
      role:      m.role === 'user' ? 'user' : 'ai',
      text:      m.content,
      timestamp: new Date(m.created_at),
    };
  }

  // ── Chargement messages API ───────────────────────────────────────────────

  private loadMessages(conversationId: string): void {
    this.conversationService.getSession(conversationId).subscribe({
      next: ({ messages }) => this.messages.set(messages.map((m) => this.toLocalMessage(m))),
      error: (err)          => console.error('Erreur chargement messages', err),
    });
  }

  // ── Callbacks sidebar ─────────────────────────────────────────────────────

  onConversationsLoaded(list: ApiConversation[]): void {
    this.apiConversations.set(list);
  }

  onSidebarCreate(): void {
    this.selectedIndex.set(0);
  }

  onSidebarDelete(index: number): void {
    const remaining = this.apiConversations().length - 1;
    if (this.selectedIndex() >= remaining) {
      this.selectedIndex.set(Math.max(0, remaining - 1));
    }
  }

  // ── Actions utilisateur ───────────────────────────────────────────────────

  selectConversation(index: number): void {
    this.selectedIndex.set(index);
  }

  clearChat(): void {
    const id = this.currentConversation().id;
    if (id) this.loadMessages(id);
  }

  onMessageDeleted(index: number): void {
    const msg = this.messages()[index];
    const convId = this.currentConversation().id;
    if (!msg?.id || !convId) return;

    // Suppression optimiste
    this.messages.update((msgs) => msgs.filter((_, i) => i !== index));

    this.conversationService.deleteMessage(convId, msg.id).subscribe({
      error: (err) => {
        console.error('Erreur suppression message', err);
        // Rollback
        this.messages.update((msgs) => {
          const restored = [...msgs];
          restored.splice(index, 0, msg);
          return restored;
        });
      },
    });
  }

  onMessageEdited(event: { index: number; newText: string }): void {
    const msg = this.messages()[event.index];
    const convId = this.currentConversation().id;
    if (!msg?.id || !convId) return;

    // Mise à jour optimiste
    this.messages.update((msgs) => {
      const updated = [...msgs];
      updated[event.index] = { ...updated[event.index], text: event.newText };
      return updated;
    });

    this.conversationService.updateMessage(convId, msg.id, event.newText).subscribe({
      error: (err) => {
        console.error('Erreur modification message', err);
        // Rollback
        this.messages.update((msgs) => {
          const updated = [...msgs];
          updated[event.index] = { ...updated[event.index], text: msg.text };
          return updated;
        });
      },
    });
  }

  sendMessage(text: string): void {
    const id = this.currentConversation().id;
    if (!id || this.sending()) return;

    this.sending.set(true);

    // Affichage optimiste du message utilisateur
    this.messages.update((msgs) => [
      ...msgs,
      { role: 'user', text, timestamp: new Date() },
    ]);

    this.conversationService.sendChat(id, text, this.retrievalMode()).subscribe({
      next: (res: ChatResponse) => {
        // Remplace le message optimiste par le vrai user_message + ajoute la réponse IA
        this.messages.update((msgs) => [
          ...msgs.slice(0, -1),
          this.toLocalMessage(res.user_message),
          this.toLocalMessage(res.reply),
        ]);
        this.sending.set(false);
      },
      error: (err) => {
        console.error('Erreur envoi message', err);
        this.messages.update((msgs) => msgs.slice(0, -1));
        this.sending.set(false);
      },
    });
  }
}
