import { Component, EventEmitter, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-backdrop" (click)="onBackdrop($event)">
      <div class="modal">
        <div class="modal-logo">✦</div>
        <h3 class="modal-title">Bon retour&nbsp;!</h3>
        <p class="modal-sub">Connectez-vous pour accéder à vos conversations.</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>Nom d'utilisateur ou Email</span>
            <input formControlName="identifier" autocomplete="username" />
          </label>

          <label class="field">
            <span>Mot de passe</span>
            <input formControlName="password" type="password" autocomplete="current-password" />
          </label>

          <div class="actions">
            <button type="button" class="btn cancel" (click)="close()">Annuler</button>
            <button type="submit" class="btn primary" [disabled]="form.invalid || loading">
              {{ loading ? 'Connexion...' : 'Se connecter' }}
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
        background: rgba(31, 36, 48, 0.35);
        backdrop-filter: blur(3px);
        z-index: 1000;
        padding: 1rem;
        animation: fade 0.2s ease;
      }
      .modal {
        width: 380px;
        max-width: 100%;
        background: var(--surface);
        border-radius: var(--r-lg);
        padding: 1.75rem;
        box-shadow: var(--shadow-lg);
        text-align: center;
        animation: rise 0.25s cubic-bezier(0.4,0,0.2,1);
      }
      .modal-logo {
        width: 52px;
        height: 52px;
        margin: 0 auto 0.85rem;
        display: grid;
        place-items: center;
        border-radius: 14px;
        background: var(--gradient-warm);
        color: #fff;
        font-size: 1.4rem;
        box-shadow: var(--shadow-glow);
      }
      .modal-title { margin: 0 0 0.3rem; font-size: 1.25rem; font-weight: 800; color: var(--text); }
      .modal-sub { margin: 0 0 1.4rem; font-size: 0.88rem; color: var(--text-soft); }
      form { text-align: left; }
      .field { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.85rem; }
      .field span { font-size: 0.82rem; font-weight: 600; color: var(--text-soft); }
      .field input {
        padding: 0.7rem 0.85rem;
        border-radius: var(--r-sm);
        border: 1.5px solid var(--border-strong);
        background: var(--surface-2);
        font: inherit;
        color: var(--text);
        outline: none;
        transition: border-color var(--ease), box-shadow var(--ease), background var(--ease);
      }
      .field input:focus {
        border-color: var(--orange);
        background: var(--surface);
        box-shadow: 0 0 0 3px rgba(255, 138, 61, 0.14);
      }
      .actions { display:flex; gap: 0.6rem; margin-top: 1.25rem; }
      .btn {
        flex: 1;
        border: none;
        padding: 0.75rem 0.9rem;
        border-radius: var(--r-pill);
        cursor: pointer;
        font: inherit;
        font-weight: 700;
        transition: transform var(--ease), box-shadow var(--ease), background var(--ease);
      }
      .btn.primary { background: var(--gradient-warm); color: #fff; box-shadow: var(--shadow-glow); }
      .btn.primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: var(--shadow-lg); }
      .btn.cancel { background: var(--surface-2); color: var(--text-soft); border: 1px solid var(--border-strong); }
      .btn.cancel:hover { background: var(--border); }
      .btn:disabled, .btn[disabled] { opacity: 0.55; cursor: not-allowed; pointer-events: none; box-shadow: none; }
      .error {
        margin-top: 1rem;
        padding: 0.6rem 0.85rem;
        border-radius: var(--r-sm);
        background: var(--danger-bg);
        color: var(--danger-fg);
        font-size: 0.85rem;
        text-align: center;
      }
      @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
      @keyframes rise { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: none; } }
    `
  ]
})
export class LoginModalComponent {
  @Output() closeModal = new EventEmitter<void>();
  @Output() loggedIn = new EventEmitter<any>();

  form: any;

  loading = false;
  error: string | null = null;

  constructor(private fb: FormBuilder, private auth: AuthService, private cd: ChangeDetectorRef) {
    this.form = this.fb.group({
      identifier: ['', [Validators.required, Validators.minLength(2)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  close() {
    this.closeModal.emit();
  }

  onBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close();
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = null;

    const payload = this.form.value;

    this.auth.login(payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        const token = res?.access_token;
        if (token) {
          this.auth.saveToken(token);
        }
        this.cd.markForCheck();
        this.loggedIn.emit(res);
        this.closeModal.emit();
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Login error full:', err);
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
      return 'Erreur inconnue lors de la connexion.';
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
        errorMsg = err.error.error || err.error.message || err.error.msg || null;
      }
    }

    if (errorMsg) {
      console.log('Found errorMsg:', errorMsg);
      // Translate common error messages to French
      const translations: { [key: string]: string } = {
        'invalid credentials': 'Identifiant ou mot de passe incorrect',
        'user not found': 'Cet utilisateur n\'existe pas',
        'invalid username or password': 'Nom d\'utilisateur ou mot de passe incorrect',
        'incorrect password': 'Mot de passe incorrect'
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
    return 'Erreur lors de la connexion.';
  }
}
