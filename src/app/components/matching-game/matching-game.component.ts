import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatchingGameService } from '../../services/matching-game.service';
import { AudioService } from '../../services/audio.service';
import {
  StartMatchingGameDto,
  MatchingGameStartResponseDto,
  ValidateMatchDto,
  GameCardDto,
  MatchingContentType,
  MatchingMode,
  MatchingTimerMode,
  GradeLevel,
  SubjectType
} from '../../models/matching-game.model';
import { Subscription, timer } from 'rxjs';

@Component({
  selector: 'app-matching-game',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-v0-gradient min-h-screen p-4 select-none">
      <div class="container max-w-6xl py-4 mx-auto">
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white/20">
          <button (click)="goBack()" class="btn-ghost text-slate-700 hover:bg-white/50">
            <span class="text-xl">➜</span>
            <span class="font-bold mr-2">خروج</span>
          </button>
          
          <div class="text-center">
            <h2 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              {{ gameTitle }}
            </h2>
            <p class="text-sm text-slate-500 font-medium mt-1">{{ instructions }}</p>
          </div>

          <div class="flex items-center gap-4">
             <!-- Timer -->
             <div *ngIf="timerMode !== 0" class="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                <span class="text-xl">⏱️</span>
                <span class="text-xl font-mono font-bold" [class.text-red-500]="isLowTime">
                  {{ formatTime(timeRemaining) }}
                </span>
             </div>

             <!-- Score / Progress -->
             <div class="flex items-center gap-3">
                <div class="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
                    <span class="text-xs text-slate-500 font-bold uppercase">النقاط</span>
                    <span class="text-xl font-black text-indigo-600">{{ totalScore }}</span>
                </div>
                <div class="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
                    <span class="text-xs text-slate-500 font-bold uppercase">المطابقة</span>
                    <span class="text-xl font-black text-green-600">{{ matchedPairs }}/{{ totalPairs }}</span>
                </div>
             </div>
          </div>
        </div>

        <!-- Hint Button -->
        <div *ngIf="enableHints && hintsRemaining > 0 && !gameComplete" class="fixed bottom-6 left-6 z-50">
           <button (click)="useHint()" [disabled]="hintLoading" 
              class="group bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1 rounded-full p-4 shadow-lg transition-all flex items-center justify-center relative overflow-hidden">
               <span class="text-2xl relative z-10 group-hover:scale-110 transition-transform">💡</span>
               <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                  {{ hintsRemaining }}
               </span>
           </button>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="flex flex-col items-center justify-center h-[60vh]">
           <div class="relative w-24 h-24 mb-6">
              <div class="absolute inset-0 border-8 border-slate-200 rounded-full"></div>
              <div class="absolute inset-0 border-8 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
              <div class="absolute inset-0 flex items-center justify-center text-4xl">🎮</div>
           </div>
           <p class="text-slate-500 font-medium text-lg animate-pulse">جاري تجهيز اللعبة...</p>
        </div>

        <!-- Game Area -->
        <div *ngIf="!isLoading && !gameComplete" class="grid grid-cols-2 gap-4 md:gap-12 relative">
           
           <!-- Connecting Lines Canvas (Optional implementation later) -->
           <!-- <canvas #connectionsCanvas class="absolute inset-0 pointer-events-none z-0"></canvas> -->

           <!-- Left Column (Questions) -->
           <div class="space-y-4">
              <div *ngFor="let item of questions" 
                   (click)="selectQuestion(item)"
                   [class]="getItemClasses(item, 'question')"
                   class="bg-white rounded-2xl border-2 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 min-h-[100px] flex flex-col items-center justify-center p-4 relative overflow-hidden group">
                   
                   <div *ngIf="item.imageUrl" class="mb-2 w-full h-32 flex items-center justify-center">
                      <img [src]="item.imageUrl" class="max-h-full max-w-full rounded-lg object-contain" alt="Question Image">
                   </div>
                   
                   <span *ngIf="item.text" class="text-lg font-bold text-center text-slate-700 group-hover:text-indigo-700 transition-colors">
                      {{ item.text }}
                   </span>

                   <!-- Audio Icon if audio exists -->
                   <button *ngIf="item.audioUrl" (click)="playAudio($event, item.audioUrl)" class="mt-2 text-indigo-500 hover:text-indigo-700 p-2 rounded-full hover:bg-indigo-50 transition-colors">
                      🔊
                   </button>
                   
                   <!-- Selection Indicator -->
                   <div class="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-200 rounded-full border-4 border-white shadow-sm group-hover:bg-indigo-200 transition-colors"
                        [class.bg-indigo-500]="selectedQuestion === item"
                        [class.bg-green-500]="isMatched(item)">
                   </div>
              </div>
           </div>

           <!-- Right Column (Answers) -->
           <div class="space-y-4">
              <div *ngFor="let item of answers" 
                   (click)="selectAnswer(item)"
                   [class]="getItemClasses(item, 'answer')"
                   class="bg-white rounded-2xl border-2 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 min-h-[100px] flex flex-col items-center justify-center p-4 relative overflow-hidden group">

                   <div *ngIf="item.imageUrl" class="mb-2 w-full h-32 flex items-center justify-center">
                      <img [src]="item.imageUrl" class="max-h-full max-w-full rounded-lg object-contain" alt="Answer Image">
                   </div>

                   <span *ngIf="item.text" class="text-lg font-bold text-center text-slate-700 group-hover:text-pink-700 transition-colors">
                      {{ item.text }}
                   </span>

                   <button *ngIf="item.audioUrl" (click)="playAudio($event, item.audioUrl)" class="mt-2 text-pink-500 hover:text-pink-700 p-2 rounded-full hover:bg-pink-50 transition-colors">
                      🔊
                   </button>

                   <!-- Selection Indicator -->
                   <div class="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-200 rounded-full border-4 border-white shadow-sm group-hover:bg-pink-200 transition-colors"
                        [class.bg-pink-500]="selectedAnswer === item"
                        [class.bg-green-500]="isMatched(item)">
                   </div>
              </div>
           </div>
        </div>

        <!-- Feedback Overlay -->
        <div *ngIf="feedbackMessage" class="fixed inset-x-0 bottom-10 flex justify-center pointer-events-none z-40">
           <div [class]="'px-6 py-3 rounded-2xl shadow-xl font-bold text-lg animate-bounce ' + (feedbackType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white')">
              {{ feedbackMessage }}
           </div>
        </div>

        <!-- Game Complete Modal -->
        <div *ngIf="gameComplete" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center relative overflow-hidden">
               <!-- Confetti Background (simulated with CSS or image) -->
               <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5"></div>
               
               <div class="text-6xl mb-4 animate-bounce">🏆</div>
               <h3 class="text-3xl font-black text-slate-800 mb-2">ممتاز!</h3>
               <p class="text-slate-500 text-lg mb-8">لقد أكملت اللعبة بنجاح</p>
               
               <div class="grid grid-cols-2 gap-4 mb-8">
                  <div class="bg-slate-50 p-4 rounded-2xl">
                     <div class="text-sm text-slate-500 font-bold">النقاط</div>
                     <div class="text-2xl font-black text-indigo-600">{{ totalScore }}</div>
                  </div>
                  <div class="bg-slate-50 p-4 rounded-2xl">
                     <div class="text-sm text-slate-500 font-bold">الوقت</div>
                     <div class="text-2xl font-black text-indigo-600">{{ formatTime(timeSpent) }}</div>
                  </div>
               </div>

               <div class="flex gap-2 text-yellow-500 justify-center text-3xl mb-8">
                  <span *ngFor="let star of [1,2,3]" [class.grayscale]="star > starRating">⭐</span>
               </div>

               <button (click)="submitAndExit()" [disabled]="isSubmitting" 
                  class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2">
                  <span *ngIf="isSubmitting" class="animate-spin">⌛</span>
                  <span>النتائج والمتابعة</span>
               </button>
           </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .btn-ghost { @apply flex items-center px-4 py-2 rounded-xl transition-colors; }
    
    .question-selected { @apply border-indigo-500 bg-indigo-50 ring-4 ring-indigo-200/[.5]; }
    .answer-selected { @apply border-pink-500 bg-pink-50 ring-4 ring-pink-200/[.5]; }
    
    .item-matched { @apply border-green-500 bg-green-50 opacity-50 cursor-default scale-95 saturate-50; }
    .item-error { @apply border-red-500 bg-red-50 animate-shake; }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
  `]
})
export class MatchingGameComponent implements OnInit, OnDestroy {
  sessionId: number = 0;
  gameTitle: string = '';
  instructions: string = '';
  questions: GameCardDto[] = [];
  answers: GameCardDto[] = [];

  // Game State
  isLoading = true;
  gameComplete = false;
  isSubmitting = false;

  selectedQuestion: GameCardDto | null = null;
  selectedAnswer: GameCardDto | null = null;

  matchedPairIds: number[] = []; // IDs of matched pairs

  // Stats
  totalScore = 0;
  matchedPairs = 0;
  totalPairs = 0;
  wrongAttempts = 0;

  // Audio/Hints/Timer
  enableAudio = true;
  enableHints = true;
  hintsRemaining = 0;
  hintLoading = false;

  timerMode: MatchingTimerMode = MatchingTimerMode.None;
  timeRemaining = 0;
  timeSpent = 0;
  timerSubscription?: Subscription;
  isLowTime = false;

  feedbackMessage = '';
  feedbackType: 'success' | 'error' = 'success';
  starRating = 0;

  constructor(
    private router: Router,
    private matchingService: MatchingGameService,
    private audioService: AudioService
  ) { }

  ngOnInit() {
    this.initializeGame();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  initializeGame() {
    this.isLoading = true;

    // Get settings from SessionStorage for Demo/Nav purposes
    const gradeId = parseInt(sessionStorage.getItem('selectedGrade') || '3') as GradeLevel;
    const subjectMap: any = { 'arabic': 1, 'math': 2, 'science': 3, 'islamic': 3, 'english': 5 };
    const subjectStr = sessionStorage.getItem('selectedSubject') || 'arabic';
    const subjectId = (subjectMap[subjectStr] || 1) as SubjectType;
    let studentId = 1;

    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (user.id) studentId = user.id;
    } catch { }

    const dto: StartMatchingGameDto = {
      studentId,
      gradeId,
      subjectId,
      // gameId: optional specific game ID if passed from list
    };

    // Check if gameId is in route params? Assuming route handles it or generic start
    // Ideally we assume standard "Play" button simply starts a random game for now 
    // unless router state has gameId.

    this.matchingService.startGame(dto).subscribe({
      next: (res) => this.setupGame(res),
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.feedbackMessage = 'حدث خطأ أثناء تحميل اللعبة';
        this.feedbackType = 'error';
      }
    });
  }

  setupGame(res: MatchingGameStartResponseDto) {
    this.sessionId = res.sessionId;
    this.gameTitle = res.gameTitle;
    this.instructions = res.instructions;
    this.totalPairs = res.numberOfPairs;
    this.questions = res.questions;
    this.answers = res.answers; // Already shuffled from backend? Yes.

    this.enableAudio = res.enableAudio;
    this.enableHints = res.enableHints;
    this.hintsRemaining = res.maxHints;
    this.timerMode = res.timerMode;

    if (this.timerMode === MatchingTimerMode.Countdown && res.timeLimitSeconds) {
      this.timeRemaining = res.timeLimitSeconds;
    } else {
      this.timeRemaining = 0;
    }

    this.isLoading = false;
    this.startTimer();
  }

  startTimer() {
    this.timerSubscription = timer(0, 1000).subscribe(() => {
      this.timeSpent++;

      if (this.timerMode === MatchingTimerMode.Countdown) {
        this.timeRemaining--;
        if (this.timeRemaining <= 10) this.isLowTime = true;
        if (this.timeRemaining <= 0) {
          this.handleTimeUp();
        }
      }
    });
  }

  stopTimer() {
    this.timerSubscription?.unsubscribe();
  }

  handleTimeUp() {
    this.stopTimer();
    this.feedbackMessage = '⏰ انتهى الوقت!';
    this.feedbackType = 'error';
    // Disable game or finish session
    setTimeout(() => this.finishGame(), 2000);
  }

  selectQuestion(item: GameCardDto) {
    if (this.isMatched(item) || this.gameComplete) return;

    this.audioService.playClick();

    if (this.selectedQuestion === item) {
      this.selectedQuestion = null;
    } else {
      this.selectedQuestion = item;
    }

    this.checkMatch();
  }

  selectAnswer(item: GameCardDto) {
    if (this.isMatched(item) || this.gameComplete) return;

    this.audioService.playClick();

    if (this.selectedAnswer === item) {
      this.selectedAnswer = null;
    } else {
      this.selectedAnswer = item;
    }

    this.checkMatch();
  }

  checkMatch() {
    if (!this.selectedQuestion || !this.selectedAnswer) return;

    // Call Backend Validation
    const dto: ValidateMatchDto = {
      sessionId: this.sessionId,
      questionId: this.selectedQuestion.id,
      answerId: this.selectedAnswer.id,
      timeToMatchMs: 0 // Could track specific move time
    };

    // Optimistic UI? Or wait? 
    // Wait is safer to prevent syncing issues, but might feel slow.
    // We will wait but show "Thinking..." if needed.

    this.matchingService.validateMatch(dto).subscribe({
      next: (res) => this.handleMatchResult(res),
      error: (err) => console.error(err)
    });
  }

  handleMatchResult(res: any) { // MatchResultDto
    if (res.isCorrect) {
      this.audioService.playCorrect();
      this.feedbackMessage = res.message || 'أحسنت!';
      this.feedbackType = 'success';

      // Mark as matched
      if (this.selectedQuestion) this.matchedPairIds.push(this.selectedQuestion.id);

      this.matchedPairs = res.matchedPairs;
      this.totalScore = res.totalScore;

      this.selectedQuestion = null;
      this.selectedAnswer = null;

      if (res.isGameComplete) {
        this.stopTimer();
        setTimeout(() => this.finishGame(), 1000);
      }
    } else {
      this.audioService.playWrong();
      this.feedbackMessage = res.message || 'حاول مرة أخرى';
      this.feedbackType = 'error';
      this.wrongAttempts++;

      // Show error state briefly
      const q = this.selectedQuestion;
      const a = this.selectedAnswer;

      // We need a way to show error class. 
      // For now, simple timeout to clear selection
      setTimeout(() => {
        if (this.selectedQuestion === q) this.selectedQuestion = null;
        if (this.selectedAnswer === a) this.selectedAnswer = null;
        this.feedbackMessage = '';
      }, 1000);
    }
  }

  isMatched(item: GameCardDto): boolean {
    // Note: item.id is PairId. matchedPairIds contains PairIds.
    return this.matchedPairIds.includes(item.id);
  }

  getItemClasses(item: GameCardDto, type: 'question' | 'answer'): string {
    if (this.isMatched(item)) return 'item-matched';

    if (type === 'question' && this.selectedQuestion === item) return 'question-selected';
    if (type === 'answer' && this.selectedAnswer === item) return 'answer-selected';

    return 'bg-white';
  }

  useHint() {
    if (this.hintsRemaining <= 0 || this.hintLoading) return;
    this.hintLoading = true;

    this.matchingService.getHint(this.sessionId).subscribe({
      next: (res) => {
        this.hintsRemaining = res.hintsRemaining;
        const qId = res.questionId;
        const aId = res.answerId;

        // Highlight the pair visually
        this.questions.find(q => q.id === qId); // find item
        // Logic to highlight/shake the pair?
        // Simplest: Auto-Select them? Or just show a message?
        // "Try matching [Text]!"

        this.feedbackMessage = '💡 تلميح: حاول مطابقة البطاقات المميزة';
        this.feedbackType = 'success';

        // Auto Select?
        this.selectedQuestion = this.questions.find(q => q.id === qId) || null;
        this.selectedAnswer = this.answers.find(a => a.id === aId) || null;

        this.hintLoading = false;
      },
      error: () => this.hintLoading = false
    });
  }

  finishGame() {
    this.matchingService.completeSession(this.sessionId).subscribe({
      next: (res) => {
        this.gameComplete = true;
        this.starRating = res.starRating;
      }
    });
  }

  submitAndExit() {
    this.router.navigate(['/result']);
  }

  goBack() {
    this.router.navigate(['/game-type']);
  }

  playAudio(e: Event, url: string) {
    e.stopPropagation();
    this.audioService.play(url);
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
