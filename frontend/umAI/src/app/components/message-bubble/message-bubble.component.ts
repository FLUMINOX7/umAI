import { Component, Input } from '@angular/core';
import { Message } from '../../interfaces/chat.interface';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  template: `
    <div class="bubble" [class.ai]="message.role === 'ai'" [class.user]="message.role === 'user'">
      {{ message.text }}
    </div>
  `,
  styles: [`
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
  `]
})
export class MessageBubbleComponent {
  @Input() message!: Message;
}
