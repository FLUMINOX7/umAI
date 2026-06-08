import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HealthService } from '../../services/health.service';

@Component({
  selector: 'app-health-status',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="health-status">
      <div class="health-status__title">API status</div>
      <button
        class="health-status__badge"
        [class.online]="isOnline()"
        [class.offline]="isOffline()"
        [disabled]="isLoading()"
        type="button"
        (click)="refresh()"
      >
        {{ label }}
      </button>
    </section>
  `,
  styles: [
    `
      .health-status {
        display: grid;
        gap: 0.5rem;
        padding: 1rem;
        border-radius: 1rem;
        background: #f9f5f2;
        border: 1px solid #f3e3da;
      }

      .health-status__title {
        font-size: 0.85rem;
        font-weight: 700;
        color: #374151;
        text-transform: uppercase;
        letter-spacing: 0.14em;
      }

      .health-status__badge {
        width: 100%;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        border: none;
        border-radius: 999px;
        padding: 0.85rem 1rem;
        font-weight: 700;
        cursor: pointer;
        transition: background-color 0.2s ease, color 0.2s ease;
        background: #f3f4f6;
        color: #111827;
      }

      .health-status__badge.online {
        background: #dcfce7;
        color: #166534;
      }

      .health-status__badge.offline {
        background: #fee2e2;
        color: #991b1b;
      }

      .health-status__badge:disabled {
        cursor: default;
        opacity: 0.8;
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
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    Promise.resolve().then(() => this.refresh());
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
