import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
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

  // ─── Timer ───
  timerEnabled = false;
  timerSeconds = 0;
  timerTotal = 0;
  timerPercentage = 100;
  timerColor: 'green' | 'yellow' | 'red' = 'green';
  private timerInterval: any;

  // ─── Streak ───
  currentStreak = 0;
  bestStreak = 0;
  showStreakCelebration = false;
  private streakTimer: any;

  // ─── Toast ───
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  private toastTimer: any;

  // ─── Tutorial ───
  showTutorial = false;
  neverShowTutorial = false;

  // ─── Hints ───
  hintsRemaining = 3;
  hintItemId: number | null = null;
  hintZoneId: number | null = null;
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
  private streakMessages = [
    '🔥 سلسلة 3!', '🔥🔥 سلسلة 5!', '🔥🔥🔥 لا يُوقف! سلسلة 7!'
  ];

  // ─── Error counter (for auto-hint) ───
  private consecutiveErrors = 0;

  // ─── Undo ───
  canUndo = false;
  private lastMove: { item: DragDropItemDto; zoneId: number } | null = null;

  // ─── Explanation ───
  showExplanation = false;
  explanationText = '';
  private explanationTimer: any;

  // ─── Keyboard Navigation ───
  focusedItemIndex = -1;
  focusedZoneIndex = -1;

  // ─── Zone expected counts ───
  zoneExpectedCounts: { [zoneId: number]: number } = {};



  // ─── Orientation & Multi-touch ───
  private orientationHandler: (() => void) | null = null;
  private multiTouchHandler: ((e: TouchEvent) => void) | null = null;

  // ─── Audio item playback ───
  private audioPlayer: HTMLAudioElement | null = null;
  playingAudioItemId: number | null = null;

  // ─── Subscription cleanup ───
  private queryParamsSub: Subscription | null = null;

  @ViewChild('mobileZonesScroll') mobileZonesScroll!: ElementRef;
  @ViewChild('gameContainer', { static: false }) gameContainerRef!: ElementRef;

  // ─── CDK Drop List Connection IDs ───
  // Desktop lists
  get desktopStoreConnections(): string[] {
    return this.zones.map(z => 'zone-' + z.id);
  }
  getDesktopZoneConnections(zoneId: number): string[] {
    return ['store-list', ...this.zones.filter(z => z.id !== zoneId).map(z => 'zone-' + z.id)];
  }
  // Mobile lists
  get mobileStoreConnections(): string[] {
    return this.zones.map(z => 'mobile-zone-' + z.id);
  }
  getMobileZoneConnections(zoneId: number): string[] {
    return ['mobile-store-list', ...this.zones.filter(z => z.id !== zoneId).map(z => 'mobile-zone-' + z.id)];
  }

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

    this.queryParamsSub = this.route.queryParams.subscribe(params => {
      const questionId = params['questionId'] ? +params['questionId'] : null;
      this.startGame(questionId);
    });
  }

  ngAfterViewInit(): void {
    if (this.gameContainerRef?.nativeElement) {
      const container = this.gameContainerRef.nativeElement;
      container.addEventListener('gesturestart', (e: Event) => e.preventDefault());
      container.addEventListener('gesturechange', (e: Event) => e.preventDefault());
    }

    this.multiTouchHandler = (e: TouchEvent) => {
      if (this.isDragging && e.touches.length > 1) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchstart', this.multiTouchHandler, { passive: false });

    this.orientationHandler = () => {
      if (window.innerWidth < 768) {
        const isLandscape = window.innerWidth > window.innerHeight;
        if (isLandscape) {
          this.displayToast('📱 اللعب في الوضع الرأسي أسهل', 'info');
        }
      }
    };
    window.addEventListener('orientationchange', this.orientationHandler);
    window.addEventListener('resize', this.orientationHandler);
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.queryParamsSub?.unsubscribe();
    if (this.multiTouchHandler) document.removeEventListener('touchstart', this.multiTouchHandler);
    if (this.orientationHandler) {
      window.removeEventListener('orientationchange', this.orientationHandler);
      window.removeEventListener('resize', this.orientationHandler);
    }
    clearTimeout(this.toastTimer);
    clearTimeout(this.hintTimer);
    clearTimeout(this.shakeTimer);
    clearTimeout(this.streakTimer);
    clearTimeout(this.explanationTimer);
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.audioPlayer = null;
    }
  }

  // ═══════════════════════════════════════════
  // GAME LIFECYCLE
  // ═══════════════════════════════════════════

  startGame(questionId: number | null) {
    this.isLoading = true;
    this.resetGameState();

    const gradeId = getSelectedGrade() as GradeLevel;
    const subjectId = getSelectedSubject() as SubjectType;

    const req: StartGameRequestDto = {
      questionId: questionId ?? undefined,
      grade: gradeId,
      subject: subjectId
    };

    this.gameService.startSession(req).subscribe({
      next: (session) => this.initializeSession(session),
      error: (err) => {
        console.error(err);
        this.displayToast('تعذر بدء اللعبة - لا توجد أسئلة متاحة', 'error');
        this.isLoading = false;
        this.cdr.markForCheck();
        setTimeout(() => this.goBack(), 2500);
      }
    });
  }

  private resetGameState(): void {
    this.selectedItem = null;
    this.showResults = false;
    this.isDragging = false;
    this.gameResult = null;
    this.consecutiveErrors = 0;
    this.hintsRemaining = 3;
    this.currentStreak = 0;
    this.bestStreak = 0;
    this.canUndo = false;
    this.lastMove = null;
    this.showExplanation = false;
    this.focusedItemIndex = -1;
    this.focusedZoneIndex = -1;
    this.playingAudioItemId = null;
    // Timer full reset
    this.timerEnabled = false;
    this.timerSeconds = 0;
    this.timerTotal = 0;
    this.timerPercentage = 100;
    this.timerColor = 'green';
    this.clearHint();
    this.stopTimer();
  }

  private initializeSession(session: GameSessionDto): void {
    this.session = session;
    this.zones = session.zones;
    this.availableItems = [...session.items];
    this.currentScore = session.currentScore;
    this.totalItemsCount = session.items.length;
    this.placedItemsCount = 0;

    // Initialize zone items and expected counts
    this.zones.forEach(z => {
      this.zoneItems[z.id] = [];
      this.zoneExpectedCounts[z.id] = session.items.filter(i => i.correctZoneId === z.id).length;
    });

    // Restore completed items
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

    // Start timer if timeLimit is set
    if (session.timeLimit && session.timeLimit > 0) {
      this.timerEnabled = true;
      this.timerTotal = session.timeLimit;
      this.timerSeconds = session.timeLimit - (session.timeElapsedSeconds || 0);
      this.startTimer();
    }

    this.isLoading = false;

    if (!localStorage.getItem('dd_tutorial_shown')) {
      this.showTutorial = true;
    }

    this.cdr.markForCheck();
  }

  completeGame() {
    this.stopTimer();
    this.gameService.completeGame(this.session!.sessionId).subscribe({
      next: (res) => {
        this.gameResult = res;
        this.showResults = true;
        this.generateConfetti();
        this.audioService.play('complete');
        this.vibrate([100, 80, 100, 80, 100]);
        this.cdr.markForCheck();
      },
      error: () => {
        this.displayToast('تعذر حفظ النتيجة - تحقق من الاتصال', 'error');
      }
    });
  }

  restartGame() {
    this.showResults = false;
    this.gameResult = null;
    this.confettiPieces = [];
    const qId = this.session?.questionId ?? null;
    this.startGame(qId);
  }

  goBack() {
    this.router.navigate(['/game-type']);
  }

  // ═══════════════════════════════════════════
  // TIMER
  // ═══════════════════════════════════════════

  private startTimer(): void {
    this.updateTimerColor();
    this.timerInterval = setInterval(() => {
      this.timerSeconds--;
      this.timerPercentage = (this.timerSeconds / this.timerTotal) * 100;
      this.updateTimerColor();

      if (this.timerSeconds <= 0) {
        this.stopTimer();
        this.completeGame();
      }
      this.cdr.markForCheck();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private updateTimerColor(): void {
    const pct = this.timerPercentage;
    if (pct > 50) this.timerColor = 'green';
    else if (pct > 20) this.timerColor = 'yellow';
    else this.timerColor = 'red';
  }

  formatTimer(seconds: number): string {
    const m = Math.floor(Math.max(0, seconds) / 60);
    const s = Math.max(0, seconds) % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // ═══════════════════════════════════════════
  // DRAG & DROP HANDLER
  // ═══════════════════════════════════════════

  onDragStarted(event: CdkDragStart): void {
    this.isDragging = true;
    this.selectedItem = null;
    this.audioService.play('click');
    this.vibrate([40]);

    if (this.isMobile) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    }
    this.cdr.markForCheck();
  }

  onDragEnded(event: CdkDragEnd): void {
    this.isDragging = false;
    if (this.isMobile) {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    this.cdr.markForCheck();
  }

  drop(event: CdkDragDrop<DragDropItemDto[]>, zoneId: number) {
    this.isDragging = false;
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
    const target = event.target as HTMLElement;
    if (!target.closest('.item-card, .mobile-item-card, .zone-card, .mobile-zone-card, .zone-content, .mobile-zone-content')) {
      if (this.selectedItem) this.deselectItem();
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
            setTimeout(() => this.completeGame(), 800);
          }
        } else {
          this.handleWrongDrop(item, res.message);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Submit attempt failed:', err);
        this.displayToast('خطأ في الاتصال - حاول مرة أخرى 📶', 'error');
        // Return item to store if it was moved by CDK
        if (cdkEvent) {
          transferArrayItem(
            cdkEvent.container.data,
            cdkEvent.previousContainer.data,
            cdkEvent.currentIndex,
            cdkEvent.previousIndex,
          );
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
      const idx = this.availableItems.findIndex(i => i.id === item.id);
      if (idx > -1) {
        this.availableItems.splice(idx, 1);
        this.zoneItems[zoneId].push(item);
      }
    }

    this.placedItemsCount++;
    this.selectedItem = null;

    // Save for undo
    this.lastMove = { item, zoneId };
    this.canUndo = true;

    // Streak
    this.currentStreak++;
    if (this.currentStreak > this.bestStreak) this.bestStreak = this.currentStreak;

    // Sound with pitch variety
    this.playCorrectSound();
    this.vibrate([80, 50, 40]);

    // Toast
    const msg = this.correctMessages[Math.floor(Math.random() * this.correctMessages.length)];
    this.displayToast(msg, 'success');

    // Streak celebration at milestones
    if (this.currentStreak === 3 || this.currentStreak === 5 || this.currentStreak === 7) {
      this.triggerStreakCelebration();
    }

    // Show explanation if available
    if (item.explanation) {
      this.showItemExplanation(item.explanation);
    }
  }

  private handleWrongDrop(item: DragDropItemDto, serverMessage?: string): void {
    this.consecutiveErrors++;
    this.currentStreak = 0;
    this.selectedItem = null;
    this.canUndo = false;

    this.audioService.play('wrong');
    this.vibrate([50, 30, 50]);

    // Shake animation
    this.shakeItemId = item.id;
    clearTimeout(this.shakeTimer);
    this.shakeTimer = setTimeout(() => {
      this.shakeItemId = null;
      this.cdr.markForCheck();
    }, 600);

    const msg = this.wrongMessages[Math.floor(Math.random() * this.wrongMessages.length)];
    this.displayToast(msg, 'error');

    // Auto-hint after 3 consecutive errors
    if (this.consecutiveErrors >= 3 && this.hintsRemaining > 0) {
      setTimeout(() => this.useHint(), 1000);
    }
  }

  // ═══════════════════════════════════════════
  // UNDO LAST MOVE
  // ═══════════════════════════════════════════

  undoLastMove(): void {
    if (!this.canUndo || !this.lastMove) return;

    const { item, zoneId } = this.lastMove;
    const zoneArr = this.zoneItems[zoneId];
    const idx = zoneArr.findIndex(i => i.id === item.id);
    if (idx > -1) {
      zoneArr.splice(idx, 1);
      this.availableItems.unshift(item);
      this.placedItemsCount--;
      this.currentStreak = 0;
    }

    this.canUndo = false;
    this.lastMove = null;
    this.displayToast('↩️ تم التراجع', 'info');
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════
  // STREAK
  // ═══════════════════════════════════════════

  private triggerStreakCelebration(): void {
    this.showStreakCelebration = true;
    this.vibrate([60, 40, 60, 40, 60]);

    let idx = 0;
    if (this.currentStreak >= 7) idx = 2;
    else if (this.currentStreak >= 5) idx = 1;
    this.displayToast(this.streakMessages[idx], 'success');

    clearTimeout(this.streakTimer);
    this.streakTimer = setTimeout(() => {
      this.showStreakCelebration = false;
      this.cdr.markForCheck();
    }, 1500);
  }

  // ═══════════════════════════════════════════
  // SOUND WITH PITCH VARIETY
  // ═══════════════════════════════════════════

  private playCorrectSound(): void {
    this.audioService.play('correct');
  }

  // ═══════════════════════════════════════════
  // ITEM AUDIO PLAYBACK
  // ═══════════════════════════════════════════

  playItemAudio(item: DragDropItemDto, event: Event): void {
    event.stopPropagation();
    if (!item.audioUrl) return;

    if (this.playingAudioItemId === item.id) {
      this.stopItemAudio();
      return;
    }

    this.stopItemAudio();
    this.playingAudioItemId = item.id;
    this.audioPlayer = new Audio(item.audioUrl);
    this.audioPlayer.onended = () => {
      this.playingAudioItemId = null;
      this.cdr.markForCheck();
    };
    this.audioPlayer.onerror = () => {
      this.playingAudioItemId = null;
      this.displayToast('تعذر تشغيل الصوت', 'error');
      this.cdr.markForCheck();
    };
    this.audioPlayer.play().catch(() => {
      this.playingAudioItemId = null;
      this.cdr.markForCheck();
    });
    this.cdr.markForCheck();
  }

  private stopItemAudio(): void {
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.audioPlayer.currentTime = 0;
      this.audioPlayer = null;
    }
    this.playingAudioItemId = null;
  }

  // ═══════════════════════════════════════════
  // EXPLANATION
  // ═══════════════════════════════════════════

  private showItemExplanation(text: string): void {
    this.explanationText = text;
    this.showExplanation = true;
    this.cdr.markForCheck();

    clearTimeout(this.explanationTimer);
    this.explanationTimer = setTimeout(() => {
      this.showExplanation = false;
      this.cdr.markForCheck();
    }, 4000);
  }

  dismissExplanation(): void {
    this.showExplanation = false;
    clearTimeout(this.explanationTimer);
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════
  // TOAST NOTIFICATIONS
  // ═══════════════════════════════════════════

  private displayToast(message: string, type: 'success' | 'error' | 'info'): void {
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

    this.hintItemId = item.id;
    this.hintZoneId = item.correctZoneId;
    this.vibrate([30]);

    if (this.isMobile) {
      const zoneIdx = this.zones.findIndex(z => z.id === item.correctZoneId);
      if (zoneIdx > -1) this.scrollToZone(zoneIdx);
    }

    this.cdr.markForCheck();
    clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => this.clearHint(), 3000);
  }

  private clearHint(): void {
    this.hintItemId = null;
    this.hintZoneId = null;
    clearTimeout(this.hintTimer);
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════
  // SHUFFLE
  // ═══════════════════════════════════════════

  shuffleItems(): void {
    if (this.availableItems.length <= 1) return;

    for (let i = this.availableItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.availableItems[i], this.availableItems[j]] = [this.availableItems[j], this.availableItems[i]];
    }

    this.audioService.play('click');
    this.vibrate([30]);
    this.displayToast('🔀 تم خلط البطاقات', 'info');
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
      scrollEl.scrollTo({ left: index * (zoneWidth + 8), behavior: 'smooth' });
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
  // KEYBOARD NAVIGATION
  // ═══════════════════════════════════════════

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.showResults || this.showTutorial || this.isLoading) return;

    // Don't handle shortcuts when typing in an input
    const tag = (event.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedItemIndex = Math.min(this.focusedItemIndex + 1, this.availableItems.length - 1);
        this.focusedZoneIndex = -1;
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusedItemIndex = Math.max(this.focusedItemIndex - 1, 0);
        this.focusedZoneIndex = -1;
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (this.selectedItem) {
          this.focusedZoneIndex = Math.max(this.focusedZoneIndex - 1, 0);
          this.focusedItemIndex = -1;
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (this.selectedItem) {
          this.focusedZoneIndex = Math.min(this.focusedZoneIndex + 1, this.zones.length - 1);
          this.focusedItemIndex = -1;
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.focusedItemIndex >= 0 && this.focusedItemIndex < this.availableItems.length) {
          this.onItemTap(this.availableItems[this.focusedItemIndex]);
        } else if (this.focusedZoneIndex >= 0 && this.focusedZoneIndex < this.zones.length && this.selectedItem) {
          this.onZoneTap(this.zones[this.focusedZoneIndex].id);
        }
        break;
      case 'Escape':
        this.deselectItem();
        this.focusedItemIndex = -1;
        this.focusedZoneIndex = -1;
        break;
      case 'h':
        this.useHint();
        break;
      case 'z':
        if (event.ctrlKey) this.undoLastMove();
        break;
    }
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════
  // UTILITY / UI METHODS
  // ═══════════════════════════════════════════

  toggleMute(): void {
    this.isMuted = !this.isMuted;
    this.audioService.setMuted(this.isMuted);
    localStorage.setItem('dd_muted', String(this.isMuted));
  }

  toggleInputMode(): void {
    this.inputMode = this.inputMode === 'tap' ? 'drag' : 'tap';
    this.selectedItem = null;
    localStorage.setItem('dd_input_mode', this.inputMode);
    this.displayToast(
      this.inputMode === 'tap' ? '👆 وضع الضغط — اضغط البطاقة ثم المنطقة' : '✋ وضع السحب — اسحب البطاقة إلى المنطقة',
      'info'
    );
    this.cdr.markForCheck();
  }

  getZoneGridClass(): string {
    if (this.zones.length <= 1) return 'grid-cols-1';
    if (this.zones.length === 2) return 'grid-cols-2';
    if (this.zones.length === 3) return 'grid-cols-3';
    return 'grid-cols-2';
  }

  getZonePlacedCount(zoneId: number): number {
    return this.zoneItems[zoneId]?.length || 0;
  }

  getZoneExpectedCount(zoneId: number): number {
    return this.zoneExpectedCounts[zoneId] || 0;
  }

  getZoneNumber(zoneId: number): number {
    return this.zones.findIndex(z => z.id === zoneId) + 1;
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

  getAccuracyPercentage(): number {
    if (!this.gameResult) return 0;
    const total = this.gameResult.correctPlacements + this.gameResult.wrongPlacements;
    return total > 0 ? Math.round((this.gameResult.correctPlacements / total) * 100) : 0;
  }

  // ═══════════════════════════════════════════
  // HAPTIC FEEDBACK
  // ═══════════════════════════════════════════

  private vibrate(pattern: number[]): void {
    if (this.isMuted) return;
    try {
      if ('vibrate' in navigator) navigator.vibrate(pattern);
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
    // Width-only check — don't flag touchscreen laptops as mobile
    this.isMobile = window.innerWidth < 1024;
    if (this.isMobile) this.inputMode = 'tap';
  }

  private loadPreferences(): void {
    const savedMode = localStorage.getItem('dd_input_mode');
    if (savedMode === 'drag' || savedMode === 'tap') this.inputMode = savedMode;
    const mutedPref = localStorage.getItem('dd_muted');
    if (mutedPref === 'true') {
      this.isMuted = true;
      this.audioService.setMuted(true);
    }
  }
}
