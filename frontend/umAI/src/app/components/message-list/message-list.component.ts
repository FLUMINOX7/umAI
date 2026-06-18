import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../interfaces/chat.interface';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [CommonModule, MessageBubbleComponent],
  template: `
    <section class="message-window">
      <div class="message-list">
        <div
          class="message"
          *ngFor="let message of messages; let i = index"
          [class.user]="message.role === 'user'"
          [class.ai]="message.role === 'ai'"
        >
          <app-message-bubble
            [message]="message"
            (edited)="messageEdited.emit({ index: i, newText: $event })"
            (deleted)="messageDeleted.emit(i)"
          ></app-message-bubble>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .message-window {
      min-height: 420px;
      overflow-y: auto;
      padding-right: 0.5rem;
    }

    .message-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .message {
      display: flex;
    }

    .message.ai {
      justify-content: flex-start;
    }

    .message.user {
      justify-content: flex-end;
    }
  `]
})
export class MessageListComponent {
  @Input() messages: Message[] = [];
  @Output() messageEdited = new EventEmitter<{ index: number; newText: string }>();
  @Output() messageDeleted = new EventEmitter<number>();
}
