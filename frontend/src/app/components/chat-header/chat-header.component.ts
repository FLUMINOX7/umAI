import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type RetrievalMode = 'web' | 'rag';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="chat-header">
      <div class="title-block">
        <h1>{{ title }}</h1>
        <p *ngIf="updated">
          <span class="dot"></span>{{ updated }}
        </p>
      </div>

      <div class="controls">
        <div class="retrieval-toggle">
          <button
            class="toggle-btn"
            [class.active]="retrievalMode === 'web'"
            type="button"
            title="Recherche web (DuckDuckGo)"
            (click)="setMode('web')"
          >
            🌐 Web
          </button>
          <button
            class="toggle-btn"
            [class.active]="retrievalMode === 'rag'"
            type="button"
            title="Contexte PDF"
            (click)="setMode('rag')"
          >
            📄 PDF
          </button>
        </div>

        <button class="clear-button" type="button" title="Réinitialiser l'affichage" (click)="clear.emit()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2.2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
          <span>Effacer</span>
        </button>
      </div>
    </header>
  `,
  styles: [`
    :host { flex: none; }

    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      padding: 1.1rem 1.75rem;
      border-bottom: 1px solid var(--border);
      background: linear-gradient(180deg, var(--surface), var(--surface-2));
    }

    .title-block { min-width: 0; }

    h1 {
      font-size: 1.25rem;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.01em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    p {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      margin: 0.3rem 0 0;
      color: var(--text-soft);
      font-size: 0.82rem;
    }

    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--success-fg);
      box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.15);
    }

    .controls {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .retrieval-toggle {
      display: flex;
      gap: 0.2rem;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: var(--r-pill);
      padding: 0.25rem;
    }

    .toggle-btn {
      padding: 0.45rem 0.95rem;
      border: none;
      border-radius: var(--r-pill);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      background: transparent;
      color: var(--text-soft);
      transition: background var(--ease), color var(--ease), box-shadow var(--ease);
    }

    .toggle-btn.active {
      background: var(--surface);
      color: var(--red);
      box-shadow: var(--shadow-sm);
    }

    .toggle-btn:not(.active):hover { color: var(--text); }

    .clear-button {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.55rem 0.95rem;
      background: var(--surface);
      color: var(--text-soft);
      border: 1px solid var(--border-strong);
      border-radius: var(--r-pill);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: color var(--ease), border-color var(--ease), background var(--ease);
    }

    .clear-button:hover {
      color: var(--red);
      border-color: var(--red);
      background: var(--danger-bg);
    }

    @media (max-width: 720px) {
      .chat-header { padding: 0.9rem 1.1rem; }
      .clear-button span { display: none; }
    }
  `]
})
export class ChatHeaderComponent {
  @Input() title = '';
  @Input() updated = '';
  @Input() retrievalMode: RetrievalMode = 'rag';
  @Output() clear = new EventEmitter<void>();
  @Output() retrievalModeChange = new EventEmitter<RetrievalMode>();

  setMode(mode: RetrievalMode): void {
    this.retrievalModeChange.emit(mode);
  }
}
