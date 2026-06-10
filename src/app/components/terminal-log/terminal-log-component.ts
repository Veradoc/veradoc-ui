import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
 
export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'success' | 'error' | 'warn';
  message: string;
}
 
@Component({
  selector: 'app-terminal-log',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tlog-wrapper">
      <!-- Header -->
      <div class="tlog-header">
        <!--<div class="tlog-dots">
          <span class="dot dot--red"></span>
          <span class="dot dot--yellow"></span>
          <span class="dot dot--green"></span>
        </div>-->
        <span class="tlog-title">{{ title }}</span>
        <button class="tlog-clear" (click)="onClear()" title="Clear logs">⌫</button>
        <button class="tlog-close" (click)="onClose()" title="Close terminal">✕</button>
      </div>
 
      <!-- Log body -->
      <div class="tlog-body" #logBody>
        <div *ngIf="entries.length === 0" class="tlog-empty">
          Waiting for output...
        </div>
 
        <div
          *ngFor="let entry of entries"
          class="tlog-row"
          [class.tlog-row--info]="entry.level === 'info'"
          [class.tlog-row--success]="entry.level === 'success'"
          [class.tlog-row--error]="entry.level === 'error'"
          [class.tlog-row--warn]="entry.level === 'warn'"
        >
          <span class="tlog-ts">{{ entry.timestamp | date: 'HH:mm:ss.SSS' }}</span>
          <span class="tlog-badge tlog-badge--{{ entry.level }}">{{ entry.level.toUpperCase() }}</span>
          <span class="tlog-msg">{{ entry.message }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;           /* ← fill whatever the parent gives */
      font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
    }
 
    .tlog-wrapper {
      background: #0d0d0d;
      border: 1px solid #1f1f1f;
      //border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
      height: 100%;           /* ← fill :host */
      display: flex;
      flex-direction: column; /* ← header + body stacked */      
    }
 
    /* ── Header ── */
    .tlog-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: #161616;
      border-bottom: 1px solid #1f1f1f;
      user-select: none;
    }
 
    .tlog-dots {
      display: flex;
      gap: 6px;
    }
 
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
 
    .dot--red    { background: #ff5f56; }
    .dot--yellow { background: #ffbd2e; }
    .dot--green  { background: #27c93f; }
 
    .tlog-title {
      flex: 1;
      font-size: 0.72rem;
      color: #555;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
 
    .tlog-clear {
      background: none;
      border: none;
      color: #444;
      cursor: pointer;
      font-size: 0.85rem;
      padding: 2px 6px;
      border-radius: 4px;
      transition: color 0.15s, background 0.15s;
    }
 
    .tlog-clear:hover {
      color: #ccc;
      background: #222;
    }
 
    .tlog-close {
      border-radius: 6px;
      cursor: pointer;
    }

    /* ── Body ── */
    .tlog-body {
      flex: 1;
      //max-height: 320px;
      overflow-y: auto;
      padding: 8px 0;
      scroll-behavior: smooth;
    }
 
    .tlog-body::-webkit-scrollbar { width: 15px; }
    .tlog-body::-webkit-scrollbar-track { background: #1a1a1a; }
    .tlog-body::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }
     .tlog-body::-webkit-scrollbar-thumb:hover { background: #666;     /* ← even lighter on hover */}

    .tlog-empty {
      padding: 20px 16px;
      color: #333;
      font-size: 0.78rem;
      font-style: italic;
    }
 
    /* ── Row ── */
    .tlog-row {
      display: flex;
      align-items: baseline;
      gap: 10px;
      padding: 3px 14px;
      border-left: 2px solid transparent;
      transition: background 0.1s;
      font-size: 0.78rem;
      line-height: 1.6;
    }
 
    .tlog-row:hover { background: #141414; }
 
    .tlog-row--info    { border-left-color: #3a8eff; }
    .tlog-row--success { border-left-color: #27c93f; }
    .tlog-row--error   { border-left-color: #ff5f56; }
    .tlog-row--warn    { border-left-color: #ffbd2e; }
 
    /* ── Timestamp ── */
    .tlog-ts {
      color: #3a3a3a;
      font-size: 0.7rem;
      white-space: nowrap;
      flex-shrink: 0;
    }
 
    /* ── Badge ── */
    .tlog-badge {
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      padding: 1px 5px;
      border-radius: 3px;
      flex-shrink: 0;
    }
 
    .tlog-badge--info    { color: #3a8eff; background: rgba(58,142,255,0.1); }
    .tlog-badge--success { color: #27c93f; background: rgba(39,201,63,0.1);  }
    .tlog-badge--error   { color: #ff5f56; background: rgba(255,95,86,0.1);  }
    .tlog-badge--warn    { color: #ffbd2e; background: rgba(255,189,46,0.1); }
 
    /* ── Message ── */
    .tlog-msg {
      color: #c8c8c8;
      word-break: break-all;
    }
 
    .tlog-row--error .tlog-msg { color: #ff8a85; }
    .tlog-row--warn  .tlog-msg { color: #ffd47e; }
    .tlog-row--success .tlog-msg { color: #7ee89a; }
  `],
})
export class TerminalLogComponent implements AfterViewChecked {
  @Input() title: string = 'Ollama Model Logs';
  @Output() closed = new EventEmitter<void>();
  
  @ViewChild('logBody') private logBody!: ElementRef<HTMLDivElement>;
 
  entries: LogEntry[] = [];
  private shouldScroll = false;
 
  /** Push a new log line */
  log(message: string, level: LogEntry['level'] = 'info') {
    this.entries.push({ timestamp: new Date(), level, message });
    this.shouldScroll = true;
  }
 
  /** Convenience shortcuts */
  info(message: string)    { this.log(message, 'info');    }
  success(message: string) { this.log(message, 'success'); }
  error(message: string)   { this.log(message, 'error');   }
  warn(message: string)    { this.log(message, 'warn');    }
 
  onClear() {
    this.entries = [];
  }
 
  onClose() {
    this.onClear();
    this.closed.emit();                             // ← emit to parent
  }

  ngAfterViewChecked() {
    if (this.shouldScroll && this.logBody) {
      const el = this.logBody.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }
}