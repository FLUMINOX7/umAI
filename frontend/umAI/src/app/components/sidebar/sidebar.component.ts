import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ConversationCardComponent } from './conversation-card.component';
import { HealthStatusComponent } from '../health-status/health-status.component';
import { RegisterButtonComponent } from '../register-button/register-button.component';
import { RegisterModalComponent } from '../register-modal/register-modal.component';
import { LoginModalComponent } from '../login-modal/login-modal.component';
import { UserProfileModalComponent } from '../user-profile-modal/user-profile-modal.component';
import { AuthService } from '../../services/auth.service';
import {
  ConversationService,
  ApiConversation,
} from '../../services/conversation.service';
import { Conversation } from '../../interfaces/chat.interface';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ConversationCardComponent,
    HealthStatusComponent,
    RegisterButtonComponent,
    RegisterModalComponent,
    LoginModalComponent,
    UserProfileModalComponent,
  ],
  template: `
    <aside class="sidebar">
      <!-- ── En-tête ── -->
      <div class="sidebar-header">
        <div>
          <div class="brand">umAI</div>
          <div class="brand-subtitle">Chat IA</div>
        </div>

        <div class="header-actions">
          <ng-container *ngIf="!currentUser; else userProfile">
            <app-register-button
              [compact]="true"
              (register)="onRegister()"
            ></app-register-button>
            <button class="login-button" type="button" (click)="onToggleLogin()">
              Connexion
            </button>
          </ng-container>

          <ng-template #userProfile>
            <div class="user-profile">
              <button
                class="username-btn"
                type="button"
                (click)="onOpenProfile()"
                title="Modifier mon profil"
              >
                {{ currentUser.username }}
                <svg class="edit-icon" xmlns="http://www.w3.org/2000/svg"
                     width="12" height="12" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2.5"
                     stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="logout-button" type="button" (click)="logout()">
                Déconnecter
              </button>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- ── Santé API ── -->
      <app-health-status></app-health-status>

      <!-- ── Modales ── -->
      <app-register-modal
        *ngIf="showRegisterModal"
        (closeModal)="showRegisterModal = false"
        (registered)="onRegistered($event)"
      ></app-register-modal>

      <app-login-modal
        *ngIf="showLoginModal"
        (closeModal)="showLoginModal = false"
        (loggedIn)="onLoggedIn($event)"
      ></app-login-modal>

      <app-user-profile-modal
        *ngIf="showProfileModal && currentUser"
        [user]="currentUser"
        (closeModal)="showProfileModal = false"
        (userUpdated)="onUserUpdated($event)"
        (accountDeleted)="onAccountDeleted()"
      ></app-user-profile-modal>

      <!-- ── Liste des conversations ── -->
      <div class="sidebar-title">Conversations enregistrées</div>

      <!-- Chargement -->
      <div *ngIf="loadingConversations" class="conversations-loading">
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
      </div>

      <!-- Erreur -->
      <div *ngIf="conversationsError && !loadingConversations" class="conversations-error">
        <span>⚠ Impossible de charger les conversations</span>
        <button class="retry-btn" type="button" (click)="loadConversations()">
          Réessayer
        </button>
      </div>

      <!-- Non connecté -->
      <div *ngIf="!currentUser && !loadingConversations" class="conversations-empty">
        <span>Connectez-vous pour retrouver vos conversations.</span>
      </div>

      <!-- Liste -->
      <div
        *ngIf="currentUser && !loadingConversations && !conversationsError"
        class="conversation-list"
      >
        <app-conversation-card
          *ngFor="let conv of conversations; let i = index"
          [conversation]="conv"
          [index]="i"
          [currentIndex]="currentIndex"
          (select)="onSelectConversation($event)"
          (delete)="onDeleteConversation($event)"
          (rename)="onRenameConversation($event)"
        ></app-conversation-card>
      </div>

      <!-- Bouton nouvelle conversation -->
      <button
        *ngIf="currentUser"
        class="new-conversation"
        type="button"
        (click)="onCreateConversation()"
        [disabled]="loadingConversations"
      >
        + Nouvelle conversation
      </button>
    </aside>
  `,
  styles: [`
    .sidebar {
      background: #ffffff;
      border: 1px solid #ece9e6;
      border-radius: 1.5rem;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-self: flex-start;
      box-shadow: 0 18px 50px rgba(0, 0, 0, 0.05);
    }

    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .brand {
      font-size: 1.35rem;
      font-weight: 800;
      color: #dc2c24;
    }

    .brand-subtitle {
      color: #6b7280;
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }

    .login-button,
    .new-conversation {
      border: none;
      border-radius: 999px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.2s ease;
      padding: 0.6rem 0.9rem;
      background: linear-gradient(135deg, #ff8a3d 0%, #dc2c24 100%);
      color: #fff;
    }

    .login-button:hover,
    .new-conversation:hover { opacity: 0.92; }

    .new-conversation:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .sidebar-title {
      text-transform: uppercase;
      font-size: 0.8rem;
      letter-spacing: 0.16em;
      color: #9ca3af;
    }

    .conversation-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      padding-right: 0.25rem;
      overflow: visible;
    }

    /* ── Chargement ── */
    .conversations-loading {
      display: flex;
      gap: 0.4rem;
      justify-content: center;
      padding: 1rem 0;
    }

    .loading-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ff8a3d, #dc2c24);
      animation: bounce 1.2s infinite ease-in-out;
    }

    .loading-dot:nth-child(2) { animation-delay: 0.2s; }
    .loading-dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
      40%            { transform: scale(1);   opacity: 1; }
    }

    /* ── Erreur ── */
    .conversations-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: rgba(220, 44, 36, 0.05);
      border: 1px solid rgba(220, 44, 36, 0.15);
      border-radius: 0.75rem;
      font-size: 0.82rem;
      color: #dc2c24;
      text-align: center;
    }

    .retry-btn {
      border: 1px solid #dc2c24;
      background: transparent;
      color: #dc2c24;
      border-radius: 999px;
      padding: 0.3rem 0.8rem;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }

    .retry-btn:hover {
      background: #dc2c24;
      color: #fff;
    }

    /* ── Vide ── */
    .conversations-empty {
      font-size: 0.82rem;
      color: #9ca3af;
      text-align: center;
      padding: 0.5rem 0.25rem;
      line-height: 1.5;
    }

    .new-conversation { margin-top: 0; padding: 0.95rem 1rem; }

    /* ── Profil utilisateur ── */
    .user-profile {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      align-items: flex-end;
    }

    .username-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: none;
      border: none;
      padding: 0.2rem 0.4rem;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 600;
      color: #111827;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }

    .username-btn:hover { background: #fff3ef; color: #dc2c24; }

    .edit-icon { opacity: 0.5; flex-shrink: 0; }
    .username-btn:hover .edit-icon { opacity: 1; }

    .logout-button {
      border: none;
      border-radius: 999px;
      font-weight: 700;
      cursor: pointer;
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
      background: #f3f4f6;
      color: #6b7280;
      transition: opacity 0.2s ease;
    }

    .logout-button:hover { opacity: 0.8; }
  `],
})
export class SidebarComponent implements OnInit {
  @Input() currentIndex = 0;

  conversations: Conversation[]    = [];
  apiConversations: ApiConversation[] = [];

  showRegisterModal    = false;
  showLoginModal       = false;
  showProfileModal     = false;
  currentUser: any     = null;
  loadingUser          = false;
  loadingConversations = false;
  conversationsError   = false;

  @Output() toggleLogin         = new EventEmitter<void>();
  @Output() register            = new EventEmitter<void>();
  @Output() selectConversation  = new EventEmitter<number>();
  @Output() createConversation  = new EventEmitter<void>();
  @Output() deleteConversation  = new EventEmitter<number>();
  @Output() userChanged         = new EventEmitter<any>();
  @Output() conversationsLoaded = new EventEmitter<ApiConversation[]>();

  constructor(
    private auth: AuthService,
    private conversationSvc: ConversationService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUser();
    }
  }

  // ── Utilisateur ───────────────────────────────────────────────────────────

  private loadUser() {
    if (!this.auth.isAuthenticated()) return;

    this.loadingUser = true;
    this.auth.getMe().subscribe({
      next: (response: any) => {
        this.loadingUser = false;
        this.currentUser = response.user;
        this.cd.markForCheck();
        this.loadConversations();
      },
      error: (err) => {
        this.loadingUser = false;
        console.error('Failed to load user', err);
        this.auth.clearToken();
        this.currentUser = null;
        this.cd.markForCheck();
      },
    });
  }

  // ── Conversations ─────────────────────────────────────────────────────────

  loadConversations() {
    if (!this.currentUser) return;

    this.loadingConversations = true;
    this.conversationsError   = false;
    this.cd.markForCheck();

    this.conversationSvc.loadOrCreate().subscribe({
      next: (list) => {
        this.apiConversations     = list;
        this.conversations        = this.toInternal(list);
        this.loadingConversations = false;
        this.conversationsLoaded.emit(list);
        this.cd.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load conversations', err);
        this.loadingConversations = false;
        this.conversationsError   = true;
        this.cd.markForCheck();
      },
    });
  }

  private toInternal(list: ApiConversation[]): Conversation[] {
    return list.map((c) => ({
      id:       c.id,
      title:    c.title ?? 'Sans titre',
      preview:  c.updated_at
        ? new Date(c.updated_at).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'short', year: 'numeric',
          })
        : '',
      updated:  c.updated_at ?? c.created_at,
      messages: [],
      createdAt: c.created_at ? new Date(c.created_at) : undefined,
    }));
  }

  // ── Profil ────────────────────────────────────────────────────────────────

  onOpenProfile() { this.showProfileModal = true; }

  onUserUpdated(updatedUser: any) {
    this.currentUser      = { ...this.currentUser, ...updatedUser };
    this.showProfileModal  = false;
    this.userChanged.emit(this.currentUser);
    this.cd.markForCheck();
  }

  onAccountDeleted() {
    this.currentUser      = null;
    this.conversations    = [];
    this.apiConversations = [];
    this.showProfileModal  = false;
    this.userChanged.emit(null);
    this.cd.markForCheck();
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  logout() {
    this.auth.clearToken();
    this.currentUser      = null;
    this.conversations    = [];
    this.apiConversations = [];
    this.userChanged.emit(null);
    this.cd.markForCheck();
  }

  onToggleLogin() {
    this.showLoginModal = !this.showLoginModal;
    this.toggleLogin.emit();
  }

  onLoggedIn(res: any) {
    this.showLoginModal = false;
    this.loadUser();
    this.userChanged.emit(res);
  }

  onRegister() {
    this.showRegisterModal = true;
    this.register.emit();
  }

  onRegistered(_event: any) {
    this.showRegisterModal = false;
    this.loadUser();
  }

  // ── Actions conversations ─────────────────────────────────────────────────

  onSelectConversation(index: number) { this.selectConversation.emit(index); }

  onCreateConversation() {
    if (!this.currentUser) return;

    this.conversationSvc.createConversation({ title: 'Nouvelle conversation' }).subscribe({
      next: (created) => {
        this.apiConversations = [created, ...this.apiConversations];
        this.conversations    = this.toInternal(this.apiConversations);
        this.selectConversation.emit(0);
        this.conversationsLoaded.emit(this.apiConversations);
        this.cd.markForCheck();
      },
      error: (err) => console.error('Failed to create conversation', err),
    });

    this.createConversation.emit();
  }

  onDeleteConversation(index: number) {
    const target = this.apiConversations[index];
    if (!target) return;

    this.conversationSvc.deleteConversation(target.id).subscribe({
      next: () => {
        this.apiConversations = this.apiConversations.filter((_, i) => i !== index);
        this.conversations    = this.toInternal(this.apiConversations);

        if (this.apiConversations.length === 0) {
          this.loadConversations();
        } else {
          this.conversationsLoaded.emit(this.apiConversations);
        }

        this.cd.markForCheck();
      },
      error: (err) => console.error('Failed to delete conversation', err),
    });

    this.deleteConversation.emit(index);
  }

  /** Renomme une conversation via PATCH /conversations/:id */
  onRenameConversation(event: { index: number; newTitle: string }) {
    const target = this.apiConversations[event.index];
    if (!target) return;

    this.conversationSvc.updateConversation(target.id, { title: event.newTitle }).subscribe({
      next: (updated) => {
        // Mise à jour locale immédiate sans rechargement complet
        this.apiConversations = this.apiConversations.map((c, i) =>
          i === event.index ? { ...c, title: updated.title ?? event.newTitle } : c
        );
        this.conversations = this.toInternal(this.apiConversations);
        this.conversationsLoaded.emit(this.apiConversations);
        this.cd.markForCheck();
      },
      error: (err) => console.error('Failed to rename conversation', err),
    });
  }
}
