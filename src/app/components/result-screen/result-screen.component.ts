import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-result-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-v0-gradient min-h-screen p-4 flex items-center justify-center">
      <div class="max-w-2xl w-full">
        <div class="card-v0 p-8 md:p-12 text-center space-y-8">
          <!-- Result Icon -->
          <div class="text-8xl">
            {{ isPassed ? '🎉' : '💪' }}
          </div>

          <!-- Result Message -->
          <div class="space-y-4">
            <h2 class="text-3xl md:text-4xl font-bold" [ngClass]="isPassed ? 'text-accent' : 'text-secondary'">
              {{ isPassed ? 'أحسنت! نتيجة رائعة' : 'حاول مرة أخرى' }}
            </h2>
            
            <p class="text-xl text-muted">
              {{ studentName ? 'الطالب: ' + studentName : '' }}
            </p>
          </div>

          <!-- Score Display -->
          <div class="bg-background rounded-2xl p-6 border-2 border-border">
            <!-- Matching Game Score Display -->
            <ng-container *ngIf="gameType === 'matching'">
              <!-- Games Played Badge -->
              <div *ngIf="gamesPlayed > 1" class="mb-4 bg-indigo-100 text-indigo-800 rounded-lg py-2 px-4 inline-block">
                <span class="font-bold">🎮 أكملت {{ gamesPlayed }} مجموعات</span>
              </div>
              
              <div class="grid grid-cols-3 gap-3 mb-4">
                <div class="bg-slate-50 p-4 rounded-xl">
                  <div class="text-sm text-slate-500 font-bold">النقاط الإجمالية</div>
                  <div class="text-3xl font-black text-indigo-600">{{ score }}</div>
                </div>
                <div class="bg-slate-50 p-4 rounded-xl">
                  <div class="text-sm text-slate-500 font-bold">المطابقات</div>
                  <div class="text-3xl font-black text-green-600">{{ totalQuestions }}</div>
                </div>
                <div class="bg-slate-50 p-4 rounded-xl">
                  <div class="text-sm text-slate-500 font-bold">الوقت</div>
                  <div class="text-3xl font-black text-purple-600">{{ formatTime(timeSpent) }}</div>
                </div>
              </div>
              
              <div class="flex gap-2 text-yellow-500 justify-center text-3xl">
                <span *ngFor="let star of [1,2,3]" [class.grayscale]="star > starRating">⭐</span>
              </div>
            </ng-container>

            <!-- Standard Quiz Score Display -->
            <ng-container *ngIf="gameType !== 'matching'">
              <div class="text-6xl font-bold" [ngClass]="isPassed ? 'text-accent' : 'text-secondary'">
                {{ score }} / {{ totalQuestions }}
              </div>
              <p class="text-lg text-muted mt-2">النتيجة النهائية</p>
              <div class="mt-4 bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all duration-500"
                  [ngClass]="isPassed ? 'bg-accent' : 'bg-secondary'"
                  [style.width.%]="percentage"
                ></div>
              </div>
              <p class="text-2xl font-bold mt-2" [ngClass]="isPassed ? 'text-accent' : 'text-secondary'">
                {{ percentage }}%
              </p>
            </ng-container>
          </div>

          <!-- Actions -->
          <div class="flex gap-4 flex-col sm:flex-row justify-center">
            <button (click)="tryAgain()" class="btn-primary text-xl py-4 px-8">
              حاول مرة أخرى
            </button>
            <button (click)="goHome()" class="btn-outline text-xl py-4 px-8">
              العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ResultScreenComponent implements OnInit {
  score: number = 0;
  totalQuestions: number = 0;
  percentage: number = 0;
  isPassed: boolean = false;
  studentName: string = '';
  gameType: string = '';
  starRating: number = 0;
  timeSpent: number = 0;
  gamesPlayed: number = 0;

  constructor(private router: Router) { }

  ngOnInit() {
    // Get result data from session storage
    this.score = parseInt(sessionStorage.getItem('quizScore') || '0');
    this.totalQuestions = parseInt(sessionStorage.getItem('quizTotal') || '0');
    this.studentName = sessionStorage.getItem('studentName') || '';
    this.gameType = sessionStorage.getItem('gameType') || '';
    this.starRating = parseInt(sessionStorage.getItem('starRating') || '0');
    this.timeSpent = parseInt(sessionStorage.getItem('timeSpent') || '0');
    this.gamesPlayed = parseInt(sessionStorage.getItem('gamesPlayed') || '1');

    if (this.gameType === 'matching') {
      // For matching game, calculate success based on score and matches
      // Consider passed if they scored at least 60% (10 points per match)
      const expectedScore = this.totalQuestions * 10;
      this.percentage = expectedScore > 0 ? Math.round((this.score / expectedScore) * 100) : 0;
      this.isPassed = this.percentage >= 60;
    } else {
      // Standard quiz calculation
      if (this.totalQuestions > 0) {
        this.percentage = Math.round((this.score / this.totalQuestions) * 100);
      }
      this.isPassed = this.percentage >= 60;
    }
  }

  tryAgain() {
    // Go back to game type selection to play matching again
    this.router.navigate(['/game-type']);
  }

  goHome() {
    // Clear session and go home
    sessionStorage.removeItem('quizScore');
    sessionStorage.removeItem('quizTotal');
    sessionStorage.removeItem('gameType');
    sessionStorage.removeItem('starRating');
    sessionStorage.removeItem('timeSpent');
    sessionStorage.removeItem('gamesPlayed');
    this.router.navigate(['/']);
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}


