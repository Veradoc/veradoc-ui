import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'vd-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="vd-avatar" [class]="'vd-avatar--' + size" [class.vd-avatar--thinking]="thinking">

      <!-- ── IDLE: static product icon ───────────────────────────────────── -->
      @if (!thinking) {
        <svg
          class="vd-icon"
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="VeraDoc"
        >
          <defs>
            <linearGradient id="vg-idle-v" x1="8" y1="9" x2="28" y2="27" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stop-color="#60a5fa" />
              <stop offset="100%" stop-color="#2563eb" />
            </linearGradient>
          </defs>

          <!-- Three accent dots — top-left, top-right, bottom-right -->
          <circle cx="5"  cy="5"  r="1.5" fill="#3b82f6" opacity="0.7" />
          <circle cx="31" cy="5"  r="1.5" fill="#3b82f6" opacity="0.7" />
          <circle cx="31" cy="31" r="1.5" fill="#3b82f6" opacity="0.7" />

          <!-- The V -->
          <path
            d="M8 9L18 27L28 9"
            stroke="url(#vg-idle-v)"
            stroke-width="3.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      }

      <!-- ── THINKING: animated icon ─────────────────────────────────────── -->
      @if (thinking) {

        <!-- Expanding pulse ring -->
        <span class="vd-pulse-ring" aria-hidden="true"></span>

        <!-- Four corner dots stagger-pulsing -->
        <span class="vd-thinking-dot vd-thinking-dot--tl" aria-hidden="true"></span>
        <span class="vd-thinking-dot vd-thinking-dot--tr" aria-hidden="true"></span>
        <span class="vd-thinking-dot vd-thinking-dot--br" aria-hidden="true"></span>
        <span class="vd-thinking-dot vd-thinking-dot--bl" aria-hidden="true"></span>

        <!-- Counter-rotating orbits -->
        <span class="vd-orbit vd-orbit--outer" aria-hidden="true">
          <span class="vd-orbit__dot vd-orbit__dot--outer"></span>
        </span>
        <span class="vd-orbit vd-orbit--inner" aria-hidden="true">
          <span class="vd-orbit__dot vd-orbit__dot--inner"></span>
        </span>

        <!-- V mark — breathing while thinking -->
        <svg
          class="vd-icon vd-icon--breathing"
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="VeraDoc"
        >
          <defs>
            <linearGradient id="vg-think-v" x1="8" y1="9" x2="28" y2="27" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stop-color="#93c5fd" />
              <stop offset="100%" stop-color="#3b82f6" />
            </linearGradient>
          </defs>

          <path
            d="M8 9L18 27L28 9"
            stroke="url(#vg-think-v)"
            stroke-width="3.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      }

    </div>
  `,
  styles: [`
    :host { display: inline-flex; }

    /* ── Keyframes ──────────────────────────────────────────────────────── */
    @keyframes vd-orbit-cw  { to { transform: rotate(360deg);  } }
    @keyframes vd-orbit-ccw { to { transform: rotate(-360deg); } }

    @keyframes vd-pulse-ring {
      0%   { opacity: 0; transform: scale(0.85); }
      40%  { opacity: 1; }
      100% { opacity: 0; transform: scale(1.3);  }
    }

    @keyframes vd-dot-pulse {
      0%, 100% { opacity: 0.2; transform: scale(0.7); }
      50%       { opacity: 1;   transform: scale(1.2); }
    }

    @keyframes vd-v-breathe {
      0%, 100% { opacity: 0.7; }
      50%       { opacity: 1;   }
    }

    /* ── Container ──────────────────────────────────────────────────────── */
    .vd-avatar {
      background:      #0e1525;
      display:         flex;
      align-items:     center;
      justify-content: center;
      position:        relative;
      overflow:        visible;
      flex-shrink:     0;
      transition:      box-shadow 0.3s ease;

      &--sm  { width: 28px; height: 28px; border-radius:  8px; }
      &--md  { width: 36px; height: 36px; border-radius: 10px; }
      &--lg  { width: 52px; height: 52px; border-radius: 14px; }

      &--thinking {
        box-shadow: 0 0 0 1.5px rgba(59, 130, 246, 0.25);
      }
    }

    /* ── SVG icon — scales with container ───────────────────────────────── */
    .vd-icon {
      position: relative;
      z-index:  1;

      &--breathing { animation: vd-v-breathe 1.8s ease-in-out infinite; }
    }

    .vd-avatar--sm .vd-icon { width: 18px; height: 18px; }
    .vd-avatar--md .vd-icon { width: 24px; height: 24px; }
    .vd-avatar--lg .vd-icon { width: 34px; height: 34px; }

    /* ── Thinking corner dots (staggered pulse) ─────────────────────────── */
    .vd-thinking-dot {
      position:      absolute;
      width:         3px;
      height:        3px;
      border-radius: 50%;
      background:    #60a5fa;

      &--tl { top: 3px;    left:  3px; animation: vd-dot-pulse 1.4s ease-in-out infinite 0s;    }
      &--tr { top: 3px;    right: 3px; animation: vd-dot-pulse 1.4s ease-in-out infinite 0.35s; }
      &--br { bottom: 3px; right: 3px; animation: vd-dot-pulse 1.4s ease-in-out infinite 0.7s;  }
      &--bl { bottom: 3px; left:  3px; animation: vd-dot-pulse 1.4s ease-in-out infinite 1.05s; }
    }

    /* ── Pulse ring ─────────────────────────────────────────────────────── */
    .vd-pulse-ring {
      position:       absolute;
      inset:          -3px;
      border-radius:  13px;
      border:         1.5px solid #3b82f6;
      pointer-events: none;
      animation:      vd-pulse-ring 1.8s ease-out infinite;
    }

    /* ── Orbits ─────────────────────────────────────────────────────────── */
    .vd-orbit {
      position:      absolute;
      border-radius: 50%;

      &--inner { inset: -6px;  animation: vd-orbit-cw  1.8s linear infinite; }
      &--outer { inset: -10px; animation: vd-orbit-ccw 2.8s linear infinite; }
    }

    .vd-orbit__dot {
      position:      absolute;
      border-radius: 50%;
      top:           50%;
      left:          50%;

      &--inner {
        width:      5px;
        height:     5px;
        background: #3b82f6;
        transform:  translate(-50%, -100%) translateY(-8px);
      }

      &--outer {
        width:      3.5px;
        height:     3.5px;
        background: #93c5fd;
        opacity:    0.6;
        transform:  translate(-50%, -100%) translateY(-10px);
      }
    }

    /* ── Reduced motion ─────────────────────────────────────────────────── */
    @media (prefers-reduced-motion: reduce) {
      .vd-orbit,
      .vd-pulse-ring,
      .vd-thinking-dot,
      .vd-icon--breathing { animation: none; }

      .vd-avatar--thinking {
        box-shadow:
          0 0 0 1.5px rgba(59, 130, 246, 0.5),
          0 0 0 3px   rgba(59, 130, 246, 0.15);
      }
    }
  `],
})
export class VdAvatarComponent {
  /**
   * Activates the animated thinking state.
   * Bind to your isThinking flag, e.g.: [thinking]="isThinking && $last"
   */
  @Input() thinking = false;

  /**
   * Visual size of the avatar.
   * 'sm' → 28px  |  'md' → 36px (default)  |  'lg' → 52px
   */
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
}
