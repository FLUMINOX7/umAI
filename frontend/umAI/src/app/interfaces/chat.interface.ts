export interface Message {
  role: 'user' | 'ai';
  text: string;
  timestamp?: Date;
}

export interface Conversation {
  id: string;
  title: string;
  preview: string;
  updated: string;
  messages: Message[];
  createdAt?: Date;
}
