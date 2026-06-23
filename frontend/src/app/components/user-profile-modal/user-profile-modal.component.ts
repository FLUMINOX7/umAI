import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserProfileService } from '../../services/user-profile.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-profile-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="backdrop" (click)="onBackdropClick($event)">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="profile-title">

        <div class="modal-header">
          <h3 class="modal-title" id="profile-title">Mon profil</h3>
          <button class="close-btn" type="button" aria-label="Fermer" (click)="close()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSave()" novalidate>

          <!-- Nom d'utilisateur -->
          <div class="field">
            <label class="field-label" for="username">Nom d'utilisateur</label>
            <input
              id="username"
              class="field-input"
              [class.invalid]="isInvalid('username')"
              type="text"
              formControlName="username"
              autocomplete="username"
            />
            <span class="field-error" *ngIf="isInvalid('username')">
              Minimum 2 caractères.
            </span>
          </div>

          <!-- Email -->
          <div class="field">
            <label class="field-label" for="email">Adresse e-mail</label>
            <input
              id="email"
              class="field-input"
              [class.invalid]="isInvalid('email')"
              type="email"
              formControlName="email"
              autocomplete="email"
            />
            <span class="field-error" *ngIf="isInvalid('email')">
              Adresse e-mail invalide.
            </span>
          </div>

          <!-- Mot de passe -->
          <div class="field">
            <label class="field-label" for="password">
              Nouveau mot de passe
              <span class="field-hint">(laisser vide pour ne pas changer)</span>
            </label>
            <input
              id="password"
              class="field-input"
              [class.invalid]="isInvalid('password')"
              type="password"
              formControlName="password"
              autocomplete="new-password"
            />
            <span class="field-error" *ngIf="isInvalid('password')">
              Minimum 6 caractères.
            </span>
          </div>

          <!-- Feedback global -->
          <div class="feedback success" *ngIf="successMsg">{{ successMsg }}</div>
          <div class="feedback error"   *ngIf="errorMsg">{{ errorMsg }}</div>

          <!-- Actions -->
          <div class="actions">
            <button
              type="button"
              class="btn btn-danger"
              [disabled]="deleting"
              (click)="onDelete()"
            >
              {{ deleting ? 'Suppression…' : 'Supprimer le compte' }}
            </button>

            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="form.invalid || saving"
            >
              {{ saving ? 'Enregistrement…' : 'Modifier' }}
            </button>
          </div>

        </form>

        <!-- Confirmation suppression -->
        <div class="confirm-overlay" *ngIf="showDeleteConfirm">
          <div class="confirm-box">
            <p class="confirm-text">
              Cette action est <strong>irréversible</strong>.<br>
              Votre compte et toutes vos données seront définitivement supprimés.
            </p>
            <div class="confirm-actions">
              <button class="btn btn-ghost" (click)="showDeleteConfirm = false">Annuler</button>
              <button class="btn btn-danger" [disabled]="deleting" (click)="confirmDelete()">
                {{ deleting ? 'Suppression…' : 'Oui, supprimer' }}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ── Backdrop ── */
    .backdrop {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.28);
      z-index: 1100;
      backdrop-filter: blur(2px);
    }

    /* ── Modal container ── */
    .modal {
      position: relative;
      width: 400px;
      max-width: calc(100vw - 2rem);
      background: #ffffff;
      border-radius: 14px;
      padding: 1.5rem;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.14);
      overflow: hidden;
    }

    /* ── Header ── */
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }

    .modal-title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: #111827;
    }

    .close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 50%;
      background: #f3f4f6;
      color: #6b7280;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }

    .close-btn:hover {
      background: #e5e7eb;
      color: #111827;
    }

    /* ── Fields ── */
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      margin-bottom: 1rem;
    }

    .field-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #374151;
    }

    .field-hint {
      font-weight: 400;
      color: #9ca3af;
      font-size: 0.8rem;
      margin-left: 0.35rem;
    }

    .field-input {
      padding: 0.65rem 0.85rem;
      border: 1.5px solid #e6e6e6;
      border-radius: 8px;
      font-size: 0.95rem;
      color: #111827;
      background: #fafafa;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      outline: none;
    }

    .field-input:focus {
      border-color: var(--orange);
      box-shadow: 0 0 0 3px rgba(255, 138, 61, 0.14);
      background: #fff;
    }

    .field-input.invalid {
      border-color: var(--red);
      box-shadow: 0 0 0 3px rgba(229, 57, 47, 0.10);
    }

    .field-error {
      font-size: 0.8rem;
      color: var(--red);
    }

    /* ── Feedback ── */
    .feedback {
      padding: 0.6rem 0.85rem;
      border-radius: 8px;
      font-size: 0.88rem;
      margin-bottom: 0.85rem;
    }

    .feedback.success {
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    .feedback.error {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }

    /* ── Actions ── */
    .actions {
      display: flex;
      gap: 0.65rem;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.25rem;
    }

    .btn {
      border: none;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.9rem;
      padding: 0.65rem 1.1rem;
      cursor: pointer;
      transition: opacity 0.2s ease;
    }

    .btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      pointer-events: none;
    }

    .btn-primary {
      background: var(--gradient-warm);
      color: #fff;
      box-shadow: var(--shadow-glow);
    }

    .btn-primary:hover { transform: translateY(-1px); }

    .btn-danger {
      background: var(--danger-bg);
      color: var(--red);
      border: 1.5px solid #fca5a5;
    }

    .btn-danger:hover { background: #fee2e2; }

    .btn-ghost {
      background: transparent;
      color: #6b7280;
    }

    .btn-ghost:hover { background: #f3f4f6; }

    /* ── Delete confirmation overlay (inside modal) ── */
    .confirm-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(3px);
      border-radius: 14px;
      z-index: 10;
    }

    .confirm-box {
      padding: 1.5rem;
      text-align: center;
      max-width: 300px;
    }

    .confirm-text {
      font-size: 0.95rem;
      color: #374151;
      line-height: 1.55;
      margin: 0 0 1.25rem 0;
    }

    .confirm-actions {
      display: flex;
      gap: 0.65rem;
      justify-content: center;
    }
  `],
})
export class UserProfileModalComponent implements OnInit {
  /** Données initiales de l'utilisateur connecté */
  @Input() user!: { username: string; email: string | null };

  @Output() closeModal  = new EventEmitter<void>();
  /** Émis après modification réussie avec le user mis à jour */
  @Output() userUpdated = new EventEmitter<any>();
  /** Émis après suppression du compte */
  @Output() accountDeleted = new EventEmitter<void>();

  form: any;
  saving  = false;
  deleting = false;
  successMsg: string | null = null;
  errorMsg:   string | null = null;
  showDeleteConfirm = false;

  constructor(
    private fb: FormBuilder,
    private profileService: UserProfileService,
    private authService: AuthService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      username: [this.user?.username ?? '', [Validators.required, Validators.minLength(2)]],
      email:    [this.user?.email    ?? '', [Validators.email]],
      password: ['', [Validators.minLength(6)]],
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  close() {
    this.closeModal.emit();
  }

  /** Ferme la modale si l'on clique sur le backdrop (hors du .modal) */
  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('backdrop')) {
      this.close();
    }
  }

  onSave() {
    if (this.form.invalid || this.saving) return;

    this.saving = true;
    this.successMsg = null;
    this.errorMsg   = null;

    const { username, email, password } = this.form.value;

    this.profileService.updateMe({ username, email, password: password || undefined }).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.successMsg = 'Profil mis à jour avec succès.';
        // Vider le champ mot de passe après succès
        this.form.get('password')?.reset('');
        this.userUpdated.emit(res.user ?? { username, email });
        this.cd.markForCheck();
      },
      error: (err: any) => {
        this.saving = false;
        this.errorMsg = err?.error?.error ?? err?.message ?? 'Erreur lors de la mise à jour.';
        this.cd.markForCheck();
      },
    });
  }

  onDelete() {
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    this.deleting = true;
    this.errorMsg = null;

    this.profileService.deleteMe().subscribe({
      next: () => {
        this.deleting = false;
        this.authService.clearToken();
        this.accountDeleted.emit();
        this.close();
      },
      error: (err: any) => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.errorMsg = err?.error?.error ?? err?.message ?? 'Erreur lors de la suppression.';
        this.cd.markForCheck();
      },
    });
  }
}
