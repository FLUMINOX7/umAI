import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-composer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form class="composer" (ngSubmit)="onSubmit()">
      <div class="input-shell" [class.focused]="focused">
        <textarea
          [(ngModel)]="message"
          name="prompt"
          rows="1"
          placeholder="Écrivez votre message…"
          (focus)="focused = true"
          (blur)="focused = false"
          (input)="autoGrow($event)"
          (keydown.enter)="onEnter($event)"
        ></textarea>
        <button
          class="send-button"
          type="submit"
          [disabled]="!message.trim() || sending"
          aria-label="Envoyer"
        >
          <svg *ngIf="!sending" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 19V5"/><path d="M5 12l7-7 7 7"/>
          </svg>
          <span *ngIf="sending" class="spinner" aria-hidden="true"></span>
        </button>
      </div>
      <p class="hint">
        <kbd>Entrée</kbd> pour envoyer · <kbd>Maj</kbd>+<kbd>Entrée</kbd> pour un saut de ligne
      </p>
    </form>
  `,
  styles: [`
    :host { flex: none; }

    .composer {
      padding: 1rem 1.75rem 1.25rem;
      border-top: 1px solid var(--border);
      background: linear-gradient(0deg, var(--surface-2), var(--surface));
    }

    .input-shell {
      display: flex;
      align-items: flex-end;
      gap: 0.6rem;
      max-width: 880px;
      margin: 0 auto;
      padding: 0.5rem 0.5rem 0.5rem 1.1rem;
      background: var(--surface);
      border: 1.5px solid var(--border-strong);
      border-radius: var(--r-xl);
      box-shadow: var(--shadow-sm);
      transition: border-color var(--ease), box-shadow var(--ease);
    }

    .input-shell.focused {
      border-color: var(--orange);
      box-shadow: 0 0 0 4px rgba(255, 138, 61, 0.12);
    }

    textarea {
      flex: 1 1 auto;
      min-width: 0;
      max-height: 180px;
      resize: none;
      border: none;
      outline: none;
      background: transparent;
      color: var(--text);
      font: inherit;
      line-height: 1.5;
      padding: 0.55rem 0;
    }

    textarea::placeholder { color: var(--text-muted); }

    .send-button {
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 50%;
      background: var(--gradient-warm);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: var(--shadow-glow);
      transition: transform var(--ease), opacity var(--ease), box-shadow var(--ease);
    }

    .send-button:hover:not(:disabled) { transform: translateY(-2px) scale(1.04); }

    .send-button:disabled {
      background: var(--border-strong);
      box-shadow: none;
      opacity: 0.7;
      cursor: not-allowed;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2.5px solid rgba(255, 255, 255, 0.4);
      border-top-color: #fff;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .hint {
      max-width: 880px;
      margin: 0.6rem auto 0;
      text-align: center;
      font-size: 0.74rem;
      color: var(--text-muted);
    }

    kbd {
      font-family: inherit;
      font-size: 0.72rem;
      padding: 0.05rem 0.35rem;
      border-radius: 5px;
      background: var(--surface-2);
      border: 1px solid var(--border-strong);
      color: var(--text-soft);
    }

    @media (max-width: 720px) {
      .composer { padding: 0.75rem 1rem 1rem; }
      .hint { display: none; }
    }
  `]
})
export class ComposerComponent {
  @Input() sending = false;
  message = '';
  focused = false;

  @Output() messageSent = new EventEmitter<string>();

  onSubmit() {
    const text = this.message.trim();
    if (text && !this.sending) {
      this.messageSent.emit(text);
      this.message = '';
      this.focused = false;
    }
  }

  onEnter(event: Event): void {
    const e = event as KeyboardEvent;
    if (!e.shiftKey) {
      e.preventDefault();
      this.onSubmit();
      const ta = e.target as HTMLTextAreaElement;
      ta.style.height = 'auto';
    }
  }

  autoGrow(event: Event): void {
    const ta = event.target as HTMLTextAreaElement;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
  }
}
