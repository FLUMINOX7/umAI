import {
  Component, Input, Output, EventEmitter, OnInit,
  Inject, PLATFORM_ID, ChangeDetectorRef,
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
import { Conversation } from '../../interfaces/chat.interface';

@Component({
  selector: 'app-sidebar',
  standalone: true,
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
      <div class="sidebar-header">
        <div>
          <div class="brand">umAI</div>
          <div class="brand-subtitle">Chat IA</div>
        </div>
        <div class="header-actions">
          <ng-container *ngIf="!currentUser; else userProfile">
            <app-register-button [compact]="true" (register)="onRegister()"></app-register-button>
            <button class="login-button" type="button" (click)="onToggleLogin()">
              Connexion
            </button>
          </ng-container>

          <ng-template #userProfile>
            <div class="user-profile">
              <!-- Nom cliquable → ouvre la modale profil -->
              <button class="username-btn" type="button" (click)="onOpenProfile()"
                      title="Modifier mon profil">
                {{ currentUser.username }}
                <svg class="edit-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12"
                     viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="logout-button" type="button" (click)="logout()">Déconnecter</button>
            </div>
          </ng-template>
        </div>
      </div>

      <app-health-status></app-health-status>

      <!-- Modale d'inscription -->
      <app-register-modal
        *ngIf="showRegisterModal"
        (closeModal)="showRegisterModal = false"
        (registered)="onRegistered($event)"
      ></app-register-modal>

      <!-- Modale de connexion -->
      <app-login-modal
        *ngIf="showLoginModal"
        (closeModal)="showLoginModal = false"
        (loggedIn)="onLoggedIn($event)"
      ></app-login-modal>

      <!-- Modale de profil -->
      <app-user-profile-modal
        *ngIf="showProfileModal && currentUser"
        [user]="currentUser"
        (closeModal)="showProfileModal = false"
        (userUpdated)="onUserUpdated($event)"
        (accountDeleted)="onAccountDeleted()"
      ></app-user-profile-modal>

      <div class="sidebar-title">Conversations enregistrées</div>
      <div class="conversation-list">
        <app-conversation-card
          *ngFor="let conversation of conversations; let i = index"
          [conversation]="conversation"
          [index]="i"
          [currentIndex]="currentIndex"
          (select)="onSelectConversation($event)"
          (delete)="onDeleteConversation($event)"
        ></app-conversation-card>
      </div>

      <button class="new-conversation" type="button" (click)="onCreateConversation()">
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

    .new-conversation {
      margin-top: 0;
      padding: 0.95rem 1rem;
    }

    /* ── Zone utilisateur ── */
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

    .username-btn:hover {
      background: #fff3ef;
      color: #dc2c24;
    }

    .edit-icon {
      opacity: 0.5;
      flex-shrink: 0;
    }

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
  @Input() conversations: Conversation[] = [];
  @Input() currentIndex  = 0;
  @Input() isLoggedIn    = false;

  showRegisterModal = false;
  showLoginModal    = false;
  showProfileModal  = false;

  currentUser: any = null;
  loadingUser = false;

  @Output() toggleLogin        = new EventEmitter<void>();
  @Output() register           = new EventEmitter<void>();
  @Output() selectConversation = new EventEmitter<number>();
  @Output() createConversation = new EventEmitter<void>();
  @Output() deleteConversation = new EventEmitter<number>();
  @Output() userChanged        = new EventEmitter<any>();

  constructor(
    private auth: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUser();
    }
  }

  private loadUser() {
    if (this.auth.isAuthenticated()) {
      this.loadingUser = true;
      this.auth.getMe().subscribe({
        next: (response: any) => {
          this.loadingUser = false;
          this.currentUser = response.user;
          this.cd.markForCheck();
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
  }

  /* ── Profil ── */

  onOpenProfile() {
    this.showProfileModal = true;
  }

  onUserUpdated(updatedUser: any) {
    this.currentUser = { ...this.currentUser, ...updatedUser };
    this.showProfileModal = false;
    this.userChanged.emit(this.currentUser);
    this.cd.markForCheck();
  }

  onAccountDeleted() {
    this.currentUser = null;
    this.showProfileModal = false;
    this.userChanged.emit(null);
    this.cd.markForCheck();
  }

  /* ── Auth ── */

  logout() {
    this.auth.clearToken();
    this.currentUser = null;
    this.userChanged.emit(null);
    this.cd.markForCheck();
  }

  onToggleLogin() {
    this.showLoginModal = !this.showLoginModal;
    this.toggleLogin.emit();
  }

  onLoggedIn(res: any) {
    this.loadUser();
    this.userChanged.emit(res);
  }

  onRegister() {
    this.showRegisterModal = true;
    this.register.emit();
  }

  onRegistered(event: any) {
    console.log('User registered', event);
    this.loadUser();
  }

  /* ── Conversations ── */

  onSelectConversation(index: number) { this.selectConversation.emit(index); }
  onCreateConversation()              { this.createConversation.emit(); }
  onDeleteConversation(index: number) { this.deleteConversation.emit(index); }
}
