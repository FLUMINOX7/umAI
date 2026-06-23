import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HealthService } from '../../services/health.service';

@Component({
  selector: 'app-health-status',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="health-status"
      [class.online]="isOnline()"
      [class.offline]="isOffline()"
      [class.loading]="isLoading()"
      [disabled]="isLoading()"
      type="button"
      title="Cliquer pour rafraîchir"
      (click)="refresh()"
    >
      <span class="status-dot"></span>
      <span class="status-label">{{ label }}</span>
    </button>
  `,
  styles: [
    `
      .health-status {
        width: 100%;
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        border: 1px solid var(--border);
        border-radius: var(--r-pill);
        padding: 0.55rem 0.95rem;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        background: var(--surface-2);
        color: var(--text-soft);
        transition: background var(--ease), color var(--ease);
      }

      .status-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        flex-shrink: 0;
        background: var(--text-muted);
      }

      .health-status.online  { color: var(--success-fg); }
      .health-status.online  .status-dot {
        background: var(--success-fg);
        box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.15);
      }

      .health-status.offline { color: var(--danger-fg); }
      .health-status.offline .status-dot {
        background: var(--danger-fg);
        box-shadow: 0 0 0 3px rgba(200, 30, 20, 0.15);
      }

      .health-status.loading .status-dot { animation: pulse 1s ease-in-out infinite; }

      .health-status:disabled { cursor: default; }

      @keyframes pulse {
        0%, 100% { opacity: 0.4; }
        50%      { opacity: 1; }
      }
    `
  ]
})
export class HealthStatusComponent implements OnInit {
  status: 'loading' | 'online' | 'offline' = 'loading';
  label = 'Chargement...';

  constructor(
    private healthService: HealthService,
    private cd: ChangeDetectorRef,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit(): void {
    // Pas d'appel HTTP pendant le rendu serveur (prerender) : navigateur uniquement.
    if (isPlatformBrowser(this.platformId)) {
      Promise.resolve().then(() => this.refresh());
    }
  }

  isLoading(): boolean {
    return this.status === 'loading';
  }

  isOnline(): boolean {
    return this.status === 'online';
  }

  isOffline(): boolean {
    return this.status === 'offline';
  }

  refresh(): void {
    this.ngZone.runOutsideAngular(() => {
      this.status = 'loading';
      this.label = 'Vérification...';
      this.cd.detectChanges();

      this.healthService.checkHealth().subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.status = 'online';
            this.label = 'API active';
            this.cd.markForCheck();
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.status = 'offline';
            this.label = 'API indisponible';
            this.cd.markForCheck();
          });
        }
      });
    });
  }
}
