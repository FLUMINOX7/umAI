import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="compact; else full">
      <button class="register-button--compact" type="button" (click)="onRegister()">S'inscrire</button>
    </ng-container>
    <ng-template #full>
      <section class="register-panel">
        <div class="register-panel__title">Nouvel utilisateur</div>
        <button class="register-panel__button" type="button" (click)="onRegister()">
          S'inscrire
        </button>
      </section>
    </ng-template>
  `,
  styles: [
    `
      .register-panel {
        display: grid;
        gap: 0.75rem;
        padding: 1rem;
        border-radius: 1rem;
        background: #fff7ed;
        border: 1px solid #ffe3c7;
      }

      .register-panel__title {
        font-size: 0.82rem;
        font-weight: 700;
        color: #c2410c;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }

      .register-panel__button {
        width: 100%;
        border: none;
        border-radius: 999px;
        padding: 0.9rem 1rem;
        font-weight: 700;
        color: #ffffff;
        background: linear-gradient(135deg, #ff8a3d 0%, #dc2c24 100%);
        cursor: pointer;
        transition: transform 0.2s ease, opacity 0.2s ease;
      }

      .register-panel__button:hover {
        opacity: 0.95;
        transform: translateY(-1px);
      }

      .register-button--compact {
        border: none;
        border-radius: 999px;
        padding: 0.6rem 0.9rem;
        font-weight: 700;
        color: #ffffff;
        background: linear-gradient(135deg, #ff8a3d 0%, #dc2c24 100%);
        cursor: pointer;
      }
      .register-button--compact:hover { opacity: 0.95; transform: translateY(-1px); }
    `
  ]
})
export class RegisterButtonComponent {
  @Input() compact = false;
  @Output() register = new EventEmitter<void>();

  onRegister(): void {
    this.register.emit();
  }
}
