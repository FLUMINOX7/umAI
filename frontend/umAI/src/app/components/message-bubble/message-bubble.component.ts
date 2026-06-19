import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Message } from '../../interfaces/chat.interface';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="bubble-wrapper"
      [class.user]="message.role === 'user'"
      (mouseenter)="hovered = true"
      (mouseleave)="hovered = false"
    >
      <div class="bubble" [class.ai]="message.role === 'ai'" [class.user]="message.role === 'user'">
        <ng-container *ngIf="!editing">{{ message.text }}</ng-container>
        <ng-container *ngIf="editing">
          <textarea
            class="edit-area"
            [(ngModel)]="editText"
            rows="3"
            autofocus
          ></textarea>
          <div class="edit-actions">
            <button class="btn-confirm" (click)="confirmEdit()">Enregistrer</button>
            <button class="btn-cancel"  (click)="cancelEdit()">Annuler</button>
          </div>
        </ng-container>
      </div>

      <div *ngIf="message.role === 'user' && hovered && !editing" class="action-btns">
        <button class="action-btn" title="Modifier" (click)="startEdit()">✏️</button>
        <button class="action-btn delete-btn" title="Supprimer" (click)="deleted.emit()">✕</button>
      </div>
    </div>
  `,
  styles: [`
    .bubble-wrapper {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.3rem;
    }

    .bubble-wrapper.user {
      align-items: flex-end;
    }

    .bubble {
      max-width: 75%;
      padding: 1rem 1.1rem;
      border-radius: 1.5rem;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .bubble.ai {
      background: #fff0e6;
      color: #111827;
      border: 1px solid #ffe0c7;
      border-top-left-radius: 0.5rem;
    }

    .bubble.user {
      background: #dc2c24;
      color: #fff;
      border-top-right-radius: 0.5rem;
    }

    .edit-area {
      width: 100%;
      min-width: 220px;
      resize: vertical;
      padding: 0.5rem;
      border-radius: 0.5rem;
      border: none;
      background: rgba(255,255,255,0.2);
      color: #fff;
      font: inherit;
      outline: none;
      box-sizing: border-box;
    }

    .edit-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.4rem;
    }

    .btn-confirm, .btn-cancel {
      padding: 0.25rem 0.75rem;
      border: none;
      border-radius: 999px;
      font-size: 0.8rem;
      cursor: pointer;
      font-weight: 600;
      transition: opacity 0.15s;
    }

    .btn-confirm {
      background: #fff;
      color: #dc2c24;
    }

    .btn-cancel {
      background: rgba(255,255,255,0.25);
      color: #fff;
    }

    .btn-confirm:hover, .btn-cancel:hover {
      opacity: 0.85;
    }

    .action-btns {
      display: flex;
      gap: 0.25rem;
    }

    .action-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.85rem;
      padding: 0.1rem 0.35rem;
      border-radius: 0.4rem;
      transition: background 0.15s;
      line-height: 1;
    }

    .action-btn:hover {
      background: #f3f4f6;
    }

    .delete-btn {
      color: #dc2c24;
      font-size: 0.9rem;
      font-weight: 700;
    }

    .delete-btn:hover {
      background: #fee2e2;
    }
  `]
})
export class MessageBubbleComponent {
  @Input() message!: Message;
  @Output() edited = new EventEmitter<string>();
  @Output() deleted = new EventEmitter<void>();

  hovered = false;
  editing = false;
  editText = '';

  startEdit(): void {
    this.editText = this.message.text;
    this.editing = true;
  }

  confirmEdit(): void {
    const trimmed = this.editText.trim();
    if (trimmed && trimmed !== this.message.text) {
      this.edited.emit(trimmed);
    }
    this.editing = false;
  }

  cancelEdit(): void {
    this.editing = false;
  }
}
