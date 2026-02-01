import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatchingGameService } from '../../services/matching-game.service';
import { AudioService } from '../../services/audio.service';
import { StartMatchingGameDto, SubmitMatchingGameDto, GameStartResponse, ValidationMatchDto } from '../../models/models';

interface MatchItem {
  id: number | string; // number for Left, string (Guid) for Right
  text: string;
  type: 'question' | 'answer';
  matched: boolean;
  animating?: boolean;
  correctRightItemId?: string; // Added for validation (Question items only)
}

@Component({
  selector: 'app-matching-game',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-v0-gradient min-h-screen p-4">
      <div class="container max-w-6xl py-8">
        <!-- Header -->
        <div class="flex justify-between items-center mb-8">
          <button (click)="goBack()" class="btn-ghost">
            <span>→</span>
            رجوع
          </button>
          <div class="text-center">
            <h2 class="text-2xl font-bold text-foreground">لعبة المطابقة</h2>
            <p class="text-muted">اربط السؤال بالإجابة الصحيحة</p>
          </div>
          <div class="visitor-badge">
            <span class="visitor-badge-count">{{ matchedPairs }}/{{ totalPairs }}</span>
            <span class="visitor-badge-label">تم</span>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="text-center py-12">
           <div class="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
           <p class="text-slate-500">جاري تحميل اللعبة...</p>
        </div>

        <!-- Game Area -->
        <div *ngIf="!isLoading && !gameComplete" class="grid md:grid-cols-2 gap-8">
          <!-- Questions Column (Left Items) -->
          <div class="space-y-4">
            <h3 class="text-xl font-bold text-primary text-center mb-4">الأسئلة</h3>
            <div
              *ngFor="let item of leftItems"
              (click)="selectItem(item)"
              class="p-4 rounded-xl border-2 cursor-pointer transition-all text-center"
              [ngClass]="{
                'border-border bg-white hover:border-primary': !item.matched && selectedQuestion?.id !== item.id,
                'border-primary bg-primary/10': selectedQuestion?.id === item.id,
                'border-green-500 bg-green-50 opacity-60 animate-pulse': item.matched && item.animating,
                'border-indigo-500 bg-indigo-50 opacity-50': item.matched && !item.animating,
                'animate-shake': item === selectedQuestion && feedbackType === 'error'
              }"
            >
              <span class="text-lg font-bold">{{ item.text }}</span>
            </div>
          </div>

          <!-- Answers Column (Right Items) -->
          <div class="space-y-4">
            <h3 class="text-xl font-bold text-secondary text-center mb-4">الإجابات</h3>
            <div
              *ngFor="let item of rightItems"
              (click)="selectItem(item)"
              class="p-4 rounded-xl border-2 cursor-pointer transition-all text-center"
              [ngClass]="{
                'border-border bg-white hover:border-secondary': !item.matched && selectedAnswer?.id !== item.id,
                'border-secondary bg-secondary/10': selectedAnswer?.id === item.id,
                'border-green-500 bg-green-50 opacity-60 animate-pulse': item.matched && item.animating,
                'border-indigo-500 bg-indigo-50 opacity-50': item.matched && !item.animating,
                'animate-shake': item === selectedAnswer && feedbackType === 'error'
              }"
            >
              <span class="text-lg font-bold">{{ item.text }}</span>
            </div>
          </div>
        </div>

        <!-- Feedback -->
        <div *ngIf="feedbackMessage" class="mt-8 text-center pointer-events-none sticky bottom-8">
          <div 
            class="p-4 rounded-xl text-xl font-bold inline-block shadow-lg"
            [ngClass]="feedbackType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
          >
            {{ feedbackMessage }}
          </div>
        </div>

        <!-- Complete Message -->
        <div *ngIf="gameComplete" class="mt-8 text-center">
          <div class="card-v0 p-8 max-w-md mx-auto">
            <div class="text-6xl mb-4">🎉</div>
            <h3 class="text-2xl font-bold text-foreground mb-4">أحسنت! أكملت اللعبة</h3>
            <p class="text-muted mb-6">لقد طابقت جميع الأسئلة بإجاباتها الصحيحة</p>
            <p *ngIf="isSubmitting" class="text-sm text-indigo-500 animate-pulse mb-4">جاري حفظ النتيجة...</p>
            <button (click)="submitResults()" [disabled]="isSubmitting" class="btn-primary px-8 py-4 text-lg w-full">
              عرض النتيجة
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-ghost {
      @apply flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-slate-900;
    }
    .btn-ghost:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
    .text-primary { color: var(--primary, #4f46e5); }
    .text-secondary { color: var(--secondary, #10b981); }
    .border-primary { border-color: var(--primary, #4f46e5); }
    .border-secondary { border-color: var(--secondary, #10b981); }
    .bg-primary\\/10 { background-color: rgba(79, 70, 229, 0.1); }
    .bg-secondary\\/10 { background-color: rgba(16, 185, 129, 0.1); }
  `]
})
export class MatchingGameComponent implements OnInit {
  leftItems: MatchItem[] = [];
  rightItems: MatchItem[] = [];

  selectedQuestion: MatchItem | null = null;
  selectedAnswer: MatchItem | null = null;

  matchedPairs = 0;
  totalPairs = 0;

  feedbackMessage = '';
  feedbackType: 'success' | 'error' = 'success';

  gameSessionId: number = 0;
  isLoading: boolean = false;
  gameComplete = false;
  isSubmitting: boolean = false;

  // To track matches for validation submission
  matches: ValidationMatchDto[] = [];
  startTime: number = 0;

  constructor(
    private router: Router,
    private matchingService: MatchingGameService,
    private audioService: AudioService
  ) { }

  ngOnInit() {
    this.initializeGame();
  }

  initializeGame() {
    this.isLoading = true;
    const gradeId = parseInt(sessionStorage.getItem('selectedGrade') || '3');
    const subjectStr = sessionStorage.getItem('selectedSubject');
    // Map existing string keys to IDs - Adjust based on your DB seed
    const subjectMap: { [key: string]: number } = { 'arabic': 1, 'math': 2, 'science': 3 };
    const subjectId = subjectMap[subjectStr || 'arabic'] || 1;

    // Attempt to get student ID
    let studentId = 1; // Default fallback
    const storedStudent = localStorage.getItem('currentUser');
    if (storedStudent) {
      try {
        const student = JSON.parse(storedStudent);
        if (student.id) studentId = student.id;
      } catch (e) { }
    }

    const dto: StartMatchingGameDto = {
      studentId,
      gradeId,
      subjectId
    };

    this.matchingService.startGame(dto).subscribe({
      next: (res) => {
        this.gameSessionId = res.sessionId;
        this.setupGame(res);
        this.isLoading = false;
        this.startTime = Date.now();
      },
      error: (err) => {
        console.error('Failed to start game', err);
        this.feedbackMessage = 'عذراً، حدث خطأ أثناء تحميل اللعبة';
        this.feedbackType = 'error';
        this.isLoading = false;
      }
    });
  }

  setupGame(data: GameStartResponse) {
    this.totalPairs = data.leftItems.length;

    this.leftItems = data.leftItems.map((item: any) => ({
      id: item.id,
      text: item.text,
      type: 'question',
      matched: false,
      correctRightItemId: item.rightItemId // Backend MUST provide this
    }));

    // Randomize Right Items
    this.rightItems = this.shuffleArray(data.rightItems).map(item => ({
      id: item.id, // This is a String (Guid)
      text: item.text,
      type: 'answer',
      matched: false
    }));
  }

  shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  selectItem(item: MatchItem) {
    if (item.matched || this.gameComplete) return;

    this.audioService.playClick();

    if (item.type === 'question') {
      if (this.selectedQuestion === item) {
        this.selectedQuestion = null;
        return;
      }
      this.selectedQuestion = item;
    } else {
      if (this.selectedAnswer === item) {
        this.selectedAnswer = null;
        return;
      }
      this.selectedAnswer = item;
    }

    if (this.selectedQuestion && this.selectedAnswer) {
      this.checkLocalMatch();
    }
  }

  checkLocalMatch() {
    if (!this.selectedQuestion || !this.selectedAnswer) return;

    const isMatch = this.selectedQuestion.correctRightItemId === this.selectedAnswer.id;

    if (isMatch) {
      this.audioService.playCorrect();
      this.selectedQuestion.matched = true;
      this.selectedQuestion.animating = true;
      this.selectedAnswer.matched = true;
      this.selectedAnswer.animating = true;
      this.matchedPairs++;
      this.feedbackMessage = '🎉 ممتاز! مطابقة صحيحة';
      this.feedbackType = 'success';

      // Track match
      this.matches.push({
        questionId: this.selectedQuestion.id as number,
        rightItemId: this.selectedAnswer.id as string
      });

      if (this.matchedPairs === this.totalPairs) {
        this.gameComplete = true;
        this.audioService.playComplete();
      }
    } else {
      this.audioService.playWrong();
      this.feedbackMessage = '❌ حاول مرة أخرى';
      this.feedbackType = 'error';
    }

    setTimeout(() => {
      this.selectedQuestion = null;
      this.selectedAnswer = null;
      this.feedbackMessage = '';
    }, 1000);
  }

  submitResults() {
    this.isSubmitting = true;
    const dto: SubmitMatchingGameDto = {
      sessionId: this.gameSessionId,
      matches: this.matches,
      timeSpentSeconds: Math.floor((Date.now() - this.startTime) / 1000)
    };

    this.matchingService.submitGame(dto).subscribe({
      next: (res) => {
        // Store result for display
        sessionStorage.setItem('gameResult', JSON.stringify(res));

        // Compatibility with ResultScreenComponent
        sessionStorage.setItem('quizScore', res.correctMatches.toString());
        sessionStorage.setItem('quizTotal', res.totalQuestions.toString());

        this.router.navigate(['/result']); // Should perhaps go to a specific game result page?
      },
      error: (err) => {
        console.error('Failed to submit game', err);
        this.isSubmitting = false;
        alert('عذراً، حدث خطأ أثناء حفظ النتيجة');
      }
    });
  }

  goBack() {
    this.router.navigate(['/game-type']);
  }
}
