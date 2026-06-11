import { Component, EventEmitter, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-backdrop">
      <div class="modal">
        <h3 class="modal-title">Créer un compte</h3>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Nom d'utilisateur</span>
            <input formControlName="username" autocomplete="username" />
          </label>

          <label class="field">
            <span>Email</span>
            <input formControlName="email" type="email" autocomplete="email" />
          </label>

          <label class="field">
            <span>Mot de passe</span>
            <input formControlName="password" type="password" autocomplete="new-password" />
          </label>

          <div class="actions">
            <button type="button" class="btn cancel" (click)="close()">Annuler</button>
            <button type="submit" class="btn primary" [disabled]="form.invalid || loading">
              {{ loading ? 'Envoi...' : "S'inscrire" }}
            </button>
          </div>
        </form>

        <div *ngIf="error" class="error">{{ error }}</div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-backdrop {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0,0,0,0.3);
        z-index: 1000;
      }
      .modal {
        width: 360px;
        background: #ffffff;
        border-radius: 12px;
        padding: 1.25rem;
        box-shadow: 0 8px 30px rgba(0,0,0,0.12);
      }
      .modal-title { margin: 0 0 0.75rem 0; font-size: 1.05rem; color: #111827; }
      .field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; }
      .field input { padding: 0.6rem 0.75rem; border-radius: 8px; border: 1px solid #e6e6e6; }
      .actions { display:flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.5rem; }
      .btn { border: none; padding: 0.6rem 0.9rem; border-radius: 999px; cursor: pointer; }
      .btn.primary { background: linear-gradient(135deg,#ff8a3d 0%,#dc2c24 100%); color: white; font-weight:700; }
      .btn.cancel { background: transparent; color: #6b7280; }
      /* visually indicate disabled state */
      .btn:disabled,
      .btn[disabled] {
        opacity: 0.6;
        cursor: not-allowed;
        pointer-events: none;
      }
      .error { margin-top:0.75rem; color:#b91c1c; font-size:0.9rem; }
    `
  ]
})
export class RegisterModalComponent {
  @Output() closeModal = new EventEmitter<void>();
  @Output() registered = new EventEmitter<any>();

  form: any;

  loading = false;
  error: string | null = null;

  constructor(private fb: FormBuilder, private auth: AuthService, private cd: ChangeDetectorRef) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  close() {
    this.closeModal.emit();
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = null;

    const payload = this.form.value;

    this.auth.register(payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        const token = res?.access_token;
        if (token) {
          this.auth.saveToken(token);
        }
        this.cd.markForCheck();
        this.registered.emit(res);
        this.closeModal.emit();
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Registration error full:', err);
        console.error('Error status:', err?.status);
        console.error('Error error:', err?.error);
        const parsedError = this.parseError(err);
        console.error('Parsed error:', parsedError);
        this.error = parsedError;
        this.cd.markForCheck();
      }
    });
  }

  private parseError(err: any): string {
    if (!err) {
      return "Erreur inconnue lors de l'inscription.";
    }

    console.log('parseError input:', err);

    // Extract error message from various response formats
    let errorMsg: string | null = null;

    // Try to get from err.error (the response body)
    if (err.error) {
      console.log('err.error is:', err.error, 'type:', typeof err.error);
      
      if (typeof err.error === 'string' && err.error.trim()) {
        errorMsg = err.error;
      } else if (typeof err.error === 'object') {
        // Try to find the error message in nested properties
        errorMsg = err.error.error || err.error.message || null;
      }
    }

    if (errorMsg) {
      console.log('Found errorMsg:', errorMsg);
      // Translate common error messages to French
      const translations: { [key: string]: string } = {
        'username already exists': 'Ce nom d\'utilisateur est déjà pris',
        'email already exists': 'Cet email est déjà enregistré',
        'invalid email': 'Email invalide',
        'password too short': 'Le mot de passe est trop court'
      };
      const translated = translations[errorMsg.toLowerCase()] || errorMsg;
      console.log('Translated to:', translated);
      return translated;
    }

    if (err.message) {
      console.log('Using err.message:', err.message);
      return err.message;
    }

    if (err.status || err.statusText) {
      console.log('Using status text:', err.status, err.statusText);
      return `Erreur ${err.status || ''} ${err.statusText || ''}`.trim();
    }

    console.log('Returning generic error');
    return "Erreur lors de l'inscription.";
  }
}
