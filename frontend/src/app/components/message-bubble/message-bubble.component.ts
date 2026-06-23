import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { Message } from '../../interfaces/chat.interface';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="bubble-wrapper"
      [class.user]="message.role === 'user'"
      [class.ai]="message.role === 'ai'"
      (mouseenter)="hovered = true"
      (mouseleave)="hovered = false"
    >
      <div class="row">
        <div *ngIf="message.role === 'ai'" class="avatar" aria-hidden="true">✦</div>

        <div class="bubble" [class.ai]="message.role === 'ai'" [class.user]="message.role === 'user'">
          <ng-container *ngIf="!editing">
            <div class="md-content" [innerHTML]="parsed"></div>
          </ng-container>
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
      max-width: 80%;
      animation: pop-in 0.25s ease;
    }

    .bubble-wrapper.ai {
      align-items: flex-start;
    }

    .bubble-wrapper.user {
      align-items: flex-end;
    }

    .row {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
    }

    .avatar {
      width: 34px;
      height: 34px;
      flex-shrink: 0;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: var(--gradient-warm);
      color: #fff;
      font-size: 0.95rem;
      box-shadow: var(--shadow-sm);
      margin-top: 2px;
    }

    .bubble {
      padding: 0.9rem 1.15rem;
      border-radius: var(--r-lg);
      line-height: 1.55;
      word-break: break-word;
      font-size: 0.96rem;
    }

    .bubble.ai {
      background: var(--surface-2);
      color: var(--text);
      border: 1px solid var(--border);
      border-top-left-radius: var(--r-sm);
    }

    .bubble.user {
      background: var(--gradient-warm);
      color: #fff;
      border-top-right-radius: var(--r-sm);
      box-shadow: var(--shadow-sm);
    }

    @keyframes pop-in {
      from { opacity: 0; transform: translateY(6px) scale(0.99); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .md-content :first-child { margin-top: 0; }
    .md-content :last-child  { margin-bottom: 0; }

    .md-content p  { margin: 0.4em 0; line-height: 1.5; }
    .md-content ul,
    .md-content ol { margin: 0.4em 0; padding-left: 1.4em; }
    .md-content li { margin: 0.2em 0; }

    .md-content code {
      font-family: 'Fira Code', monospace;
      font-size: 0.88em;
      padding: 0.1em 0.35em;
      border-radius: 4px;
    }
    .bubble.user .md-content code { background: rgba(255,255,255,0.2); }
    .bubble.ai   .md-content code { background: rgba(0,0,0,0.07); }

    .md-content pre {
      margin: 0.5em 0;
      padding: 0.75em 1em;
      border-radius: 0.5rem;
      overflow-x: auto;
      font-size: 0.85em;
    }
    .bubble.user .md-content pre { background: rgba(255,255,255,0.15); }
    .bubble.ai   .md-content pre { background: rgba(0,0,0,0.06); }

    .md-content pre code { background: none; padding: 0; }

    .md-content h1, .md-content h2, .md-content h3 {
      margin: 0.5em 0 0.25em;
      font-size: 1em;
      font-weight: 700;
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
      color: var(--red);
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
      background: var(--surface-2);
    }

    .delete-btn {
      color: var(--red);
      font-size: 0.9rem;
      font-weight: 700;
    }

    .delete-btn:hover {
      background: var(--danger-bg);
    }
  `]
})
export class MessageBubbleComponent {
  @Input() set message(msg: Message) {
    this._message = msg;
    this.parsed = this.sanitizer.bypassSecurityTrustHtml(
      marked.parse(msg.text ?? '') as string
    );
  }
  get message(): Message { return this._message; }

  @Output() edited  = new EventEmitter<string>();
  @Output() deleted = new EventEmitter<void>();

  private _message!: Message;
  parsed!: SafeHtml;

  private sanitizer = inject(DomSanitizer);

  hovered = false;
  editing = false;
  editText = '';

  startEdit(): void {
    this.editText = this._message.text;
    this.editing = true;
  }

  confirmEdit(): void {
    const trimmed = this.editText.trim();
    if (trimmed && trimmed !== this._message.text) {
      this.edited.emit(trimmed);
    }
    this.editing = false;
  }

  cancelEdit(): void {
    this.editing = false;
  }
}
