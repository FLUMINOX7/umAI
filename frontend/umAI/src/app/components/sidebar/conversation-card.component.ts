import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conversation } from '../../interfaces/chat.interface';
import { ConversationRenameFormComponent } from './conversation-rename-form.component';

/**
 * MOLECULE — Carte d'une conversation dans la sidebar.
 *
 * Comportements :
 *   • Clic simple   → sélectionne la conversation
 *   • Double-clic   → active le mode renommage inline
 *   • Bouton 🗑     → demande la suppression
 *   • Renommage confirmé → émet (rename) avec le nouveau titre
 */
@Component({
  selector: 'app-conversation-card',
  standalone: true,
  imports: [CommonModule, ConversationRenameFormComponent],
  template: `
    <div
      class="conversation-card"
      [class.active]="index === currentIndex"
      [class.renaming]="isRenaming()"
      (click)="onCardClick()"
      (dblclick)="onStartRename()"
      role="button"
      tabindex="0"
      (keydown.enter)="onCardClick()"
      (keydown.f2)="onStartRename()"
    >
      <!-- ── Mode lecture ── -->
      <ng-container *ngIf="!isRenaming(); else renameMode">
        <div class="conversation-link">
          <span class="conv-title" title="Double-cliquez pour renommer">
            {{ conversation.title }}
          </span>
          <small class="conv-preview">{{ conversation.preview }}</small>
        </div>

        <div class="card-actions">
          <!-- Renommer -->
          <button
            class="icon-btn rename-btn"
            type="button"
            (click)="onStartRename(); $event.stopPropagation()"
            aria-label="Renommer la conversation"
            title="Renommer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                 viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>

          <!-- Supprimer -->
          <button
            class="icon-btn delete-btn"
            type="button"
            (click)="onDelete($event)"
            aria-label="Supprimer la conversation"
            title="Supprimer"
          >🗑</button>
        </div>
      </ng-container>

      <!-- ── Mode renommage ── -->
      <ng-template #renameMode>
        <app-conversation-rename-form
          [currentTitle]="conversation.title"
          (confirmed)="onRenameConfirmed($event)"
          (cancelled)="onCancelRename()"
        ></app-conversation-rename-form>
      </ng-template>
    </div>
  `,
  styles: [`
    .conversation-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.5rem;
      background: transparent;
      border-radius: 0.9rem;
      border: 1px solid transparent;
      color: #111827;
      cursor: pointer;
      transition: background 0.12s ease, transform 0.12s ease,
                  box-shadow 0.12s ease, border-color 0.12s ease;
    }

    .conversation-card:hover:not(.renaming) {
      background: rgba(255, 138, 61, 0.06);
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.04);
    }

    .conversation-card.active {
      border-color: #ff8a3d;
      background: linear-gradient(
        135deg,
        rgba(255, 138, 61, 0.06) 0%,
        rgba(220, 44, 36, 0.03) 100%
      );
    }

    .conversation-card.renaming {
      cursor: default;
      background: #fff8f5;
      border-color: rgba(255, 138, 61, 0.3);
    }

    /* ── Zone texte ── */
    .conversation-link {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
      flex: 1 1 auto;
      min-width: 0;
      padding: 0.75rem 0.9rem;
      border-radius: 0.75rem;
      text-align: left;
    }

    .conv-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #dc2c24;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    }

    .conv-preview {
      font-size: 0.82rem;
      color: #6b7280;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    }

    /* ── Boutons d'action ── */
    .card-actions {
      display: flex;
      align-items: center;
      gap: 0.2rem;
      flex-shrink: 0;
      opacity: 0;
      transition: opacity 0.15s ease;
    }

    .conversation-card:hover .card-actions,
    .conversation-card.active .card-actions {
      opacity: 1;
    }

    .icon-btn {
      border: none;
      background: transparent;
      color: #9ca3af;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.12s ease, color 0.12s ease;
    }

    .rename-btn:hover {
      background: rgba(255, 138, 61, 0.1);
      color: #ff8a3d;
    }

    .delete-btn:hover {
      background: rgba(220, 44, 36, 0.08);
      color: #dc2c24;
    }
  `],
})
export class ConversationCardComponent {
  @Input() conversation!: Conversation;
  @Input() index = 0;
  @Input() currentIndex = 0;
  /** true si une opération de renommage est en cours (ex: appel API) */
  @Input() renaming = false;

  @Output() select = new EventEmitter<number>();
  @Output() delete = new EventEmitter<number>();
  /** Émet { index, newTitle } quand le renommage est confirmé */
  @Output() rename = new EventEmitter<{ index: number; newTitle: string }>();

  isRenaming = signal(false);

  onCardClick() {
    if (!this.isRenaming()) {
      this.select.emit(this.index);
    }
  }

  onStartRename() {
    this.isRenaming.set(true);
  }

  onRenameConfirmed(newTitle: string) {
    this.isRenaming.set(false);
    this.rename.emit({ index: this.index, newTitle });
  }

  onCancelRename() {
    this.isRenaming.set(false);
  }

  onDelete(event: Event) {
    event.stopPropagation();
    this.delete.emit(this.index);
  }
}
