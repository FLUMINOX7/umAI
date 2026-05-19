import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ChatHeaderComponent } from '../../components/chat-header/chat-header.component';
import { MessageListComponent } from '../../components/message-list/message-list.component';
import { ComposerComponent } from '../../components/composer/composer.component';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    ChatHeaderComponent,
    MessageListComponent,
    ComposerComponent
  ],
  template: `
    <div class="app-shell">
      <app-sidebar
        [conversations]="conversations$()"
        [currentIndex]="currentConversationIndex$()"
        [isLoggedIn]="isLoggedIn"
        (toggleLogin)="toggleLogin()"
        (selectConversation)="selectConversation($event)"
        (createConversation)="createConversation()"
        (deleteConversation)="deleteConversation($event)"
      ></app-sidebar>

      <main class="chat-panel">
        <app-chat-header
          [title]="currentConversation.title"
          [updated]="currentConversation.updated"
          (clear)="clearChat()"
        ></app-chat-header>

        <app-message-list
          [messages]="currentConversation.messages"
        ></app-message-list>

        <app-composer
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
      .app-shell {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 720px) {
      .app-shell {
        padding: 0.75rem;
      }

      .chat-panel {
        border-radius: 1.25rem;
        padding: 1rem;
      }
    }
  `]
})
export class ChatPageComponent implements OnInit {
  isLoggedIn = false;

  constructor(private chatService: ChatService) {}

  // Expose les signaux directement (pas leurs valeurs)
  get conversations$() {
    return this.chatService.conversations$;
  }

  get currentConversationIndex$() {
    return this.chatService.currentConversationIndex$;
  }

  get currentConversation() {
    return this.chatService.getCurrentConversation();
  }

  ngOnInit(): void {
    // Initialisation si nécessaire
  }

  toggleLogin() {
    this.isLoggedIn = !this.isLoggedIn;
  }

  selectConversation(index: number) {
    this.chatService.selectConversation(index);
  }

  deleteConversation(index: number) {
    this.chatService.deleteConversation(index);
  }

  createConversation() {
    this.chatService.createConversation();
  }

  clearChat() {
    this.chatService.clearCurrentConversation();
  }

  sendMessage(text: string) {
    const userMessage = {
      role: 'user' as const,
      text,
      timestamp: new Date()
    };

    this.chatService.addMessage(userMessage);

    // Simuler une réponse de l'IA après un délai
    setTimeout(() => {
      const aiMessage = {
        role: 'ai' as const,
        text: 'Je suis ici pour vous aider. Dites-moi ce que vous voulez savoir ou faire.',
        timestamp: new Date()
      };
      this.chatService.addMessage(aiMessage);
    }, 500);
  }
}
