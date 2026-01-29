import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AudioService } from '../../services/audio.service';

interface MatchItem {
  id: number;
  text: string;
  matchId: number;
  type: 'question' | 'answer';
  matched: boolean;
  animating?: boolean;
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

        <!-- Game Area -->
        <div class="grid md:grid-cols-2 gap-8">
          <!-- Questions Column -->
          <div class="space-y-4">
            <h3 class="text-xl font-bold text-primary text-center mb-4">الأسئلة</h3>
            <div
              *ngFor="let item of questions"
              (click)="selectItem(item)"
              class="p-4 rounded-xl border-2 cursor-pointer transition-all text-center"
              [ngClass]="{
                'border-border bg-white hover:border-primary': !item.matched && selectedQuestion?.id !== item.id,
                'border-primary bg-primary/10': selectedQuestion?.id === item.id,
                'border-green-500 bg-green-50 opacity-60 animate-pulse': item.matched && item.animating,
                'animate-shake': item === selectedQuestion && feedbackType === 'error'
              }"
            >
              <span class="text-lg font-bold">{{ item.text }}</span>
            </div>
          </div>

          <!-- Answers Column -->
          <div class="space-y-4">
            <h3 class="text-xl font-bold text-secondary text-center mb-4">الإجابات</h3>
            <div
              *ngFor="let item of answers"
              (click)="selectItem(item)"
              class="p-4 rounded-xl border-2 cursor-pointer transition-all text-center"
              [ngClass]="{
                'border-border bg-white hover:border-secondary': !item.matched && selectedAnswer?.id !== item.id,
                'border-secondary bg-secondary/10': selectedAnswer?.id === item.id,
                'border-green-500 bg-green-50 opacity-60 animate-pulse': item.matched && item.animating,
                'animate-shake': item === selectedAnswer && feedbackType === 'error'
              }"
            >
              <span class="text-lg font-bold">{{ item.text }}</span>
            </div>
          </div>
        </div>

        <!-- Feedback -->
        <div *ngIf="feedbackMessage" class="mt-8 text-center">
          <div 
            class="p-4 rounded-xl text-xl font-bold inline-block"
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
            <button (click)="finishGame()" class="btn-primary px-8 py-4 text-lg">
              عرض النتيجة
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MatchingGameComponent implements OnInit {
  questions: MatchItem[] = [];
  answers: MatchItem[] = [];
  selectedQuestion: MatchItem | null = null;
  selectedAnswer: MatchItem | null = null;
  matchedPairs = 0;
  totalPairs = 0;
  feedbackMessage = '';
  feedbackType: 'success' | 'error' = 'success';
  gameComplete = false;

  constructor(
    private router: Router,
    private api: ApiService,
    private audioService: AudioService
  ) { }

  ngOnInit() {
    this.initializeGame();
  }

  initializeGame() {
    const grade = parseInt(sessionStorage.getItem('selectedGrade') || '3');
    const subjectStr = sessionStorage.getItem('selectedSubject');
    const subjectMap: { [key: string]: number } = { 'arabic': 1, 'math': 2, 'science': 3 };
    const subject = subjectMap[subjectStr || 'arabic'] || 1;
    const testType = 1;

    // Filter by subject using flexible Search API
    this.api.searchQuestions(grade, subject).subscribe({
      next: (response: any) => {
        const data = response.items || [];
        const pairs = data.map((q: any) => ({
          question: q.text,
          answer: q.correctAnswer
        }));

        this.setupGame(pairs);
      },
      error: (err: any) => {
        console.error('Error fetching questions', err);
      }
    });
  }

  setupGame(pairs: any[]) {
    this.totalPairs = pairs.length;
    // Limit to 6 pairs max for UI fit if needed
    const gamePairs = pairs.slice(0, 6);
    this.totalPairs = gamePairs.length;

    this.questions = gamePairs.map((p, i) => ({
      id: i,
      text: p.question,
      matchId: i,
      type: 'question' as const,
      matched: false
    }));

    this.answers = gamePairs.map((p, i) => ({
      id: i + 100,
      text: p.answer,
      matchId: i,
      type: 'answer' as const,
      matched: false
    }));

    this.answers = this.shuffleArray(this.answers);
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
      this.selectedQuestion = item;
    } else {
      this.selectedAnswer = item;
    }

    // Check for match
    if (this.selectedQuestion && this.selectedAnswer) {
      this.checkMatch();
    }
  }

  checkMatch() {
    if (!this.selectedQuestion || !this.selectedAnswer) return;

    if (this.selectedQuestion.matchId === this.selectedAnswer.matchId) {
      // Correct match!
      this.audioService.playCorrect();
      this.selectedQuestion.matched = true;
      this.selectedQuestion.animating = true;
      this.selectedAnswer.matched = true;
      this.selectedAnswer.animating = true;
      this.matchedPairs++;
      this.feedbackMessage = '🎉 ممتاز! مطابقة صحيحة';
      this.feedbackType = 'success';

      if (this.matchedPairs === this.totalPairs) {
        this.gameComplete = true;
        this.audioService.playComplete();
      }
    } else {
      // Wrong match
      this.audioService.playWrong();
      this.feedbackMessage = '❌ حاول مرة أخرى';
      this.feedbackType = 'error';
    }

    // Clear selection after a moment
    setTimeout(() => {
      this.selectedQuestion = null;
      this.selectedAnswer = null;
      this.feedbackMessage = '';
    }, 1000);
  }

  finishGame() {
    sessionStorage.setItem('quizScore', this.matchedPairs.toString());
    sessionStorage.setItem('quizTotal', this.totalPairs.toString());
    this.router.navigate(['/result']);
  }

  goBack() {
    this.router.navigate(['/game-type']);
  }
}
