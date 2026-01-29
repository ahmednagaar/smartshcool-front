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

    constructor(private router: Router) { }

    ngOnInit() {
        // Get result data from session storage
        this.score = parseInt(sessionStorage.getItem('quizScore') || '0');
        this.totalQuestions = parseInt(sessionStorage.getItem('quizTotal') || '0');
        this.studentName = sessionStorage.getItem('studentName') || '';

        if (this.totalQuestions > 0) {
            this.percentage = Math.round((this.score / this.totalQuestions) * 100);
        }
        this.isPassed = this.percentage >= 60;
    }

    tryAgain() {
        // Go back to training type selection
        this.router.navigate(['/training-type']);
    }

    goHome() {
        // Clear session and go home
        sessionStorage.removeItem('quizScore');
        sessionStorage.removeItem('quizTotal');
        this.router.navigate(['/']);
    }
}
