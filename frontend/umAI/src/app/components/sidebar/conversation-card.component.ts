import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conversation } from '../../interfaces/chat.interface';

@Component({
  selector: 'app-conversation-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="conversation-card"
      [class.active]="index === currentIndex"
      (click)="select.emit(index)"
      role="button"
      tabindex="0"
    >
      <div class="conversation-link">
        <span>{{ conversation.title }}</span>
        <small>{{ conversation.preview }}</small>
      </div>

      <button
        class="delete-conversation"
        type="button"
        (click)="onDelete($event)"
        aria-label="Supprimer la conversation"
        title="Supprimer"
      >
        🗑
      </button>
    </div>
  `,
  styles: [
    `
      .conversation-card {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.5rem;
        background: transparent;
        border-radius: 0.9rem;
        color: #111827;
        cursor: pointer;
        transition: background 0.12s ease, transform 0.12s ease, box-shadow 0.12s ease;
      }

      .conversation-card:hover {
        background: rgba(255, 138, 61, 0.06);
        transform: translateY(-2px);
        box-shadow: 0 6px 18px rgba(0,0,0,0.04);
      }

      .conversation-card.active {
        border: 1px solid #ff8a3d;
        background: linear-gradient(135deg, rgba(255,138,61,0.06) 0%, rgba(220,44,36,0.03) 100%);
      }

      .conversation-link {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
        flex: 1 1 auto;
        width: 100%;
        padding: 0.75rem 0.9rem;
        background: transparent;
        border-radius: 0.75rem;
        text-align: left;
        color: inherit;
      }

      .conversation-link span {
        font-size: 0.95rem;
        font-weight: 700;
        color: #dc2c24;
      }

      .conversation-link small {
        font-size: 0.82rem;
        color: #6b7280;
      }

      .delete-conversation {
        border: none;
        background: transparent;
        color: #9ca3af;
        font-size: 1.1rem;
        width: 36px;
        height: 36px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.12s ease, color 0.12s ease;
      }

      .delete-conversation:hover {
        background: rgba(220,44,36,0.06);
        color: #dc2c24;
      }
    `
  ]
})
export class ConversationCardComponent {
  @Input() conversation!: Conversation;
  @Input() index = 0;
  @Input() currentIndex = 0;

  @Output() select = new EventEmitter<number>();
  @Output() delete = new EventEmitter<number>();

  onDelete(event: Event) {
    event.stopPropagation();
    this.delete.emit(this.index);
  }
}
