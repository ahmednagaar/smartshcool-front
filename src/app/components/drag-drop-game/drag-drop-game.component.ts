import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AudioService } from '../../services/audio.service';
import { DragDropModule, CdkDragDrop, CdkDragStart, CdkDragEnd, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { DragDropGameService, StartGameRequestDto, GameSessionDto, GameResultDto } from '../../services/drag-drop-game.service';
import { DragDropZoneDto, DragDropItemDto, GradeLevel, SubjectType } from '../../models/drag-drop.model';
import { getSelectedGrade, getSelectedSubject } from '../../models/shared-enums';

@Component({
  selector: 'app-drag-drop-game',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './drag-drop-game.component.html',
  styleUrls: ['./drag-drop-game.component.css']
})
export class DragDropGameComponent implements OnInit, AfterViewInit, OnDestroy {
  // ─── Core Game State ───
  isLoading = true;
  session: GameSessionDto | null = null;
  availableItems: DragDropItemDto[] = [];
  zones: DragDropZoneDto[] = [];
  zoneItems: { [zoneId: number]: DragDropItemDto[] } = {};
  currentScore = 0;
  showResults = false;
  gameResult: GameResultDto | null = null;

  // ─── UI State ───
  isMuted = false;
  highContrastMode = false;
  uiThemeClass = 'theme-modern';

  // ─── Mobile / Input Mode ───
  isMobile = false;
  inputMode: 'drag' | 'tap' = 'drag';
  selectedItem: DragDropItemDto | null = null;
  isDragging = false;
  activeZoneIndex = 0;

  // ─── Progress ───
  totalItemsCount = 0;
  placedItemsCount = 0;
  get progressPercentage(): number {
    return this.totalItemsCount > 0 ? (this.placedItemsCount / this.totalItemsCount) * 100 : 0;
  }

  // ─── Toast ───
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  // ─── Tutorial ───
  showTutorial = false;
  neverShowTutorial = false;

  // ─── Hints ───
  hintsRemaining = 3;
  hintItemId: number | null = null;
  hintZoneId: number | null = null;
  showHintLine = false;
  private hintTimer: any;

  // ─── Shake Animation ───
  shakeItemId: number | null = null;
  private shakeTimer: any;

  // ─── Confetti ───
  confettiPieces: { x: number; delay: number; color: string }[] = [];
  private readonly confettiColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FFD93D', '#6C5CE7', '#A29BFE'];

  // ─── Encouraging Messages ───
  private correctMessages = [
    'رائع! 🎉', 'أحسنت! ⭐', 'ممتاز! استمر 💪', 'مذهل! ✨', 'صح! 🌟'
  ];
  private wrongMessages = [
    'حاول مرة أخرى! أنت قريب جداً 💪',
    'لا بأس! الجميع يخطئ 😊',
    'فكر قليلاً وحاول مرة أخرى 🤔',
    'تقريباً! جرب منطقة أخرى 🎯',
    'لا تقلق، حاول مجدداً! 🌈'
  ];

  // ─── Error counter (for auto-hint) ───
  private consecutiveErrors = 0;

  // ─── Orientation ───
  private orientationHandler: (() => void) | null = null;
  private multiTouchHandler: ((e: TouchEvent) => void) | null = null;

  @ViewChild('mobileZonesScroll') mobileZonesScroll!: ElementRef;

  constructor(
    private gameService: DragDropGameService,
    private audioService: AudioService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.detectMobile();
    this.loadPreferences();

    this.route.queryParams.subscribe(params => {
      const questionId = params['questionId'] ? +params['questionId'] : null;
      this.startGame(questionId);
    });
  }

  ngAfterViewInit(): void {
    // Prevent pinch zoom on game container
    const container = document.querySelector('.game-container');
    if (container) {
      container.addEventListener('gesturestart', (e) => e.preventDefault());
      container.addEventListener('gesturechange', (e) => e.preventDefault());
    }

    // Multi-touch prevention: ignore second finger during drag
    this.multiTouchHandler = (e: TouchEvent) => {
      if (this.isDragging && e.touches.length > 1) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchstart', this.multiTouchHandler, { passive: false });

    // Orientation change guidance
    this.orientationHandler = () => {
      if (window.innerWidth < 768) {
        const isLandscape = window.innerWidth > window.innerHeight;
        if (isLandscape) {
          this.displayToast('📱 اللعب في الوضع الرأسي أسهل', 'success');
        }
      }
    };
    window.addEventListener('orientationchange', this.orientationHandler);
    window.addEventListener('resize', this.orientationHandler);
  }

  ngOnDestroy(): void {
    if (this.multiTouchHandler) {
      document.removeEventListener('touchstart', this.multiTouchHandler);
    }
    if (this.orientationHandler) {
      window.removeEventListener('orientationchange', this.orientationHandler);
      window.removeEventListener('resize', this.orientationHandler);
    }
    clearTimeout(this.toastTimer);
    clearTimeout(this.hintTimer);
    clearTimeout(this.shakeTimer);
  }

  // ═══════════════════════════════════════════
  // GAME LIFECYCLE
  // ═══════════════════════════════════════════

  startGame(questionId: number | null) {
    this.isLoading = true;
    this.selectedItem = null;
    this.showResults = false;
    this.gameResult = null;
    this.consecutiveErrors = 0;
    this.hintsRemaining = 3;
    this.clearHint();

    const gradeId = getSelectedGrade() as GradeLevel;
    const subjectId = getSelectedSubject() as SubjectType;

    const req: StartGameRequestDto = {
      questionId: questionId ?? undefined,
      grade: gradeId,
      subject: subjectId
    };

    this.gameService.startSession(req).subscribe({
      next: (session) => {
        this.session = session;
        this.zones = session.zones;
        this.availableItems = session.items;
        this.currentScore = session.currentScore;
        this.totalItemsCount = session.items.length;
        this.placedItemsCount = 0;

        this.zones.forEach(z => this.zoneItems[z.id] = []);

        if (session.completedItemIds && session.completedItemIds.length > 0) {
          const completed = this.availableItems.filter(i => session.completedItemIds.includes(i.id));
          this.availableItems = this.availableItems.filter(i => !session.completedItemIds.includes(i.id));

          completed.forEach(item => {
            if (this.zoneItems[item.correctZoneId]) {
              this.zoneItems[item.correctZoneId].push(item);
            }
          });
          this.placedItemsCount = completed.length;
        }

        this.isLoading = false;

        // Show tutorial on first play
        if (!localStorage.getItem('dd_tutorial_shown')) {
          this.showTutorial = true;
        }

        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.displayToast('تعذر بدء اللعبة - لا توجد أسئلة متاحة', 'error');
        setTimeout(() => this.goBack(), 2000);
      }
    });
  }

  completeGame() {
    this.gameService.completeGame(this.session!.sessionId).subscribe(res => {
      this.gameResult = res;
      this.showResults = true;
      this.generateConfetti();
      this.audioService.play('complete');
      this.vibrate([100, 80, 100, 80, 100]);
      this.cdr.markForCheck();
    });
  }

  restartGame() {
    this.showResults = false;
    this.gameResult = null;
    this.confettiPieces = [];
    this.startGame(this.session!.questionId);
  }

  goBack() {
    this.router.navigate(['/game-type']);
  }

  // ═══════════════════════════════════════════
  // DRAG & DROP HANDLER
  // ═══════════════════════════════════════════

  onDragStarted(event: CdkDragStart): void {
    this.isDragging = true;
    this.selectedItem = null; // cancel any tap selection
    this.audioService.play('click');
    this.vibrate([40]);

    // Lock page scroll on mobile during drag
    if (this.isMobile) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    }
    this.cdr.markForCheck();
  }

  onDragEnded(event: CdkDragEnd): void {
    this.isDragging = false;

    // Unlock page scroll
    if (this.isMobile) {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    this.cdr.markForCheck();
  }

  drop(event: CdkDragDrop<DragDropItemDto[]>, zoneId: number) {
    this.isDragging = false;

    // Unlock scroll
    if (this.isMobile) {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    if (zoneId === -1) return;

    const item = event.previousContainer.data[event.previousIndex];
    this.submitPlacement(item, zoneId, event);
  }

  // ═══════════════════════════════════════════
  // TAP-TO-PLACE
  // ═══════════════════════════════════════════

  onItemTap(item: DragDropItemDto): void {
    if (this.isDragging) return;

    if (this.selectedItem?.id === item.id) {
      this.deselectItem();
      return;
    }

    this.selectedItem = item;
    this.vibrate([40]);
    this.audioService.play('click');
    this.cdr.markForCheck();
  }

  onZoneTap(zoneId: number): void {
    if (!this.selectedItem || this.isDragging) return;

    const item = this.selectedItem;
    this.submitPlacement(item, zoneId, null);
  }

  deselectItem(): void {
    this.selectedItem = null;
    this.cdr.markForCheck();
  }

  onContainerTouch(event: TouchEvent): void {
    // If tapping on empty space (not an item or zone), deselect
    const target = event.target as HTMLElement;
    if (!target.closest('.item-card, .mobile-item-card, .zone-card, .mobile-zone-card, .zone-content, .mobile-zone-content')) {
      if (this.selectedItem) {
        this.deselectItem();
      }
    }
  }

  // ═══════════════════════════════════════════
  // UNIFIED PLACEMENT HANDLER
  // ═══════════════════════════════════════════

  private submitPlacement(item: DragDropItemDto, zoneId: number, cdkEvent: CdkDragDrop<DragDropItemDto[]> | null): void {
    this.clearHint();

    this.gameService.submitAttempt({
      sessionId: this.session!.sessionId,
      itemId: item.id,
      droppedInZoneId: zoneId
    }).subscribe({
      next: (res) => {
        if (res.isCorrect) {
          this.handleCorrectDrop(item, zoneId, cdkEvent);
          this.currentScore = res.totalScore;
          this.consecutiveErrors = 0;

          if (res.isGameComplete) {
            this.completeGame();
          }
        } else {
          this.handleWrongDrop(item, res.message);
        }
        this.cdr.markForCheck();
      }
    });
  }

  private handleCorrectDrop(item: DragDropItemDto, zoneId: number, cdkEvent: CdkDragDrop<DragDropItemDto[]> | null): void {
    // Move item to zone
    if (cdkEvent) {
      transferArrayItem(
        cdkEvent.previousContainer.data,
        cdkEvent.container.data,
        cdkEvent.previousIndex,
        cdkEvent.currentIndex,
      );
    } else {
      // Tap mode: manually move
      const idx = this.availableItems.findIndex(i => i.id === item.id);
      if (idx > -1) {
        this.availableItems.splice(idx, 1);
        this.zoneItems[zoneId].push(item);
      }
    }

    this.placedItemsCount++;
    this.selectedItem = null;

    // Feedback
    this.audioService.play('correct');
    this.vibrate([80, 50, 40]);
    const msg = this.correctMessages[Math.floor(Math.random() * this.correctMessages.length)];
    this.displayToast(msg, 'success');
  }

  private handleWrongDrop(item: DragDropItemDto, serverMessage?: string): void {
    this.consecutiveErrors++;
    this.selectedItem = null;

    // Audio + haptic
    this.audioService.play('wrong');
    this.vibrate([50, 30, 50]);

    // Shake animation
    this.shakeItemId = item.id;
    clearTimeout(this.shakeTimer);
    this.shakeTimer = setTimeout(() => {
      this.shakeItemId = null;
      this.cdr.markForCheck();
    }, 600);

    // Toast message (not a blocking modal!)
    const msg = this.wrongMessages[Math.floor(Math.random() * this.wrongMessages.length)];
    this.displayToast(msg, 'error');

    // Auto-hint after 3 consecutive errors
    if (this.consecutiveErrors >= 3 && this.hintsRemaining > 0) {
      setTimeout(() => this.useHint(), 1000);
    }
  }

  // ═══════════════════════════════════════════
  // TOAST NOTIFICATIONS
  // ═══════════════════════════════════════════

  private displayToast(message: string, type: 'success' | 'error'): void {
    clearTimeout(this.toastTimer);
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.cdr.markForCheck();

    this.toastTimer = setTimeout(() => {
      this.showToast = false;
      this.cdr.markForCheck();
    }, 2000);
  }

  // ═══════════════════════════════════════════
  // HINTS
  // ═══════════════════════════════════════════

  useHint(): void {
    if (this.hintsRemaining <= 0 || this.availableItems.length === 0) return;

    this.hintsRemaining--;
    const item = this.availableItems[0];

    // Highlight item and its correct zone
    this.hintItemId = item.id;
    this.hintZoneId = item.correctZoneId;
    this.showHintLine = true;
    this.vibrate([30]);

    // Scroll to the correct zone on mobile
    if (this.isMobile) {
      const zoneIdx = this.zones.findIndex(z => z.id === item.correctZoneId);
      if (zoneIdx > -1) {
        this.scrollToZone(zoneIdx);
      }
    }

    this.cdr.markForCheck();

    // Clear hint after 3 seconds
    clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => this.clearHint(), 3000);
  }

  private clearHint(): void {
    this.hintItemId = null;
    this.hintZoneId = null;
    this.showHintLine = false;
    clearTimeout(this.hintTimer);
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════
  // TUTORIAL
  // ═══════════════════════════════════════════

  dismissTutorial(): void {
    this.showTutorial = false;
    if (this.neverShowTutorial) {
      localStorage.setItem('dd_tutorial_shown', 'true');
    }
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════
  // MOBILE ZONE SCROLL
  // ═══════════════════════════════════════════

  scrollToZone(index: number): void {
    this.activeZoneIndex = index;
    if (this.mobileZonesScroll?.nativeElement) {
      const scrollEl = this.mobileZonesScroll.nativeElement as HTMLElement;
      const zoneWidth = scrollEl.firstElementChild?.clientWidth || scrollEl.clientWidth;
      scrollEl.scrollTo({
        left: index * (zoneWidth + 8),
        behavior: 'smooth'
      });
    }
    this.cdr.markForCheck();
  }

  onZoneScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const zoneWidth = el.firstElementChild?.clientWidth || el.clientWidth;
    if (zoneWidth > 0) {
      this.activeZoneIndex = Math.round(el.scrollLeft / (zoneWidth + 8));
      this.cdr.markForCheck();
    }
  }

  // ═══════════════════════════════════════════
  // UTILITY / UI METHODS
  // ═══════════════════════════════════════════

  toggleMute(): void {
    this.isMuted = !this.isMuted;
    this.audioService.setMuted(this.isMuted);
  }

  toggleInputMode(): void {
    this.inputMode = this.inputMode === 'tap' ? 'drag' : 'tap';
    this.selectedItem = null;
    localStorage.setItem('dd_input_mode', this.inputMode);
    this.displayToast(
      this.inputMode === 'tap' ? '👆 وضع الضغط — اضغط البطاقة ثم المنطقة' : '✋ وضع السحب — اسحب البطاقة إلى المنطقة',
      'success'
    );
    this.cdr.markForCheck();
  }

  getZoneGridClass(): string {
    if (this.zones.length <= 2) return 'grid-cols-2';
    if (this.zones.length === 3) return 'grid-cols-3';
    return 'grid-cols-2';
  }

  getCompletionMessage(): string {
    if (!this.gameResult) return 'أحسنت!';
    if (this.gameResult.stars === 3) return 'مذهل! أكملت اللعبة بنجاح! 🏆';
    if (this.gameResult.stars === 2) return 'رائع! أكملت اللعبة! 🌟';
    return 'أحسنت! أكملت اللعبة! 👍';
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s} ثانية`;
    if (m === 1) return `دقيقة و ${s} ثانية`;
    return `${m} دقائق و ${s} ثانية`;
  }

  // ═══════════════════════════════════════════
  // HAPTIC FEEDBACK
  // ═══════════════════════════════════════════

  private vibrate(pattern: number[]): void {
    if (this.isMuted) return;
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch { /* no vibration support */ }
  }

  // ═══════════════════════════════════════════
  // CONFETTI
  // ═══════════════════════════════════════════

  private generateConfetti(): void {
    this.confettiPieces = Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      delay: Math.random() * 1.5,
      color: this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)]
    }));
  }

  // ═══════════════════════════════════════════
  // MOBILE DETECTION & PREFERENCES
  // ═══════════════════════════════════════════

  private detectMobile(): void {
    this.isMobile = window.innerWidth < 1024 || 'ontouchstart' in window;
    if (this.isMobile) {
      this.inputMode = 'tap'; // Default to tap mode on mobile
    }
  }

  private loadPreferences(): void {
    const savedMode = localStorage.getItem('dd_input_mode');
    if (savedMode === 'drag' || savedMode === 'tap') {
      this.inputMode = savedMode;
    }
  }
}
