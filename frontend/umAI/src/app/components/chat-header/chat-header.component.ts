import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  template: `
    <header class="chat-header">
      <div>
        <h1>{{ title }}</h1>
        <p>{{ updated }}</p>
      </div>
      <button class="clear-button" type="button" (click)="onClear()">
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
  @Output() clear = new EventEmitter<void>();

  onClear() {
    this.clear.emit();
  }
}
