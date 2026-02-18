import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { FlipCardGameService } from '../../services/flip-card-game.service';
import {
  StartFlipCardGameDto,
  GameStartResponseDto,
  GameCardDto,
  FlipCardGameMode,
  FlipCardContentType,
  FlipCardTimerMode
} from '../../models/flip-card.model';
import { getStudentId, getSelectedGrade, getSelectedSubject } from '../../models/shared-enums';

interface CardViewModel extends GameCardDto {
  isFlipped: boolean;
  isMatched: boolean;
  shake: boolean;
  celebrate: boolean;
  displayContent: string;
  isPlayingAudio?: boolean;
  isHinted?: boolean;
}

@Component({
  selector: 'app-flip-cards-game',
  standalone: true,
  imports: [CommonModule, DragDropModule, RouterModule],
  templateUrl: './flip-cards-game.component.html',
  styleUrls: ['./flip-cards-game.component.css']
})
export class FlipCardsGameComponent implements OnInit, OnDestroy {
  // Game Data
  gameData: GameStartResponseDto | null = null;
  cards: CardViewModel[] = [];
  leftCards: CardViewModel[] = [];
  rightCards: CardViewModel[] = [];

  // State
  isLoading = true;
  gameLoadError = '';
  hasNoQuestions = false;
  gameState: 'start' | 'playing' | 'complete' = 'start';
  currentFlipped: CardViewModel[] = [];
  isProcessing = false;
  isCalculatingResult = false;

  // Stats
  matchedPairs = 0;
  totalPairs = 0;
  moves = 0;
  score = 0;
  timerSeconds = 0;
  timeLeft = 0;
  timerInterval: any;
  stars = 0;

  // Phase 2: Hint system
  hintsUsed = 0;
  maxHints = 3;
  showHints = false;
  isHinting = false;

  // Phase 2: Sound effects
  private soundEffects: { [key: string]: HTMLAudioElement } = {};
  soundEnabled = true;

  // Phase 2: Confetti
  showConfetti = false;
  confettiPieces: { left: number; delay: number; color: string; rotation: number }[] = [];

  // Phase 2: Streak tracking
  streak = 0;
  bestStreak = 0;
  showStreakBadge = false;

  // Phase 2: Instructions
  showInstructions = true;

  // Phase 2: Achievements from API
  achievements: string[] = [];

  // Phase 3: Difficulty level badge
  get difficultyLabel(): string {
    const level = this.gameData?.question?.numberOfPairs || 0;
    if (level <= 5) return 'سهل';
    if (level <= 8) return 'متوسط';
    return 'صعب';
  }
  get difficultyStars(): number {
    const level = this.gameData?.question?.numberOfPairs || 0;
    if (level <= 5) return 1;
    if (level <= 8) return 2;
    return 3;
  }
  get difficultyColor(): string {
    const level = this.gameData?.question?.numberOfPairs || 0;
    if (level <= 5) return '#00FF88';
    if (level <= 8) return '#FFD700';
    return '#FF6B6B';
  }

  // Phase 3: Card preview before game
  isPreviewPhase = false;
  previewCountdown = 3;
  private previewTimer: any;

  // Phase 3: Pair explanation modal
  showExplanation = false;
  currentExplanation = '';
  explanationPairText = '';

  // Phase 3: Streak bonus
  streakBonusPoints = 0;

  // Enums
  FlipCardGameMode = FlipCardGameMode;
  FlipCardContentType = FlipCardContentType;
  FlipCardTimerMode = FlipCardTimerMode;

  // Audio element (card audio playback)
  private currentAudio: HTMLAudioElement | null = null;

  get questionDropIds(): string[] {
    return this.rightCards.map(c => 'question-' + c.id);
  }

  /** Bug 5 fix: Show timeLeft for countdown, timerSeconds for count-up */
  get timerDisplay(): string {
    const mode = this.gameData?.question?.timerMode;
    if (mode === FlipCardTimerMode.CountDown) {
      const mins = Math.floor(this.timeLeft / 60);
      const secs = this.timeLeft % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    if (mode === FlipCardTimerMode.None) {
      return ''; // No timer display
    }
    // CountUp
    const mins = Math.floor(this.timerSeconds / 60);
    const secs = this.timerSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /** Phase 2: Responsive grid columns based on card count */
  get gridColumns(): number {
    const count = this.cards.length;
    if (count <= 8) return 4;
    if (count <= 12) return 4;
    if (count <= 16) return 4;
    if (count <= 20) return 5;
    return 6;
  }

  get hintsRemaining(): number {
    return Math.max(0, this.maxHints - this.hintsUsed);
  }

  constructor(
    private gameService: FlipCardGameService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.initSoundEffects();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.startGame(+id);
      } else {
        this.startGameByGradeSubject();
      }
    });
  }

  startGameByGradeSubject(): void {
    this.isLoading = true;
    this.gameLoadError = '';
    this.hasNoQuestions = false;

    const gradeId = getSelectedGrade();
    const subjectId = getSelectedSubject();

    const dto: StartFlipCardGameDto = {
      studentId: getStudentId(),
      gradeId: gradeId,
      subjectId: subjectId
    };

    this.gameService.startSession(dto).subscribe({
      next: (data) => {
        this.gameData = data;
        this.totalPairs = data.totalPairs;
        this.maxHints = data.question.maxHints || 3;
        this.showHints = data.question.showHints !== false;
        this.initGameModes(data);
        this.isLoading = false;
        // Phase 3: Start card preview if classic mode
        if (data.gameMode === FlipCardGameMode.Classic) {
          this.startCardPreview();
        } else {
          this.startTimer();
          this.gameState = 'playing';
        }
      },
      error: (err) => {
        console.error('Failed to start game - no questions available', err);
        this.isLoading = false;
        if (err.status === 404) {
          this.hasNoQuestions = true;
          this.gameLoadError = 'لا توجد ألعاب بطاقات متاحة لهذا الصف والمادة';
        } else {
          this.gameLoadError = 'فشل في تحميل الأسئلة، يرجى المحاولة مرة أخرى';
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.stopAudio();
    if (this.previewTimer) clearInterval(this.previewTimer);
  }

  startGame(questionId: number): void {
    this.isLoading = true;
    this.gameLoadError = '';

    const gradeId = getSelectedGrade();
    const subjectId = getSelectedSubject();

    const dto: StartFlipCardGameDto = {
      studentId: getStudentId(),
      gradeId: gradeId,
      subjectId: subjectId,
      questionId: questionId
    };

    this.gameService.startSession(dto).subscribe({
      next: (data) => {
        this.gameData = data;
        this.totalPairs = data.totalPairs;
        this.maxHints = data.question.maxHints || 3;
        this.showHints = data.question.showHints !== false;
        this.initGameModes(data);
        this.isLoading = false;
        if (data.gameMode === FlipCardGameMode.Classic) {
          this.startCardPreview();
        } else {
          this.startTimer();
          this.gameState = 'playing';
        }
      },
      error: (err) => {
        console.error('Failed to start game', err);
        this.isLoading = false;
        this.gameLoadError = 'فشل في تحميل اللعبة، يرجى المحاولة مرة أخرى';
      }
    });
  }

  private initGameModes(data: GameStartResponseDto): void {
    const allCards = data.question.cards.map(c => ({
      ...c,
      isFlipped: data.gameMode === FlipCardGameMode.Match,
      isMatched: false,
      shake: false,
      celebrate: false,
      isHinted: false,
      displayContent: c.type === FlipCardContentType.Image ? (c.imageUrl || '') : c.text
    }));

    if (data.gameMode === FlipCardGameMode.Classic) {
      this.cards = allCards.map(c => ({ ...c, isFlipped: false }));
    } else {
      this.rightCards = allCards.filter(c => c.cardNumber === 1);
      this.leftCards = allCards.filter(c => c.cardNumber === 2);

      this.rightCards.forEach(c => c.isFlipped = true);
      this.leftCards.forEach(c => c.isFlipped = true);
    }
  }

  // ========== CARD PREVIEW (Phase 3 - P2) ==========
  private startCardPreview(): void {
    // Show all cards face-up for 3 seconds
    this.isPreviewPhase = true;
    this.previewCountdown = 3;
    this.gameState = 'playing';
    this.cards.forEach(c => c.isFlipped = true);

    this.previewTimer = setInterval(() => {
      this.previewCountdown--;
      if (this.previewCountdown <= 0) {
        clearInterval(this.previewTimer);
        this.previewTimer = null;
        // Flip all cards back
        this.cards.forEach(c => c.isFlipped = false);
        this.isPreviewPhase = false;
        this.startTimer();
      }
    }, 1000);
  }

  // ========== SOUND EFFECTS (Phase 2 - E4) ==========
  private initSoundEffects(): void {
    // Use Web Audio API beeps for sound effects - no external files needed
    // We'll generate them on-the-fly
  }

  private playSound(type: 'flip' | 'match' | 'wrong' | 'complete' | 'hint' | 'streak'): void {
    if (!this.soundEnabled) return;

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      switch (type) {
        case 'flip':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(800, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.15);
          break;

        case 'match':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(523, ctx.currentTime);
          oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.4);
          break;

        case 'wrong':
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(300, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
          break;

        case 'complete':
          // Celebratory ascending tones
          [523, 659, 784, 1047].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
            gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
            osc.start(ctx.currentTime + i * 0.15);
            osc.stop(ctx.currentTime + i * 0.15 + 0.3);
          });
          return; // Already handled oscillators

        case 'hint':
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(600, ctx.currentTime);
          oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.25);
          break;

        case 'streak':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.15);
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.2);
          break;
      }
    } catch (e) {
      // Audio context not supported - silently ignore
    }
  }

  toggleSound(): void {
    this.soundEnabled = !this.soundEnabled;
  }

  // ========== CLASSIC MODE LOGIC ==========
  flipCard(card: CardViewModel): void {
    if (this.isProcessing || card.isFlipped || card.isMatched) return;
    if (this.gameData?.gameMode !== FlipCardGameMode.Classic) return;

    card.isFlipped = true;
    this.playSound('flip');
    this.currentFlipped.push(card);

    if (this.currentFlipped.length === 2) {
      this.checkMatch();
    }
  }

  private checkMatch(): void {
    this.isProcessing = true;
    this.moves++;

    const card1 = this.currentFlipped[0];
    const card2 = this.currentFlipped[1];

    const isMatch = card1.pairId === card2.pairId;

    if (isMatch) {
      this.gameService.recordMatch({
        sessionId: this.gameData!.id,
        pairId: card1.pairId,
        card1FlippedAtMs: Date.now(),
        card2FlippedAtMs: Date.now() + 100,
        attemptsBeforeMatch: this.moves,
        hintUsed: card1.isHinted || card2.isHinted || false
      }).subscribe({
        next: (result) => {
          card1.isMatched = true;
          card2.isMatched = true;
          card1.celebrate = true;
          card2.celebrate = true;
          this.matchedPairs++;
          this.score = result.totalScore;

          // Streak tracking
          this.streak++;
          if (this.streak > this.bestStreak) this.bestStreak = this.streak;

          // Phase 3: Streak bonus multiplier
          if (this.streak >= 3) {
            const bonus = (this.streak - 2) * 5;
            this.streakBonusPoints += bonus;
            this.showStreakBadge = true;
            this.playSound('streak');
            setTimeout(() => this.showStreakBadge = false, 2000);
          } else {
            this.playSound('match');
          }

          // Phase 3: Show explanation if available
          if (result.explanation) {
            this.showPairExplanation(card1.text || card2.text, result.explanation);
          }

          this.currentFlipped = [];
          this.isProcessing = false;

          if (this.matchedPairs >= this.totalPairs) {
            this.finishGame();
          }
        },
        error: (err) => {
          console.error('Error recording match', err);
          this.currentFlipped = [];
          this.isProcessing = false;
        }
      });
    } else {
      // Wrong match
      this.streak = 0; // Reset streak
      this.gameService.recordWrongMatch({
        sessionId: this.gameData!.id,
        card1Id: card1.id,
        card2Id: card2.id
      }).subscribe({
        next: () => {
          this.playSound('wrong');
          card1.shake = true;
          card2.shake = true;
          setTimeout(() => {
            card1.isFlipped = false;
            card2.isFlipped = false;
            card1.shake = false;
            card2.shake = false;
            this.currentFlipped = [];
            this.isProcessing = false;
          }, 1000);
        },
        error: (err) => {
          console.error('Error recording wrong match', err);
          this.playSound('wrong');
          card1.shake = true;
          card2.shake = true;
          setTimeout(() => {
            card1.isFlipped = false;
            card2.isFlipped = false;
            card1.shake = false;
            card2.shake = false;
            this.currentFlipped = [];
            this.isProcessing = false;
          }, 1000);
        }
      });
    }
  }

  // ========== MATCH MODE LOGIC ==========
  onDrop(event: CdkDragDrop<CardViewModel[]> | any, targetCard: CardViewModel): void {
    const sourceCard: CardViewModel = event.item.data;
    this.moves++;

    if (sourceCard.pairId === targetCard.pairId) {
      this.gameService.recordMatch({
        sessionId: this.gameData!.id,
        pairId: sourceCard.pairId,
        card1FlippedAtMs: Date.now(),
        card2FlippedAtMs: Date.now() + 100,
        attemptsBeforeMatch: this.moves,
        hintUsed: false
      }).subscribe({
        next: (result) => {
          sourceCard.isMatched = true;
          targetCard.isMatched = true;
          targetCard.celebrate = true;
          this.matchedPairs++;
          this.score = result.totalScore;

          this.streak++;
          if (this.streak > this.bestStreak) this.bestStreak = this.streak;
          if (this.streak >= 3) {
            this.showStreakBadge = true;
            this.playSound('streak');
            setTimeout(() => this.showStreakBadge = false, 2000);
          } else {
            this.playSound('match');
          }

          if (this.matchedPairs >= this.totalPairs) {
            this.finishGame();
          }
        },
        error: (err) => {
          console.error('Error recording match', err);
        }
      });
    } else {
      this.streak = 0;
      this.gameService.recordWrongMatch({
        sessionId: this.gameData!.id,
        card1Id: sourceCard.id,
        card2Id: targetCard.id
      }).subscribe({
        next: () => {
          this.playSound('wrong');
          targetCard.shake = true;
          setTimeout(() => targetCard.shake = false, 500);
        },
        error: (err) => {
          console.error('Error recording wrong match', err);
          this.playSound('wrong');
          targetCard.shake = true;
          setTimeout(() => targetCard.shake = false, 500);
        }
      });
    }
  }

  // ========== HINT SYSTEM (Phase 2 - E2) ==========
  useHint(): void {
    if (this.hintsUsed >= this.maxHints || this.isHinting || this.isProcessing) return;

    this.isHinting = true;
    this.hintsUsed++;
    this.playSound('hint');

    if (this.gameData?.gameMode === FlipCardGameMode.Classic) {
      // Find an unmatched pair and briefly reveal both cards
      const unmatchedCards = this.cards.filter(c => !c.isMatched && !c.isFlipped);
      if (unmatchedCards.length >= 2) {
        // Find a pair
        const firstCard = unmatchedCards[0];
        const partnerCard = unmatchedCards.find(c => c.pairId === firstCard.pairId && c.id !== firstCard.id);

        if (partnerCard) {
          firstCard.isHinted = true;
          partnerCard.isHinted = true;
          firstCard.isFlipped = true;
          partnerCard.isFlipped = true;

          setTimeout(() => {
            if (!firstCard.isMatched) firstCard.isFlipped = false;
            if (!partnerCard.isMatched) partnerCard.isFlipped = false;
            this.isHinting = false;
          }, 1500);
        } else {
          this.isHinting = false;
        }
      } else {
        this.isHinting = false;
      }
    } else {
      // Match mode: highlight a matching pair
      const unmatchedLeft = this.leftCards.find(c => !c.isMatched);
      const matchingRight = unmatchedLeft
        ? this.rightCards.find(c => c.pairId === unmatchedLeft.pairId && !c.isMatched)
        : null;

      if (unmatchedLeft && matchingRight) {
        unmatchedLeft.isHinted = true;
        matchingRight.isHinted = true;

        setTimeout(() => {
          unmatchedLeft.isHinted = false;
          matchingRight.isHinted = false;
          this.isHinting = false;
        }, 2000);
      } else {
        this.isHinting = false;
      }
    }

    // Also call backend hint API for tracking
    if (this.gameData) {
      this.gameService.getHint(this.gameData.id).subscribe({
        error: (err) => console.error('Hint API error:', err)
      });
    }
  }

  // ========== PAIR EXPLANATION (Phase 3 - P3) ==========
  showPairExplanation(pairText: string, explanation: string): void {
    this.explanationPairText = pairText;
    this.currentExplanation = explanation;
    this.showExplanation = true;

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      this.dismissExplanation();
    }, 4000);
  }

  dismissExplanation(): void {
    this.showExplanation = false;
    this.currentExplanation = '';
    this.explanationPairText = '';
  }

  // ========== CONFETTI (Phase 2 - E4) ==========
  private triggerConfetti(): void {
    const colors = ['#FFD700', '#00D9FF', '#FF6B6B', '#00FF88', '#FF8C42', '#B388FF'];
    this.confettiPieces = Array.from({ length: 50 }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360
    }));
    this.showConfetti = true;
    setTimeout(() => this.showConfetti = false, 4000);
  }

  // ========== INSTRUCTIONS (Phase 2 - E7) ==========
  dismissInstructions(): void {
    this.showInstructions = false;
  }

  // ========== TIMER & UTILS ==========
  startTimer(): void {
    this.stopTimer();

    const mode = this.gameData?.question?.timerMode;
    const limitSeconds = this.gameData?.question?.timeLimitSeconds || 60;

    if (mode === FlipCardTimerMode.None) {
      this.timerSeconds = 0;
      this.timerInterval = setInterval(() => {
        this.timerSeconds++;
      }, 1000);
      return;
    }

    if (mode === FlipCardTimerMode.CountDown) {
      this.timeLeft = limitSeconds;
      this.timerSeconds = 0;
      this.timerInterval = setInterval(() => {
        this.timerSeconds++;
        if (this.timeLeft > 0) {
          this.timeLeft--;
        } else {
          this.stopTimer();
          this.finishGame();
        }
      }, 1000);
    } else {
      this.timerSeconds = 0;
      this.timerInterval = setInterval(() => {
        this.timerSeconds++;
      }, 1000);
    }
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  finishGame(): void {
    this.gameState = 'complete';
    this.stopTimer();
    this.isCalculatingResult = true;
    this.stars = 0;

    this.playSound('complete');
    this.triggerConfetti();

    this.gameService.completeSession(this.gameData!.id).subscribe({
      next: (res) => {
        this.score = res.finalScore;
        this.stars = res.starRating;
        this.achievements = res.achievements || [];
        this.isCalculatingResult = false;
      },
      error: (err) => {
        console.error('Complete session error:', err);
        this.stars = 3;
        this.isCalculatingResult = false;
      }
    });
  }

  playAgain(): void {
    this.stopTimer();

    // Reset all state
    this.cards = [];
    this.leftCards = [];
    this.rightCards = [];
    this.currentFlipped = [];
    this.matchedPairs = 0;
    this.totalPairs = 0;
    this.moves = 0;
    this.score = 0;
    this.stars = 0;
    this.timerSeconds = 0;
    this.timeLeft = 0;
    this.gameState = 'start';
    this.isProcessing = false;
    this.isCalculatingResult = false;
    this.gameData = null;
    this.gameLoadError = '';
    this.hasNoQuestions = false;
    this.hintsUsed = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.showConfetti = false;
    this.showInstructions = true;
    this.achievements = [];
    this.isPreviewPhase = false;
    this.previewCountdown = 3;
    this.showExplanation = false;
    this.streakBonusPoints = 0;

    // Restart
    this.startGameByGradeSubject();
  }

  exit(): void {
    this.router.navigate(['/game-type']);
  }

  // ========== AUDIO PLAYBACK (Bug 3 fix) ==========
  playAudio(card: CardViewModel): void {
    if (!card.audioUrl) return;

    this.stopAudio();

    card.isPlayingAudio = true;
    this.currentAudio = new Audio(card.audioUrl);
    this.currentAudio.play().catch(err => console.error('Audio play error:', err));
    this.currentAudio.onended = () => {
      card.isPlayingAudio = false;
      this.currentAudio = null;
    };
    this.currentAudio.onerror = () => {
      card.isPlayingAudio = false;
      this.currentAudio = null;
    };
  }

  private stopAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }

  retryGame(): void {
    this.gameLoadError = '';
    this.hasNoQuestions = false;
    this.startGameByGradeSubject();
  }
}
