import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-composer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form class="composer" (ngSubmit)="onSubmit()">
      <div class="input-shell" [class.focused]="focused" [class.recording]="recording">
        <textarea
          [(ngModel)]="message"
          name="prompt"
          rows="1"
          [placeholder]="recording ? 'Enregistrement en cours…' : 'Écrivez votre message…'"
          [disabled]="recording"
          (focus)="focused = true"
          (blur)="focused = false"
          (input)="autoGrow($event)"
          (keydown.enter)="onEnter($event)"
        ></textarea>

        <div class="actions-col">
          <button
            class="send-button"
            type="submit"
            [disabled]="!message.trim() || sending || recording"
            aria-label="Envoyer"
          >
            <svg *ngIf="!sending" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 19V5"/><path d="M5 12l7-7 7 7"/>
            </svg>
            <span *ngIf="sending" class="spinner" aria-hidden="true"></span>
          </button>

          <button
            class="mic-button"
            type="button"
            [class.active]="recording"
            [disabled]="sending"
            (click)="toggleRecording()"
            [attr.aria-label]="recording ? 'Arrêter et envoyer' : 'Enregistrer un message vocal'"
            [title]="recording ? 'Arrêter et envoyer' : 'Message vocal'"
          >
            <!-- Micro (au repos) -->
            <svg *ngIf="!recording" xmlns="http://www.w3.org/2000/svg" width="19" height="19"
                 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>
            </svg>
            <!-- Stop (en enregistrement) -->
            <svg *ngIf="recording" xmlns="http://www.w3.org/2000/svg" width="17" height="17"
                 viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2.5"/>
            </svg>
          </button>
        </div>
      </div>

      <p class="hint">
        <ng-container *ngIf="recording">
          <span class="rec-dot"></span>Enregistrement… {{ elapsed }}s — cliquez sur ⏹ pour envoyer
        </ng-container>
        <span *ngIf="!recording && micError" class="mic-error">{{ micError }}</span>
        <ng-container *ngIf="!recording && !micError">
          <kbd>Entrée</kbd> pour envoyer · 🎤 pour dicter
        </ng-container>
      </p>
    </form>
  `,
  styles: [`
    :host { flex: none; }

    .composer {
      padding: 1rem 1.75rem 1.25rem;
      border-top: 1px solid var(--border);
      background: linear-gradient(0deg, var(--surface-2), var(--surface));
    }

    .input-shell {
      display: flex;
      align-items: flex-end;
      gap: 0.6rem;
      max-width: 880px;
      margin: 0 auto;
      padding: 0.5rem 0.5rem 0.5rem 1.1rem;
      background: var(--surface);
      border: 1.5px solid var(--border-strong);
      border-radius: var(--r-xl);
      box-shadow: var(--shadow-sm);
      transition: border-color var(--ease), box-shadow var(--ease);
    }

    .input-shell.focused {
      border-color: var(--orange);
      box-shadow: 0 0 0 4px rgba(255, 138, 61, 0.12);
    }

    .input-shell.recording {
      border-color: var(--red);
      box-shadow: 0 0 0 4px rgba(229, 57, 47, 0.12);
    }

    textarea {
      flex: 1 1 auto;
      min-width: 0;
      max-height: 180px;
      resize: none;
      border: none;
      outline: none;
      background: transparent;
      color: var(--text);
      font: inherit;
      line-height: 1.5;
      padding: 0.55rem 0;
    }

    textarea::placeholder { color: var(--text-muted); }
    textarea:disabled { background: transparent; }

    .actions-col {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      flex-shrink: 0;
    }

    .send-button, .mic-button {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform var(--ease), opacity var(--ease),
                  box-shadow var(--ease), background var(--ease), color var(--ease);
    }

    .send-button {
      border: none;
      background: var(--gradient-warm);
      color: #fff;
      box-shadow: var(--shadow-glow);
    }

    .send-button:hover:not(:disabled) { transform: translateY(-2px) scale(1.04); }

    .send-button:disabled {
      background: var(--border-strong);
      box-shadow: none;
      opacity: 0.7;
      cursor: not-allowed;
    }

    .mic-button {
      border: 1.5px solid var(--border-strong);
      background: var(--surface-2);
      color: var(--text-soft);
    }

    .mic-button:hover:not(:disabled) {
      color: var(--red);
      border-color: var(--red);
      background: var(--danger-bg);
    }

    .mic-button:disabled { opacity: 0.5; cursor: not-allowed; }

    .mic-button.active {
      border-color: transparent;
      background: var(--red);
      color: #fff;
      animation: rec-pulse 1.4s ease-in-out infinite;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2.5px solid rgba(255, 255, 255, 0.4);
      border-top-color: #fff;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    @keyframes rec-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(229, 57, 47, 0.45); }
      50%      { box-shadow: 0 0 0 8px rgba(229, 57, 47, 0); }
    }

    .hint {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      max-width: 880px;
      margin: 0.6rem auto 0;
      text-align: center;
      font-size: 0.74rem;
      color: var(--text-muted);
      min-height: 1.1rem;
    }

    .rec-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--red);
      animation: blink 1s steps(2, start) infinite;
    }

    @keyframes blink { 50% { opacity: 0.2; } }

    .mic-error { color: var(--danger-fg); font-weight: 600; }

    kbd {
      font-family: inherit;
      font-size: 0.72rem;
      padding: 0.05rem 0.35rem;
      border-radius: 5px;
      background: var(--surface-2);
      border: 1px solid var(--border-strong);
      color: var(--text-soft);
    }

    @media (max-width: 720px) {
      .composer { padding: 0.75rem 1rem 1rem; }
    }
  `]
})
export class ComposerComponent implements OnDestroy {
  @Input() sending = false;
  message = '';
  focused = false;

  @Output() messageSent = new EventEmitter<string>();
  @Output() voiceRecorded = new EventEmitter<Blob>();

  // ── État enregistrement vocal ──────────────────────────────────────────────
  recording = false;
  elapsed = 0;
  micError: string | null = null;

  private mediaRecorder?: MediaRecorder;
  private stream?: MediaStream;
  private chunks: Blob[] = [];
  private timer?: ReturnType<typeof setInterval>;

  // ── Texte ──────────────────────────────────────────────────────────────────

  onSubmit() {
    const text = this.message.trim();
    if (text && !this.sending && !this.recording) {
      this.messageSent.emit(text);
      this.message = '';
      this.focused = false;
    }
  }

  onEnter(event: Event): void {
    const e = event as KeyboardEvent;
    if (!e.shiftKey) {
      e.preventDefault();
      this.onSubmit();
      const ta = e.target as HTMLTextAreaElement;
      ta.style.height = 'auto';
    }
  }

  autoGrow(event: Event): void {
    const ta = event.target as HTMLTextAreaElement;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
  }

  // ── Vocal ────────────────────────────────────────────────────────────────

  toggleRecording(): void {
    if (this.recording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  private async startRecording(): Promise<void> {
    this.micError = null;

    if (!navigator?.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      this.micError = "L'enregistrement audio n'est pas supporté par ce navigateur.";
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      this.micError = 'Micro indisponible — autorisez son accès dans le navigateur.';
      return;
    }

    this.chunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream);

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this.chunks.push(e.data);
    };

    this.mediaRecorder.onstop = () => {
      const type = this.mediaRecorder?.mimeType || 'audio/webm';
      const blob = new Blob(this.chunks, { type });
      this.releaseStream();
      if (blob.size > 0) this.voiceRecorded.emit(blob);
    };

    this.mediaRecorder.start();
    this.recording = true;
    this.elapsed = 0;
    this.timer = setInterval(() => this.elapsed++, 1000);
  }

  private stopRecording(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = undefined; }
    this.recording = false;
    try {
      this.mediaRecorder?.stop(); // déclenche onstop → emit
    } catch {
      this.releaseStream();
    }
  }

  private releaseStream(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = undefined;
    this.mediaRecorder = undefined;
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.releaseStream();
  }
}
