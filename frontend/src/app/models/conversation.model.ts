import { Conversation, Message } from '../interfaces/chat.interface';

export class ConversationModel implements Conversation {
  id: string;
  title: string;
  preview: string;
  updated: string;
  messages: Message[];
  createdAt: Date;

  constructor(
    title: string = '',
    messages: Message[] = [],
    createdAt: Date = new Date()
  ) {
    this.id = this.generateId();
    this.title = title;
    this.preview = messages[0]?.text.substring(0, 50) || 'Nouvelle conversation';
    this.updated = 'À l\'instant';
    this.messages = messages;
    this.createdAt = createdAt;
  }

  private generateId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addMessage(message: Message): void {
    this.messages.push(message);
    this.preview = message.text.substring(0, 50) + '...';
    this.updated = 'À l\'instant';
  }

  clearMessages(): void {
    this.messages = [];
    this.preview = 'Conversation vide';
    this.updated = 'À l\'instant';
  }
}
