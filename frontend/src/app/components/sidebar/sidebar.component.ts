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
        <div class="brand">
          <div class="brand-mark" aria-hidden="true">✦</div>
          <div>
            <div class="brand-name">umAI</div>
            <div class="brand-subtitle">Assistant IA</div>
          </div>
        </div>

        <button
          *ngIf="currentUser"
          class="username-btn"
          type="button"
          (click)="onOpenProfile()"
          title="Modifier mon profil"
        >
          <span class="user-avatar">{{ userInitial }}</span>
          <span class="username-text">{{ currentUser.username }}</span>
          <svg class="edit-icon" xmlns="http://www.w3.org/2000/svg"
               width="12" height="12" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>

      <!-- ── Authentification (non connecté) ── -->
      <div class="auth-actions" *ngIf="!currentUser">
        <app-register-button
          [compact]="true"
          (register)="onRegister()"
        ></app-register-button>
        <button class="login-button" type="button" (click)="onToggleLogin()">
          Connexion
        </button>
      </div>

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

      <!-- Bouton nouvelle conversation -->
      <button
        *ngIf="currentUser"
        class="new-conversation"
        type="button"
        (click)="onCreateConversation()"
        [disabled]="loadingConversations"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14"/><path d="M5 12h14"/>
        </svg>
        Nouvelle conversation
      </button>

      <!-- ── Liste des conversations ── -->
      <div class="sidebar-title">Conversations</div>

      <div class="conversation-scroll">
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
      </div>

      <!-- ── Pied : santé API + déconnexion ── -->
      <div class="sidebar-footer">
        <app-health-status></app-health-status>
        <button
          *ngIf="currentUser"
          class="logout-button"
          type="button"
          (click)="logout()"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2.2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>
          </svg>
          Déconnexion
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      height: 100%;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r-xl);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      box-shadow: var(--shadow-lg);
      min-height: 0;
    }

    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      min-width: 0;
    }

    .brand-mark {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      display: grid;
      place-items: center;
      border-radius: 12px;
      background: var(--gradient-warm);
      color: #fff;
      font-size: 1.15rem;
      box-shadow: var(--shadow-glow);
    }

    .brand-name {
      font-size: 1.3rem;
      font-weight: 800;
      letter-spacing: -0.01em;
      background: var(--gradient-warm);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      line-height: 1.1;
    }

    .brand-subtitle {
      color: var(--text-muted);
      font-size: 0.78rem;
    }

    .auth-actions {
      display: flex;
      gap: 0.5rem;
    }

    .auth-actions app-register-button,
    .auth-actions .login-button {
      flex: 1 1 0;
      min-width: 0;
    }

    .login-button, .logout-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      border: 1px solid var(--border-strong);
      border-radius: var(--r-pill);
      font-weight: 600;
      font-size: 0.83rem;
      cursor: pointer;
      padding: 0.5rem 0.85rem;
      background: var(--surface);
      color: var(--text-soft);
      transition: color var(--ease), border-color var(--ease), background var(--ease);
    }

    .login-button:hover, .logout-button:hover {
      color: var(--red); border-color: var(--red); background: var(--danger-bg);
    }

    .new-conversation {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      border: none;
      border-radius: var(--r-md);
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      transition: transform var(--ease), box-shadow var(--ease), opacity var(--ease);
      padding: 0.85rem 1rem;
      background: var(--gradient-warm);
      color: #fff;
      box-shadow: var(--shadow-glow);
    }

    .new-conversation:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
    .new-conversation:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

    .sidebar-title {
      text-transform: uppercase;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      color: var(--text-muted);
    }

    /* ── Zone défilante ── */
    .conversation-scroll {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      margin: 0 -0.35rem;
      padding: 0 0.35rem;
    }

    .conversation-list {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    /* ── Chargement ── */
    .conversations-loading {
      display: flex;
      gap: 0.4rem;
      justify-content: center;
      padding: 1.5rem 0;
    }

    .loading-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--gradient-warm);
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
      background: var(--danger-bg);
      border: 1px solid rgba(229, 57, 47, 0.15);
      border-radius: var(--r-sm);
      font-size: 0.82rem;
      color: var(--red);
      text-align: center;
    }

    .retry-btn {
      border: 1px solid var(--red);
      background: transparent;
      color: var(--red);
      border-radius: var(--r-pill);
      padding: 0.3rem 0.8rem;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }

    .retry-btn:hover { background: var(--red); color: #fff; }

    /* ── Vide ── */
    .conversations-empty {
      font-size: 0.85rem;
      color: var(--text-muted);
      text-align: center;
      padding: 2rem 0.5rem;
      line-height: 1.6;
    }

    /* ── Profil utilisateur ── */
    .username-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      background: var(--surface-2);
      border: 1px solid var(--border);
      padding: 0.3rem 0.6rem 0.3rem 0.3rem;
      border-radius: var(--r-pill);
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text);
      cursor: pointer;
      max-width: 150px;
      transition: border-color var(--ease), background var(--ease);
    }

    .username-btn:hover { border-color: var(--orange); background: #fff; }

    .user-avatar {
      width: 26px;
      height: 26px;
      flex-shrink: 0;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: var(--gradient-warm);
      color: #fff;
      font-size: 0.78rem;
      font-weight: 700;
    }

    .username-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .edit-icon { opacity: 0.45; flex-shrink: 0; }
    .username-btn:hover .edit-icon { opacity: 1; color: var(--red); }

    /* ── Pied ── */
    .sidebar-footer {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      border-top: 1px solid var(--border);
      padding-top: 0.9rem;
    }

  `],
})
export class SidebarComponent implements OnInit {
  @Input() currentIndex = 0;

  conversations: Conversation[]    = [];
  apiConversations: ApiConversation[] = [];

  get userInitial(): string {
    return this.currentUser?.username?.charAt(0)?.toUpperCase() ?? '?';
  }

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
