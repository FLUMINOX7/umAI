import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConversationCardComponent } from './conversation-card.component';
import { HealthStatusComponent } from '../health-status/health-status.component';
import { RegisterButtonComponent } from '../register-button/register-button.component';
import { RegisterModalComponent } from '../register-modal/register-modal.component';
import { Conversation } from '../../interfaces/chat.interface';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, ConversationCardComponent, HealthStatusComponent, RegisterButtonComponent, RegisterModalComponent],
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div>
          <div class="brand">umAI</div>
          <div class="brand-subtitle">Chat IA</div>
        </div>
        <div class="header-actions">
          <app-register-button [compact]="true" (register)="onRegister()"></app-register-button>
          <button class="login-button" type="button" (click)="onToggleLogin()">
            Connexion
          </button>
        </div>
      </div>

      <app-health-status></app-health-status>

      <app-register-modal *ngIf="showRegisterModal" (closeModal)="showRegisterModal = false" (registered)="onRegistered($event)"></app-register-modal>

      <div class="sidebar-title">Conversations enregistrées</div>
        <div class="conversation-list">
          <app-conversation-card
            *ngFor="let conversation of conversations; let i = index"
            [conversation]="conversation"
            [index]="i"
            [currentIndex]="currentIndex"
            (select)="onSelectConversation($event)"
            (delete)="onDeleteConversation($event)"
          ></app-conversation-card>
        </div>

      <button class="new-conversation" type="button" (click)="onCreateConversation()">
        + Nouvelle conversation
      </button>
    </aside>
  `,
  styles: [`
    .sidebar {
      background: #ffffff;
      border: 1px solid #ece9e6;
      border-radius: 1.5rem;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-self: flex-start;
      box-shadow: 0 18px 50px rgba(0, 0, 0, 0.05);
    }

    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .brand {
      font-size: 1.35rem;
      font-weight: 800;
      color: #dc2c24;
    }

    .brand-subtitle {
      color: #6b7280;
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }

    .login-button,
    .new-conversation {
      border: none;
      border-radius: 999px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.2s ease;
      padding: 0.6rem 0.9rem;
      background: linear-gradient(135deg, #ff8a3d 0%, #dc2c24 100%);
      color: #fff;
    }

    .login-button:hover,
    .new-conversation:hover {
      opacity: 0.92;
    }

    .sidebar-title {
      text-transform: uppercase;
      font-size: 0.8rem;
      letter-spacing: 0.16em;
      color: #9ca3af;
    }

    .conversation-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      padding-right: 0.25rem;
      /* allow list to grow naturally so aside adapts to content height */
      overflow: visible;
    }


    .new-conversation {
      margin-top: 0;
      padding: 0.95rem 1rem;
    }
  `]
})
export class SidebarComponent {
  @Input() conversations: Conversation[] = [];
  showRegisterModal = false;
  @Input() currentIndex = 0;
  @Input() isLoggedIn = false;

  @Output() toggleLogin = new EventEmitter<void>();
  @Output() register = new EventEmitter<void>();
  @Output() selectConversation = new EventEmitter<number>();
  @Output() createConversation = new EventEmitter<void>();
  @Output() deleteConversation = new EventEmitter<number>();

  onToggleLogin() {
    this.toggleLogin.emit();
  }

  onRegister() {
    // open register modal
    this.showRegisterModal = true;
    this.register.emit();
  }

  onSelectConversation(index: number) {
    this.selectConversation.emit(index);
  }

  onCreateConversation() {
    this.createConversation.emit();
  }

  onDeleteConversation(index: number) {
    this.deleteConversation.emit(index);
  }
  onRegistered(event: any) {
    // Close modal already handled by modal; optionally handle result
    console.log('User registered', event);
  }
}
