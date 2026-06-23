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
      gap: 0.4rem;
      width: 100%;
      padding: 0.2rem 0.35rem 0.2rem 0;
      background: transparent;
      border-radius: var(--r-md);
      border: 1px solid transparent;
      color: var(--text);
      cursor: pointer;
      transition: background var(--ease), border-color var(--ease);
    }

    .conversation-card:hover:not(.renaming) {
      background: var(--surface-2);
    }

    .conversation-card.active {
      border-color: rgba(255, 138, 61, 0.4);
      background: var(--gradient-warm-soft);
    }

    .conversation-card.active::before {
      content: '';
      width: 3px;
      align-self: stretch;
      margin: 0.45rem 0;
      border-radius: var(--r-pill);
      background: var(--gradient-warm);
    }

    .conversation-card.renaming {
      cursor: default;
      background: #fff8f5;
      border-color: rgba(255, 138, 61, 0.3);
      padding-left: 0.5rem;
    }

    /* ── Zone texte ── */
    .conversation-link {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.15rem;
      flex: 1 1 auto;
      min-width: 0;
      padding: 0.55rem 0.4rem 0.55rem 0.75rem;
      text-align: left;
    }

    .conv-title {
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    }

    .conversation-card.active .conv-title { color: var(--red-dark); font-weight: 700; }

    .conv-preview {
      font-size: 0.76rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    }

    /* ── Boutons d'action ── */
    .card-actions {
      display: flex;
      align-items: center;
      gap: 0.1rem;
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
      color: var(--text-muted);
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background var(--ease), color var(--ease);
    }

    .rename-btn:hover {
      background: rgba(255, 138, 61, 0.12);
      color: var(--orange-deep);
    }

    .delete-btn:hover {
      background: var(--danger-bg);
      color: var(--red);
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
