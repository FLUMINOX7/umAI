import {
  Component,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConversationTitleInputComponent } from './conversation-title-input.component';

/**
 * MOLECULE — Formulaire de renommage inline.
 * Compose l'atom <app-conversation-title-input> avec deux boutons ✓ / ✗.
 *
 * Usage :
 *   <app-conversation-rename-form
 *     [currentTitle]="conversation.title"
 *     (confirmed)="onRename($event)"
 *     (cancelled)="onCancelRename()"
 *   />
 */
@Component({
  selector: 'app-conversation-rename-form',
  standalone: true,
  imports: [CommonModule, ConversationTitleInputComponent],
  template: `
    <div class="rename-form" (click)="$event.stopPropagation()">
      <app-conversation-title-input
        [value]="currentTitle"
        (confirm)="onConfirm($event)"
        (cancel)="cancelled.emit()"
      ></app-conversation-title-input>

      <div class="rename-actions">
        <!-- Annuler (mousedown avant blur de l'input) -->
        <button
          class="action-btn cancel-btn"
          type="button"
          (mousedown)="$event.preventDefault()"
          (click)="cancelled.emit()"
          title="Annuler"
          aria-label="Annuler le renommage"
        >✗</button>
      </div>
    </div>
  `,
  styles: [`
    .rename-form {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      width: 100%;
    }

    app-conversation-title-input {
      flex: 1 1 auto;
      min-width: 0;
    }

    .rename-actions {
      display: flex;
      gap: 0.25rem;
      flex-shrink: 0;
    }

    .action-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: none;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background 0.12s ease, color 0.12s ease;
    }

    .cancel-btn {
      background: #f3f4f6;
      color: #6b7280;
    }

    .cancel-btn:hover {
      background: rgba(220, 44, 36, 0.08);
      color: #dc2c24;
    }
  `],
})
export class ConversationRenameFormComponent {
  @Input() currentTitle = '';

  @Output() confirmed = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(newTitle: string) {
    this.confirmed.emit(newTitle);
  }
}
