import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../interfaces/chat.interface';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [CommonModule, MessageBubbleComponent],
  template: `
    <section #scroll class="message-window">
      <!-- ── Écran d'accueil ── -->
      <div *ngIf="messages.length === 0 && !loading" class="welcome">
        <div class="welcome-logo">✦</div>
        <h2 class="welcome-title">Comment puis-je vous aider&nbsp;?</h2>
        <p class="welcome-text">
          Posez une question, ou commencez avec l'une de ces suggestions.
        </p>

        <div class="suggestions">
          <button
            class="suggestion"
            *ngFor="let s of suggestions"
            type="button"
            (click)="suggestionPicked.emit(s.prompt)"
          >
            <span class="suggestion-label">{{ s.label }}</span>
          </button>
        </div>
      </div>

      <!-- ── Fil de discussion ── -->
      <div *ngIf="messages.length > 0" class="message-list">
        <div
          class="message"
          *ngFor="let message of messages; let i = index"
          [class.user]="message.role === 'user'"
          [class.ai]="message.role === 'ai'"
        >
          <app-message-bubble
            [message]="message"
            (edited)="messageEdited.emit({ index: i, newText: $event })"
            (deleted)="messageDeleted.emit(i)"
          ></app-message-bubble>
        </div>

        <!-- ── Indicateur de frappe ── -->
        <div *ngIf="loading" class="message ai">
          <div class="typing">
            <span class="typing-avatar">✦</span>
            <span class="typing-dots">
              <span></span><span></span><span></span>
            </span>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    .message-window {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      padding: 1.75rem;
      scroll-behavior: smooth;
    }

    .message-list {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
      max-width: 880px;
      margin: 0 auto;
    }

    .message { display: flex; }
    .message.ai   { justify-content: flex-start; }
    .message.user { justify-content: flex-end; }

    /* ── Écran d'accueil ── */
    .welcome {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 1rem;
      animation: fade-in 0.4s ease;
    }

    .welcome-logo {
      width: 72px;
      height: 72px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: var(--gradient-warm);
      color: #fff;
      font-size: 2rem;
      box-shadow: var(--shadow-glow);
      margin-bottom: 1.25rem;
    }

    .welcome-title {
      margin: 0 0 0.5rem;
      font-size: 1.6rem;
      font-weight: 800;
      letter-spacing: -0.01em;
    }

    .welcome-text {
      margin: 0 0 2rem;
      color: var(--text-soft);
      font-size: 1rem;
    }

    .suggestions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.85rem;
      width: 100%;
      max-width: 560px;
    }

    .suggestion {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 0.95rem 1.1rem;
      text-align: center;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--r-md);
      cursor: pointer;
      font: inherit;
      color: var(--text);
      transition: transform var(--ease), box-shadow var(--ease),
                  border-color var(--ease);
    }

    .suggestion:hover {
      transform: translateY(-2px);
      border-color: var(--orange);
      box-shadow: var(--shadow-md);
    }

    .suggestion-emoji { font-size: 1.3rem; line-height: 1; flex-shrink: 0; }
    .suggestion-label { font-size: 0.92rem; font-weight: 600; }

    /* ── Indicateur de frappe ── */
    .typing {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
    }

    .typing-avatar {
      width: 34px;
      height: 34px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: var(--gradient-warm);
      color: #fff;
      font-size: 0.95rem;
      flex-shrink: 0;
    }

    .typing-dots {
      display: inline-flex;
      gap: 0.3rem;
      padding: 0.9rem 1.1rem;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      border-top-left-radius: var(--r-sm);
    }

    .typing-dots span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--orange);
      animation: bounce 1.2s infinite ease-in-out;
    }
    .typing-dots span:nth-child(2) { animation-delay: 0.18s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.36s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40%           { transform: scale(1);   opacity: 1; }
    }

    @keyframes fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 720px) {
      .message-window { padding: 1.1rem; }
      .suggestions { grid-template-columns: 1fr; }
    }
  `]
})
export class MessageListComponent implements AfterViewChecked {
  @Input() messages: Message[] = [];
  @Input() loading = false;

  @Output() messageEdited = new EventEmitter<{ index: number; newText: string }>();
  @Output() messageDeleted = new EventEmitter<number>();
  @Output() suggestionPicked = new EventEmitter<string>();

  @ViewChild('scroll') private scrollRef?: ElementRef<HTMLElement>;

  suggestions = [
    { label: 'Explique-moi cette recette', prompt: 'Explique-moi simplement la recette de...' },
    { label: 'idée de repas',          prompt: 'Donne moi une idée de repas facile a faire' },
    { label: 'dessert facile',          prompt: 'Donne moi une idée de dessert facile a faire' },
    { label: 'cuisine indienne',        prompt: 'Donne moi une idée de plat indien' },
  ];

  private lastCount = -1;

  ngAfterViewChecked(): void {
    const el = this.scrollRef?.nativeElement;
    if (!el) return;
    const count = this.messages.length + (this.loading ? 1 : 0);
    if (count !== this.lastCount) {
      this.lastCount = count;
      el.scrollTop = el.scrollHeight;
    }
  }
}
