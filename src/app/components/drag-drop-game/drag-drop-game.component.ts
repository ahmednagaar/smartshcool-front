import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AudioService } from '../../services/audio.service';
import {
  DragDropModule,
  CdkDragDrop,
  CdkDragStart,
  CdkDragEnd,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';

interface DragItem {
  id: number;
  text: string;
  correctZone: number;
}

interface DropZone {
  id: number;
  label: string;
  items: DragItem[];
  colorClass: string;
  isHighlighted?: boolean;
  pulseActive?: boolean;
}

interface GameState {
  combo: number;
  streak: number;
  maxStreak: number;
  hintsRemaining: number;
  score: number;
  multiplier: number;
}

@Component({
  selector: 'app-drag-drop-game',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="game-container min-h-screen p-4 font-cairo" 
         dir="rtl" 
         cdkDropListGroup
         [class.high-contrast]="highContrastMode"
         (mousemove)="onMouseMove($event)"
         role="application"
         aria-label="لعبة السحب والإفلات">
      
      <!-- Parallax Background -->
      <div class="parallax-bg" [style.transform]="'translate(' + parallaxX + 'px, ' + parallaxY + 'px)'"></div>
      
      <div class="container max-w-6xl py-6 mx-auto relative z-10">
        
        <!-- Header -->
        <header class="game-header flex justify-between items-center mb-6 p-4 rounded-2xl">
          <button (click)="goBack()" 
                  class="btn-ghost hover:bg-white/20 transition-all p-3 rounded-xl flex items-center gap-2"
                  aria-label="رجوع">
            <span class="text-xl">→</span>
            <span class="font-bold text-white">رجوع</span>
          </button>
          
          <div class="text-center flex-1">
            <h1 class="text-2xl md:text-3xl font-black text-white mb-1 text-shadow">
              🎯 السحب والإفلات
            </h1>
            <p class="text-white/70 text-sm">اسحب العناصر إلى التصنيف الصحيح</p>
          </div>
          
          <div class="flex items-center gap-3">
            <!-- Mute Toggle -->
            <button (click)="toggleMute()" 
                    class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all"
                    [attr.aria-label]="isMuted ? 'تشغيل الصوت' : 'كتم الصوت'">
              {{ isMuted ? '🔇' : '🔊' }}
            </button>
            
            <!-- High Contrast Toggle -->
            <button (click)="toggleHighContrast()" 
                    class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all"
                    aria-label="وضع التباين العالي">
              👁️
            </button>
            
            <!-- Score Badge -->
            <div class="score-badge" role="status" aria-live="polite">
              <span class="score-value" [class.animate-pop]="scoreAnimating">{{ gameState.score }}</span>
              <span class="score-label">نقطة</span>
              <span *ngIf="gameState.multiplier > 1" class="multiplier-badge animate-pulse">
                x{{ gameState.multiplier }}
              </span>
            </div>
          </div>
        </header>

        <!-- Streak & Combo Display -->
        <div class="flex justify-center gap-4 mb-4" *ngIf="gameState.streak > 0 || gameState.combo > 1">
          <div *ngIf="gameState.streak >= 3" class="streak-badge animate-bounce-in">
            🔥 سلسلة: {{ gameState.streak }}
          </div>
          <div *ngIf="gameState.combo > 1" class="combo-badge animate-scale-in">
            ⚡ كومبو: x{{ gameState.combo }}
          </div>
        </div>

        <!-- Hint Button -->
        <div class="text-center mb-4" *ngIf="gameState.hintsRemaining > 0 && !showResults">
          <button (click)="useHint()" 
                  class="hint-btn px-6 py-2 rounded-xl font-bold transition-all"
                  [disabled]="gameState.hintsRemaining === 0"
                  aria-label="استخدام تلميح">
            💡 تلميح ({{ gameState.hintsRemaining }})
          </button>
        </div>

        <div class="grid lg:grid-cols-12 gap-6 items-start">
          
          <!-- Source Store -->
          <div class="lg:col-span-4 lg:order-2">
            <div class="store-card glass-card p-5 min-h-[450px]">
              <h3 class="text-xl font-bold text-white/90 mb-5 text-center flex items-center justify-center gap-2">
                <span>📦</span> المخزن
              </h3>
              
              <div cdkDropList
                   [cdkDropListData]="availableItems"
                   class="flex flex-col gap-3 min-h-[350px]"
                   (cdkDropListDropped)="drop($event)"
                   role="listbox"
                   aria-label="عناصر متاحة للسحب">
                
                <div *ngFor="let item of availableItems; trackBy: trackByItemId"
                     cdkDrag
                     [cdkDragData]="item"
                     (cdkDragStarted)="onDragStart($event, item)"
                     (cdkDragEnded)="onDragEnd($event)"
                     class="item-card glass-shimmer"
                     role="option"
                     tabindex="0"
                     [attr.aria-label]="'عنصر: ' + item.text"
                     (keydown)="onItemKeydown($event, item)">
                  
                  <div class="flex items-center justify-between">
                    <span class="text-lg font-bold">{{ item.text }}</span>
                    <span class="drag-handle">⋮⋮</span>
                  </div>

                  <div *cdkDragPreview class="drag-preview">
                    {{ item.text }}
                  </div>

                  <div *cdkDragPlaceholder class="drag-placeholder animate-dash"></div>
                </div>

                <div *ngIf="availableItems.length === 0" class="empty-store">
                  <p>✨ نفدت العناصر!</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Drop Zones -->
          <div class="lg:col-span-8 lg:order-1">
            <div class="grid md:grid-cols-2 gap-5">
              <div *ngFor="let zone of dropZones; trackBy: trackByZoneId"
                   class="zone-card glass-card overflow-hidden transition-all duration-300"
                   [class.zone-blue]="zone.id === 1"
                   [class.zone-green]="zone.id === 2"
                   [class.zone-pulse]="zone.pulseActive && isDragging"
                   [class.zone-highlighted]="zone.isHighlighted"
                   role="listbox"
                   [attr.aria-label]="'منطقة: ' + zone.label">
                
                <div class="zone-header p-4">
                  <h3 class="text-xl font-black text-center text-white">
                    {{ zone.label }}
                  </h3>
                </div>

                <div cdkDropList
                     [cdkDropListData]="zone.items"
                     class="zone-content p-5 min-h-[280px] flex flex-col gap-3"
                     (cdkDropListDropped)="drop($event)"
                     (cdkDropListEntered)="onZoneEnter(zone)"
                     (cdkDropListExited)="onZoneExit(zone)">
                  
                  <div *ngFor="let item of zone.items; trackBy: trackByItemId"
                       cdkDrag
                       [cdkDragData]="item"
                       class="zone-item"
                       [class.item-correct]="showResults && item.correctZone === zone.id"
                       [class.item-wrong]="showResults && item.correctZone !== zone.id"
                       [class.animate-shake]="showResults && item.correctZone !== zone.id"
                       [class.animate-spring]="!showResults"
                       role="option"
                       tabindex="0"
                       [attr.aria-label]="item.text + (showResults ? (item.correctZone === zone.id ? ' - صحيح' : ' - خطأ') : '')">
                    
                    <span class="text-lg font-bold">{{ item.text }}</span>
                    
                    <span *ngIf="showResults" class="result-icon">
                      {{ item.correctZone === zone.id ? '✓' : '✕' }}
                    </span>

                    <div *cdkDragPlaceholder class="drag-placeholder"></div>
                  </div>

                  <div *ngIf="zone.items.length === 0" class="zone-empty">
                    <p>اسحب العناصر هنا</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Check Button -->
        <div class="mt-8 text-center" *ngIf="allPlaced && !showResults">
          <button (click)="checkAnswers()" 
                  class="check-btn animate-bounce-subtle"
                  aria-label="تحقق من الإجابات">
            تحقق من الإجابات 🚀
          </button>
        </div>

        <!-- Results Modal -->
        <div *ngIf="showResults" 
             class="modal-overlay animate-fade-in"
             role="dialog"
             aria-modal="true"
             aria-labelledby="result-title">
          
          <!-- Confetti Canvas -->
          <canvas #confettiCanvas class="confetti-canvas" *ngIf="isPerfectScore"></canvas>
          
          <div class="modal-content animate-bounce-in">
            <div class="result-icon-large">
              {{ isPerfectScore ? '🏆' : '👏' }}
            </div>
            
            <h3 id="result-title" class="result-title">
              {{ isPerfectScore ? 'مذهل! نتيجة مثالية!' : 'عمل جيد!' }}
            </h3>
            
            <p class="result-subtitle">
              نجحت في تصنيف <strong class="text-cyan-400">{{ correctPlacements }}</strong> من أصل {{ totalItems }} عناصر
            </p>
            
            <!-- Stats -->
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-value">{{ gameState.score }}</span>
                <span class="stat-label">النقاط</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ gameState.maxStreak }}</span>
                <span class="stat-label">أفضل سلسلة</span>
              </div>
            </div>
            
            <div class="modal-actions">
              <button (click)="resetGame()" class="btn-secondary">
                إعادة المحاولة 🔄
              </button>
              <button (click)="finishGame()" class="btn-primary">
                التالي ➡️
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- ARIA Live Region -->
      <div class="sr-only" aria-live="polite" aria-atomic="true">
        {{ ariaAnnouncement }}
      </div>
    </div>
  `,
  styles: [`
    /* ========== Variables ========== */
    :host {
      --primary: #1e40af;
      --cyan: #00D9FF;
      --purple: #8B5CF6;
      --green: #10B981;
      --orange: #F59E0B;
    }

    /* ========== Game Container ========== */
    .game-container {
      background: linear-gradient(135deg, #1e3a8a 0%, #7c3aed 50%, #f97316 100%);
      font-family: 'Cairo', sans-serif;
      position: relative;
      overflow: hidden;
    }

    .game-container.high-contrast {
      background: #000 !important;
    }
    .high-contrast .glass-card {
      background: #fff !important;
      color: #000 !important;
      border: 3px solid #fff !important;
    }
    .high-contrast .text-white { color: #fff !important; }

    /* ========== Parallax Background ========== */
    .parallax-bg {
      position: fixed;
      inset: -50px;
      background: 
        radial-gradient(circle at 20% 30%, rgba(0,217,255,0.15) 0%, transparent 40%),
        radial-gradient(circle at 80% 70%, rgba(245,158,11,0.15) 0%, transparent 40%);
      pointer-events: none;
      transition: transform 0.1s ease-out;
      z-index: 0;
    }

    /* ========== Header ========== */
    .game-header {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
    }

    .text-shadow {
      text-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }

    .score-badge {
      background: linear-gradient(135deg, var(--cyan), var(--purple));
      padding: 8px 16px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 15px rgba(0,217,255,0.3);
      position: relative;
    }
    .score-value {
      font-size: 24px;
      font-weight: 900;
      color: white;
    }
    .score-label {
      font-size: 12px;
      color: rgba(255,255,255,0.8);
    }
    .multiplier-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: var(--orange);
      color: white;
      font-size: 12px;
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 8px;
    }

    /* ========== Streak & Combo ========== */
    .streak-badge, .combo-badge {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(5px);
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
    }
    .streak-badge { border-color: #EF4444; }
    .combo-badge { border-color: var(--cyan); }

    /* ========== Hint Button ========== */
    .hint-btn {
      background: linear-gradient(135deg, #F59E0B, #EAB308);
      color: white;
      box-shadow: 0 4px 15px rgba(245,158,11,0.4);
    }
    .hint-btn:hover { transform: translateY(-2px); }
    .hint-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ========== Glass Card ========== */
    .glass-card {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(15px);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 20px;
    }

    .glass-shimmer {
      position: relative;
      overflow: hidden;
    }
    .glass-shimmer::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(120deg, transparent, rgba(255,255,255,0.1), transparent);
      transform: translateX(-100%);
      animation: shimmer 3s infinite;
    }
    @keyframes shimmer {
      100% { transform: translateX(100%); }
    }

    /* ========== Store Card ========== */
    .store-card {
      border: 2px dashed rgba(255,255,255,0.3);
    }

    /* ========== Item Card ========== */
    .item-card {
      background: white;
      padding: 16px;
      border-radius: 12px;
      cursor: grab;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      border: 2px solid transparent;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .item-card:hover {
      transform: translateY(-4px) scale(1.02);
      border-color: var(--cyan);
      box-shadow: 0 8px 25px rgba(0,217,255,0.2);
    }
    .item-card:focus {
      outline: none;
      border-color: var(--cyan);
      box-shadow: 0 0 0 3px rgba(0,217,255,0.3);
    }
    .item-card:active { cursor: grabbing; }

    .drag-handle {
      color: #ccc;
      font-size: 18px;
    }

    /* ========== Drag Preview ========== */
    .drag-preview {
      background: linear-gradient(135deg, var(--cyan), var(--purple));
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      font-weight: bold;
      font-size: 18px;
      box-shadow: 0 15px 40px rgba(0,0,0,0.3);
      transform: rotate(3deg);
    }

    /* ========== Drag Placeholder ========== */
    .drag-placeholder {
      background: rgba(0,217,255,0.1);
      border: 2px dashed var(--cyan);
      border-radius: 12px;
      min-height: 56px;
      animation: dash-animate 1s linear infinite;
    }
    @keyframes dash-animate {
      0% { border-color: var(--cyan); }
      50% { border-color: var(--purple); }
      100% { border-color: var(--cyan); }
    }

    /* ========== Zone Cards ========== */
    .zone-card {
      transition: all 0.3s ease;
    }
    .zone-blue { border: 2px solid #3B82F6; }
    .zone-green { border: 2px solid #10B981; }
    
    .zone-blue .zone-header { background: linear-gradient(135deg, #3B82F6, #1D4ED8); }
    .zone-green .zone-header { background: linear-gradient(135deg, #10B981, #059669); }

    .zone-pulse {
      animation: zone-glow 1s ease-in-out infinite;
    }
    @keyframes zone-glow {
      0%, 100% { box-shadow: 0 0 20px rgba(0,217,255,0.3); }
      50% { box-shadow: 0 0 40px rgba(0,217,255,0.6); }
    }

    .zone-highlighted {
      transform: scale(1.02);
      box-shadow: 0 0 30px rgba(0,217,255,0.5) !important;
    }

    .zone-content {
      background: rgba(255,255,255,0.05);
    }

    .zone-empty {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px dashed rgba(255,255,255,0.2);
      border-radius: 12px;
      color: rgba(255,255,255,0.5);
      margin: 8px;
      padding: 20px;
    }

    .zone-item {
      background: white;
      padding: 14px 18px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }

    .item-correct {
      background: linear-gradient(135deg, #10B981, #059669) !important;
      color: white !important;
    }
    .item-wrong {
      background: linear-gradient(135deg, #EF4444, #DC2626) !important;
      color: white !important;
    }

    .result-icon {
      width: 28px;
      height: 28px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    .empty-store {
      text-align: center;
      color: rgba(255,255,255,0.5);
      padding: 40px;
    }

    /* ========== Check Button ========== */
    .check-btn {
      background: linear-gradient(135deg, var(--cyan), var(--purple));
      color: white;
      font-size: 20px;
      font-weight: 900;
      padding: 16px 48px;
      border-radius: 16px;
      border: none;
      cursor: pointer;
      box-shadow: 0 8px 30px rgba(0,217,255,0.4);
      transition: all 0.3s ease;
    }
    .check-btn:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0,217,255,0.5);
    }

    /* ========== Modal ========== */
    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(8px);
      padding: 20px;
    }
    
    .confetti-canvas {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 101;
    }

    .modal-content {
      background: linear-gradient(135deg, #1e3a8a, #7c3aed);
      border-radius: 24px;
      padding: 40px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      border: 2px solid rgba(255,255,255,0.2);
      box-shadow: 0 25px 60px rgba(0,0,0,0.4);
      position: relative;
      z-index: 102;
    }

    .result-icon-large {
      font-size: 80px;
      margin-bottom: 16px;
      animation: bounce 1s ease infinite;
    }

    .result-title {
      font-size: 28px;
      font-weight: 900;
      color: white;
      margin-bottom: 8px;
    }

    .result-subtitle {
      color: rgba(255,255,255,0.8);
      font-size: 16px;
      margin-bottom: 24px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-item {
      background: rgba(255,255,255,0.1);
      padding: 16px;
      border-radius: 12px;
    }
    .stat-value {
      display: block;
      font-size: 28px;
      font-weight: 900;
      color: var(--cyan);
    }
    .stat-label {
      font-size: 12px;
      color: rgba(255,255,255,0.7);
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--cyan), var(--purple));
      color: white;
      font-weight: bold;
      padding: 14px 28px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .btn-primary:hover { transform: translateY(-2px); }

    .btn-secondary {
      background: rgba(255,255,255,0.1);
      color: white;
      font-weight: bold;
      padding: 14px 28px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.3);
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .btn-secondary:hover { background: rgba(255,255,255,0.2); }

    /* ========== Animations ========== */
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    @keyframes bounce-subtle {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }

    @keyframes spring {
      0% { transform: scale(0.8); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    .animate-spring { animation: spring 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }
    .animate-shake { animation: shake 0.5s ease-in-out; }

    @keyframes pop {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
    .animate-pop { animation: pop 0.3s ease; }

    @keyframes bounce-in {
      0% { transform: scale(0.5); opacity: 0; }
      60% { transform: scale(1.05); opacity: 1; }
      100% { transform: scale(1); }
    }
    .animate-bounce-in { animation: bounce-in 0.5s ease forwards; }

    @keyframes scale-in {
      0% { transform: scale(0); }
      100% { transform: scale(1); }
    }
    .animate-scale-in { animation: scale-in 0.3s ease forwards; }

    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-fade-in { animation: fade-in 0.3s ease; }

    /* CDK Drag Animations */
    .cdk-drag-animating {
      transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    /* ========== Accessibility ========== */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    /* Focus for keyboard nav */
    *:focus-visible {
      outline: 3px solid var(--cyan);
      outline-offset: 2px;
    }
  `]
})
export class DragDropGameComponent implements OnInit, OnDestroy {
  availableItems: DragItem[] = [];
  dropZones: DropZone[] = [];
  correctPlacements = 0;
  totalItems = 0;
  showResults = false;
  isDragging = false;
  currentDragItem: DragItem | null = null;

  // Gamification State
  gameState: GameState = {
    combo: 0,
    streak: 0,
    maxStreak: 0,
    hintsRemaining: 3,
    score: 0,
    multiplier: 1
  };

  // UI State
  isMuted = false;
  highContrastMode = false;
  scoreAnimating = false;
  parallaxX = 0;
  parallaxY = 0;
  ariaAnnouncement = '';

  // Keyboard navigation
  selectedItemIndex = -1;
  selectedZoneIndex = -1;

  constructor(
    private router: Router,
    private api: ApiService,
    private audio: AudioService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.isMuted = this.audio.getMuted();
    this.initializeGame();
  }

  ngOnDestroy() { }

  get allPlaced(): boolean {
    return this.availableItems.length === 0;
  }

  get isPerfectScore(): boolean {
    return this.correctPlacements === this.totalItems;
  }

  // TrackBy functions for performance
  trackByItemId(index: number, item: DragItem): number {
    return item.id;
  }

  trackByZoneId(index: number, zone: DropZone): number {
    return zone.id;
  }

  initializeGame() {
    this.showResults = false;
    this.gameState = {
      combo: 0,
      streak: 0,
      maxStreak: 0,
      hintsRemaining: 3,
      score: 0,
      multiplier: 1
    };

    this.api.getQuestions().subscribe({
      next: (questions) => {
        const dragDropQuestions = questions.filter((q: any) => q.type === 5);
        if (dragDropQuestions.length > 0) {
          const question = dragDropQuestions[Math.floor(Math.random() * dragDropQuestions.length)];
          this.loadQuestionConfig(question);
        } else {
          this.loadMockData();
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadMockData();
        this.cdr.markForCheck();
      }
    });
  }

  loadQuestionConfig(question: any) {
    try {
      const config = JSON.parse(question.options);
      this.dropZones = (config.zones || []).map((z: any) => ({
        id: z.id,
        label: z.label,
        items: [],
        colorClass: z.id === 1 ? 'blue' : 'green',
        pulseActive: true
      }));

      const rawItems = (config.items || []).map((item: any) => ({
        id: item.id,
        text: item.text,
        correctZone: item.correctZone
      }));

      this.availableItems = this.shuffleArray(rawItems);
      this.totalItems = this.availableItems.length;
      this.updateScore();
    } catch {
      this.loadMockData();
    }
  }

  loadMockData() {
    this.dropZones = [
      { id: 1, label: 'أعداد فردية', items: [], colorClass: 'blue', pulseActive: true },
      { id: 2, label: 'أعداد زوجية', items: [], colorClass: 'green', pulseActive: true }
    ];
    const rawItems = [
      { id: 1, text: '1', correctZone: 1 },
      { id: 2, text: '2', correctZone: 2 },
      { id: 3, text: '3', correctZone: 1 },
      { id: 4, text: '4', correctZone: 2 },
      { id: 5, text: '5', correctZone: 1 },
      { id: 6, text: '6', correctZone: 2 },
      { id: 7, text: '7', correctZone: 1 },
      { id: 8, text: '8', correctZone: 2 }
    ];
    this.availableItems = this.shuffleArray(rawItems);
    this.totalItems = this.availableItems.length;
    this.updateScore();
  }

  // Drag Handlers
  onDragStart(event: CdkDragStart, item: DragItem) {
    this.isDragging = true;
    this.currentDragItem = item;
    this.audio.playClick();

    // Activate pulse on all zones
    this.dropZones.forEach(z => z.pulseActive = true);
    this.cdr.markForCheck();
  }

  onDragEnd(event: CdkDragEnd) {
    this.isDragging = false;
    this.currentDragItem = null;
    this.dropZones.forEach(z => z.pulseActive = false);
    this.cdr.markForCheck();
  }

  onZoneEnter(zone: DropZone) {
    zone.isHighlighted = true;
    this.cdr.markForCheck();
  }

  onZoneExit(zone: DropZone) {
    zone.isHighlighted = false;
    this.cdr.markForCheck();
  }

  drop(event: CdkDragDrop<DragItem[]>) {
    const item = event.item.data as DragItem;

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Check if dropped in a zone (not back to store)
      const targetZone = this.dropZones.find(z => z.items.includes(item));
      if (targetZone) {
        const isCorrect = item.correctZone === targetZone.id;

        if (isCorrect) {
          this.audio.playCorrect();
          this.gameState.streak++;
          this.gameState.combo++;
          this.gameState.maxStreak = Math.max(this.gameState.maxStreak, this.gameState.streak);
          this.gameState.multiplier = Math.min(3, 1 + Math.floor(this.gameState.combo / 3));
          this.gameState.score += 10 * this.gameState.multiplier;
          this.ariaAnnouncement = `تم وضع ${item.text} في ${targetZone.label} بشكل صحيح`;
        } else {
          this.audio.playWrong();
          this.gameState.streak = 0;
          this.gameState.combo = 0;
          this.gameState.multiplier = 1;
          this.ariaAnnouncement = `تم وضع ${item.text} في ${targetZone.label} بشكل خاطئ`;
        }

        this.scoreAnimating = true;
        setTimeout(() => {
          this.scoreAnimating = false;
          this.cdr.markForCheck();
        }, 300);
      }
    }

    this.updateScore();
    this.cdr.markForCheck();
  }

  // Keyboard Navigation
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // Tab cycles through items
    // Arrow keys for zone selection when item selected
    // Enter/Space drops item
  }

  onItemKeydown(event: KeyboardEvent, item: DragItem) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      // Select item for keyboard drop
      this.announce(`تم اختيار ${item.text}. استخدم الأسهم لاختيار المنطقة ثم اضغط Enter`);
    }
  }

  // Hint System
  useHint() {
    if (this.gameState.hintsRemaining <= 0 || this.availableItems.length === 0) return;

    this.gameState.hintsRemaining--;
    const nextItem = this.availableItems[0];
    const correctZone = this.dropZones.find(z => z.id === nextItem.correctZone);

    if (correctZone) {
      correctZone.isHighlighted = true;
      this.announce(`تلميح: ضع ${nextItem.text} في ${correctZone.label}`);

      setTimeout(() => {
        correctZone.isHighlighted = false;
        this.cdr.markForCheck();
      }, 2000);
    }

    this.cdr.markForCheck();
  }

  // Parallax Effect
  onMouseMove(event: MouseEvent) {
    const x = (event.clientX / window.innerWidth - 0.5) * 20;
    const y = (event.clientY / window.innerHeight - 0.5) * 20;
    this.parallaxX = x;
    this.parallaxY = y;
  }

  // Audio & Accessibility Toggles
  toggleMute() {
    this.isMuted = this.audio.toggleMute();
    this.cdr.markForCheck();
  }

  toggleHighContrast() {
    this.highContrastMode = !this.highContrastMode;
    this.announce(this.highContrastMode ? 'تم تفعيل وضع التباين العالي' : 'تم إلغاء وضع التباين العالي');
    this.cdr.markForCheck();
  }

  announce(message: string) {
    this.ariaAnnouncement = message;
    this.cdr.markForCheck();
  }

  updateScore() {
    let score = 0;
    this.dropZones.forEach(zone => {
      zone.items.forEach(item => {
        if (item.correctZone === zone.id) score++;
      });
    });
    this.correctPlacements = score;
  }

  checkAnswers() {
    this.updateScore();
    this.showResults = true;

    if (this.isPerfectScore) {
      this.audio.playComplete();
      this.announce('نتيجة مثالية! أحسنت!');
    } else {
      this.audio.playClick();
      this.announce(`أحسنت! لقد أصبت ${this.correctPlacements} من ${this.totalItems}`);
    }

    this.cdr.markForCheck();
  }

  resetGame() {
    this.audio.playClick();
    this.initializeGame();
  }

  finishGame() {
    sessionStorage.setItem('quizScore', this.correctPlacements.toString());
    sessionStorage.setItem('quizTotal', this.totalItems.toString());
    this.router.navigate(['/result']);
  }

  goBack() {
    this.router.navigate(['/game-type']);
  }

  shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
