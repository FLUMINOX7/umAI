import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type RetrievalMode = 'web' | 'rag';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="chat-header">
      <div>
        <h1>{{ title }}</h1>
        <p>{{ updated }}</p>
      </div>

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

      <button class="clear-button" type="button" (click)="clear.emit()">
        Effacer
      </button>
    </header>
  `,
  styles: [`
    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      border-bottom: 1px solid #f3f4f6;
      padding-bottom: 1rem;
    }

    h1 {
      font-size: 1.45rem;
      margin: 0;
    }

    p {
      margin: 0.35rem 0 0;
      color: #6b7280;
    }

    .retrieval-toggle {
      display: flex;
      gap: 0.25rem;
      background: #f3f4f6;
      border-radius: 999px;
      padding: 0.2rem;
    }

    .toggle-btn {
      padding: 0.45rem 1rem;
      border: none;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      background: transparent;
      color: #6b7280;
      transition: background 0.2s ease, color 0.2s ease;
    }

    .toggle-btn.active {
      background: #fff;
      color: #dc2c24;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    }

    .toggle-btn:not(.active):hover {
      color: #111827;
    }

    .clear-button {
      padding: 0.8rem 1rem;
      background: #f97316;
      color: #fff;
      border: none;
      border-radius: 999px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.2s ease;
    }

    .clear-button:hover {
      opacity: 0.92;
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
