import { Component } from '@angular/core';
import { ChatPageComponent } from './pages/chat/chat-page.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ChatPageComponent],
  template: `<app-chat-page></app-chat-page>`,
  styles: []
})
export class AppComponent {}
