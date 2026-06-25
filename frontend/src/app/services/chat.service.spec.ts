import { TestBed } from '@angular/core/testing';
import { ChatService } from './services/chat.service';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with one default conversation', () => {
    expect(service.conversations$().length).toBe(1);
  });

  it('should create a new conversation', () => {
    const initialCount = service.conversations$().length;
    service.createConversation();
    expect(service.conversations$().length).toBe(initialCount + 1);
  });

  it('should add a message to the current conversation', () => {
    const initialCount = service.getCurrentConversation().messages.length;
    service.addMessage({
      role: 'user',
      text: 'Hello'
    });
    expect(service.getCurrentConversation().messages.length).toBe(initialCount + 1);
  });

  it('should clear the current conversation', () => {
    service.addMessage({
      role: 'user',
      text: 'Test message'
    });
    service.clearCurrentConversation();
    expect(service.getCurrentConversation().messages.length).toBe(0);
  });
});
