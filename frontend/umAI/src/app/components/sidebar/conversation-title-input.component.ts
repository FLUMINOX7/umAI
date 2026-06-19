import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * ATOM — Champ texte inline pour éditer un titre de conversation.
 * Émet la valeur confirmée (enter / blur) ou l'annulation (escape).
 */
@Component({
  selector: 'app-conversation-title-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <input
      #titleInput
      class="title-input"
      type="text"
      [value]="value"
      (input)="onInput($event)"
      (keydown.enter)="onConfirm()"
      (keydown.escape)="cancel.emit()"
      (blur)="onConfirm()"
      [attr.maxlength]="maxLength"
      aria-label="Nom de la conversation"
    />
  `,
  styles: [`
    .title-input {
      width: 100%;
      padding: 0.3rem 0.5rem;
      border: 1.5px solid #ff8a3d;
      border-radius: 0.5rem;
      font-size: 0.95rem;
      font-weight: 700;
      color: #111827;
      background: #fff8f5;
      outline: none;
      box-shadow: 0 0 0 3px rgba(255, 138, 61, 0.15);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .title-input:focus {
      border-color: #dc2c24;
      box-shadow: 0 0 0 3px rgba(220, 44, 36, 0.12);
    }
  `],
})
export class ConversationTitleInputComponent implements AfterViewInit {
  @Input() value = '';
  @Input() maxLength = 80;

  @Output() confirm = new EventEmitter<string>();
  @Output() cancel  = new EventEmitter<void>();

  @ViewChild('titleInput') inputRef!: ElementRef<HTMLInputElement>;

  private current = '';

  ngAfterViewInit() {
    this.current = this.value;
    // Focus automatique + sélection du texte existant
    const el = this.inputRef.nativeElement;
    el.value = this.value;
    el.focus();
    el.select();
  }

  onInput(event: Event) {
    this.current = (event.target as HTMLInputElement).value;
  }

  onConfirm() {
    const trimmed = this.current.trim();
    if (trimmed && trimmed !== this.value) {
      this.confirm.emit(trimmed);
    } else {
      this.cancel.emit();
    }
  }
}
