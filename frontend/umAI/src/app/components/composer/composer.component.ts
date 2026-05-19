import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-composer',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form class="composer" (ngSubmit)="onSubmit()">
      <textarea
        [(ngModel)]="message"
        name="prompt"
        rows="2"
        placeholder="Tapez votre message..."
      ></textarea>
      <button
        class="send-button"
        type="submit"
        [disabled]="!message.trim()"
        aria-label="Envoyer"
      >
        &#8593;
      </button>
    </form>
  `,
  styles: [`
    .composer {
      display: grid;
      grid-template-columns: 1fr 52px;
      gap: 0.75rem;
      align-items: end;
      padding-top: 1rem;
      border-top: 1px solid #f3f4f6;
    }

    textarea {
      width: 100%;
      min-width: 0;
      min-height: 96px;
      resize: vertical;
      padding: 1rem;
      border-radius: 1rem;
      border: 1px solid #d1d5db;
      background: #f8fafc;
      color: #111827;
      font: inherit;
      box-sizing: border-box;
    }

    .send-button {
      width: 52px;
      height: 52px;
      border: none;
      border-radius: 999px;
      background: linear-gradient(135deg, #ff8a3d 0%, #dc2c24 100%);
      color: #fff;
      font-size: 1.2rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .send-button:hover:not(:disabled) {
      opacity: 0.92;
      transform: translateY(-1px);
    }

    .send-button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  `]
})
export class ComposerComponent {
  message = '';

  @Output() messageSent = new EventEmitter<string>();

  onSubmit() {
    const text = this.message.trim();
    if (text) {
      this.messageSent.emit(text);
      this.message = '';
    }
  }
}
