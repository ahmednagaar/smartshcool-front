import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AudioService } from '../../services/audio.service';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { DragDropGameService, StartGameRequestDto, GameSessionDto, GameResultDto } from '../../services/drag-drop-game.service';
import { DragDropZoneDto, DragDropItemDto, GradeLevel, SubjectType } from '../../models/drag-drop.model';
import Swal from 'sweetalert2';

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
         [class]="uiThemeClass"
         role="application">
      
      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex items-center justify-center min-h-screen">
          <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
      </div>

      <div *ngIf="!isLoading">
          <!-- Parallax Background -->
          <div class="parallax-bg"></div>
          
          <!-- ========== GAME SCREEN ========== -->
          <div class="container max-w-6xl py-6 mx-auto relative z-10">
            
            <!-- Header -->
            <header class="game-header flex justify-between items-center mb-6 p-4 rounded-2xl">
              <button (click)="goBack()" 
                      class="btn-ghost hover:bg-white/20 transition-all p-3 rounded-xl flex items-center gap-2"
                      aria-label="رجوع">
                <span class="text-xl">→</span>
                <span class="font-bold text-white">خروج</span>
              </button>
              
              <div class="text-center flex-1">
                <h1 class="text-2xl md:text-3xl font-black text-white mb-1 text-shadow">
                  {{ session?.gameTitle }}
                </h1>
                <p class="text-white/70 text-sm">{{ session?.instructions || 'اسحب العناصر إلى التصنيف الصحيح' }}</p>
              </div>
              
              <div class="flex items-center gap-3">
                <button (click)="toggleMute()" 
                        class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all">
                  {{ isMuted ? '🔇' : '🔊' }}
                </button>
                
                <div class="score-badge" role="status">
                  <span class="score-value">{{ currentScore }}</span>
                  <span class="score-label">نقطة</span>
                </div>
              </div>
            </header>

            <!-- Store & Zones -->
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
                       (cdkDropListDropped)="drop($event, -1)"
                       [id]="'store-list'">
                    
                    <div *ngFor="let item of availableItems"
                         cdkDrag
                         [cdkDragData]="item"
                         class="item-card glass-shimmer"
                         [attr.aria-label]="item.text">
                      
                      <div class="flex items-center justify-between">
                        <span class="text-lg font-bold">{{ item.text }}</span>
                        <span class="drag-handle">⋮⋮</span>
                      </div>
                      
                      <div *cdkDragPlaceholder class="drag-placeholder animate-dash"></div>
                    </div>

                    <div *ngIf="availableItems.length === 0" class="empty-store">
                      <p>✨ أحسنت! انتهت العناصر!</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Drop Zones -->
              <div class="lg:col-span-8 lg:order-1">
                <div class="grid gap-5" [ngClass]="getZoneGridClass()">
                  <div *ngFor="let zone of zones"
                       class="zone-card glass-card overflow-hidden transition-all duration-300"
                       [style.borderColor]="zone.colorCode">
                    
                    <div class="zone-header p-4" [style.background]="zone.colorCode">
                      <h3 class="text-xl font-black text-center text-white">
                        {{ zone.label }}
                        <img *ngIf="zone.iconUrl" [src]="zone.iconUrl" class="w-6 h-6 inline-block mr-2"/>
                      </h3>
                    </div>

                    <div cdkDropList
                         [cdkDropListData]="zoneItems[zone.id]"
                         class="zone-content p-5 min-h-[200px] flex flex-col gap-3"
                         (cdkDropListDropped)="drop($event, zone.id)"
                         [id]="'zone-' + zone.id">
                      
                      <div *ngFor="let item of zoneItems[zone.id]"
                           cdkDrag
                           [cdkDragDisabled]="true" 
                           class="zone-item item-correct role-option">
                        <span class="text-lg font-bold">{{ item.text }}</span>
                        <span class="result-icon">✓</span>
                      </div>
                      
                      <div *ngIf="!zoneItems[zone.id]?.length" class="zone-empty">
                         <p>اسحب هنا</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Results Modal -->
            <div *ngIf="showResults" class="modal-overlay animate-fade-in">
              <div class="modal-content animate-bounce-in">
                <div class="result-icon-large">
                   {{ gameResult?.stars === 3 ? '🏆' : (gameResult?.stars === 2 ? '👏' : '👍') }}
                </div>
                <h3 class="result-title">{{ gameResult?.stars === 3 ? 'مذهل!' : 'عمل رائع!' }}</h3>
                <p class="result-subtitle">
                   النقاط: <strong class="text-cyan-400">{{ gameResult?.totalScore }}</strong> / {{ gameResult?.maxPossibleScore }}
                </p>
                
                <div class="flex justify-center gap-2 mb-6">
                    <span *ngFor="let s of [1,2,3]" class="text-3xl filter" [class.grayscale]="(gameResult?.stars || 0) < s">⭐</span>
                </div>

                <div class="modal-actions">
                  <button (click)="restartGame()" class="btn-secondary">إعادة اللعب 🔄</button>
                  <button (click)="goBack()" class="btn-primary">خروج ➡️</button>
                </div>
              </div>
            </div>

          </div>
      </div>
    </div>
  `,
  styleUrls: ['./drag-drop-game.component.css']
})
export class DragDropGameComponent implements OnInit {
  isLoading = true;
  session: GameSessionDto | null = null;

  availableItems: DragDropItemDto[] = [];
  zones: DragDropZoneDto[] = [];
  zoneItems: { [zoneId: number]: DragDropItemDto[] } = {};

  currentScore = 0;
  showResults = false;
  gameResult: GameResultDto | null = null;

  // UI State
  isMuted = false;
  highContrastMode = false;
  uiThemeClass = 'theme-modern';

  constructor(
    private gameService: DragDropGameService,
    private audioService: AudioService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const questionId = params['questionId'] ? +params['questionId'] : null;
      if (questionId) {
        this.startGame(questionId);
      } else {
        // Fallback to Grade 3 Science
        this.startGame(1);
      }
    });
  }

  startGame(questionId: number) {
    this.isLoading = true;
    const req: StartGameRequestDto = {
      questionId: questionId,
      grade: GradeLevel.Grade3,
      subject: SubjectType.Science
    };

    this.gameService.startSession(req).subscribe({
      next: (session) => {
        this.session = session;
        this.zones = session.zones;
        this.availableItems = session.items;
        this.currentScore = session.currentScore;

        this.zones.forEach(z => this.zoneItems[z.id] = []);

        if (session.completedItemIds && session.completedItemIds.length > 0) {
          const completed = this.availableItems.filter(i => session.completedItemIds.includes(i.id));
          this.availableItems = this.availableItems.filter(i => !session.completedItemIds.includes(i.id));

          completed.forEach(item => {
            if (this.zoneItems[item.correctZoneId]) {
              this.zoneItems[item.correctZoneId].push(item);
            }
          });
        }

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        Swal.fire('خطأ', 'تعذر بدء اللعبة', 'error').then(() => this.goBack());
      }
    });
  }

  drop(event: CdkDragDrop<DragDropItemDto[]>, zoneId: number) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      if (zoneId === -1) return;

      const item = event.previousContainer.data[event.previousIndex];

      this.gameService.submitAttempt({
        sessionId: this.session!.sessionId,
        itemId: item.id,
        droppedInZoneId: zoneId
      }).subscribe({
        next: (res) => {
          if (res.isCorrect) {
            this.audioService.play('correct');
            transferArrayItem(
              event.previousContainer.data,
              event.container.data,
              event.previousIndex,
              event.currentIndex,
            );
            this.currentScore = res.totalScore;

            if (res.isGameComplete) {
              this.completeGame();
            }
          } else {
            this.audioService.play('wrong');
            Swal.fire({
              icon: 'error',
              title: 'خطأ',
              text: res.message || 'حاول مرة أخرى!',
              timer: 1500,
              showConfirmButton: false
            });
          }
          this.cdr.markForCheck();
        }
      });
    }
  }

  completeGame() {
    this.gameService.completeGame(this.session!.sessionId).subscribe(res => {
      this.gameResult = res;
      this.showResults = true;
      this.audioService.play('victory');
      this.cdr.markForCheck();
    });
  }

  restartGame() {
    this.showResults = false;
    this.gameResult = null;
    this.startGame(this.session!.questionId);
  }

  goBack() {
    this.router.navigate(['/']);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
  }

  getZoneGridClass() {
    if (this.zones.length <= 2) return 'grid-cols-2';
    if (this.zones.length === 3) return 'grid-cols-3';
    return 'grid-cols-2';
  }
}
