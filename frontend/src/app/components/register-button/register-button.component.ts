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
        border-radius: var(--r-md);
        background: var(--gradient-warm-soft);
        border: 1px solid var(--border-strong);
      }

      .register-panel__title {
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--orange-deep);
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }

      .register-panel__button {
        width: 100%;
        border: none;
        border-radius: var(--r-pill);
        padding: 0.9rem 1rem;
        font-weight: 700;
        color: #ffffff;
        background: var(--gradient-warm);
        cursor: pointer;
        box-shadow: var(--shadow-glow);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .register-panel__button:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-lg);
      }

      .register-button--compact {
        width: 100%;
        border: none;
        border-radius: var(--r-pill);
        padding: 0.55rem 0.9rem;
        font-size: 0.83rem;
        font-weight: 700;
        color: #ffffff;
        background: var(--gradient-warm);
        cursor: pointer;
        box-shadow: var(--shadow-sm);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .register-button--compact:hover { transform: translateY(-1px); box-shadow: var(--shadow-glow); }
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
