import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-speed-round',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="min-h-screen bg-nafes-dark py-8 text-white relative overflow-hidden">
      <!-- Background Particles Effect (Simplified CSS) -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-10 left-10 w-20 h-20 bg-nafes-gold rounded-full blur-xl animate-pulse"></div>
        <div class="absolute bottom-20 right-20 w-32 h-32 bg-purple-500 rounded-full blur-xl animate-pulse" style="animation-delay: 1s"></div>
      </div>

      <div class="container mx-auto px-6 relative z-10">
        <!-- Game Header -->
        <div class="flex justify-between items-center mb-12">
          <div class="text-2xl font-bold">🚀 تحدي السرعة</div>
          
          <!-- Timer -->
          <div class="flex flex-col items-center">
            <div class="text-6xl font-black text-nafes-gold font-mono">{{ timeLeft }}</div>
            <div class="text-sm text-gray-400">ثانية</div>
          </div>

          <!-- Score -->
          <div class="bg-gray-800 px-6 py-3 rounded-xl border border-gray-700">
            <div class="text-sm text-gray-400">النقاط</div>
            <div class="text-2xl font-bold text-green-400">{{ score }}</div>
          </div>
        </div>

        <!-- Before Start -->
        <div *ngIf="!gameStarted && !gameOver" class="text-center py-20">
          <div class="text-8xl mb-8">⚡</div>
          <h1 class="text-5xl font-bold mb-6">هل أنت مستعد؟</h1>
          <p class="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            لديك 60 ثانية للإجابة على أكبر عدد ممكن من الأسئلة. كل إجابة صحيحة تمنحك +10 نقاط. الإجابة الخاطئة تخصم -5 ثواني!
          </p>
          <button (click)="startGame()" class="btn-gold text-2xl px-12 py-6 animate-bounce">
            ابدأ التحدي
          </button>
        </div>

        <!-- Active Game -->
        <div *ngIf="gameStarted && !gameOver" class="max-w-3xl mx-auto">
          <!-- Question -->
          <div class="bg-white text-nafes-dark rounded-2xl p-8 shadow-2xl mb-8 text-center transform transition-all duration-300">
            <h2 class="text-4xl font-bold mb-2">{{ currentQuestion.question }}</h2>
          </div>

          <!-- Options -->
          <div class="grid grid-cols-2 gap-6">
            <button *ngFor="let option of currentQuestion.options" 
                    (click)="answer(option)"
                    class="bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-nafes-gold text-white text-2xl p-6 rounded-xl transition-all active:scale-95">
              {{ option }}
            </button>
          </div>
        </div>

        <!-- Game Over -->
        <div *ngIf="gameOver" class="text-center py-20">
          <div class="text-8xl mb-6">🏁</div>
          <h2 class="text-6xl font-bold text-white mb-4">انتهى الوقت!</h2>
          
          <div class="bg-gray-800 p-8 rounded-2xl max-w-md mx-auto mb-10 border border-gray-700">
            <div class="text-gray-400 mb-2">نتيجتك النهائية</div>
            <div class="text-7xl font-bold text-nafes-gold mb-6">{{ score }}</div>
            
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="bg-gray-900 p-3 rounded-lg">
                <span class="block text-green-400 font-bold text-xl">{{ correctAnswers }}</span>
                <span class="text-gray-500">إجابات صحيحة</span>
              </div>
              <div class="bg-gray-900 p-3 rounded-lg">
                <span class="block text-red-400 font-bold text-xl">{{ wrongAnswers }}</span>
                <span class="text-gray-500">إجابات خاطئة</span>
              </div>
            </div>
          </div>

          <div class="flex justify-center gap-4">
            <button (click)="startGame()" class="btn-gold">
              لعب مرة أخرى
            </button>
            <button (click)="goHome()" class="bg-gray-700 text-white px-8 py-4 rounded-lg font-bold hover:bg-gray-600 transition">
              الخروج
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SpeedRoundComponent implements OnInit, OnDestroy {
    gameStarted = false;
    gameOver = false;
    score = 0;
    timeLeft = 60;
    timer: any;

    correctAnswers = 0;
    wrongAnswers = 0;

    // Mock Question Bank (Math for simplicity)
    currentQuestion: any = {};

    constructor(private router: Router) { }

    ngOnInit() {
        this.generateQuestion();
    }

    ngOnDestroy() {
        clearInterval(this.timer);
    }

    startGame() {
        this.gameStarted = true;
        this.gameOver = false;
        this.score = 0;
        this.timeLeft = 60;
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        this.generateQuestion();

        this.timer = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    endGame() {
        clearInterval(this.timer);
        this.gameStarted = false;
        this.gameOver = true;
    }

    generateQuestion() {
        // Simple arithmetic generator
        const ops = ['+', '-', 'x'];
        const op = ops[Math.floor(Math.random() * ops.length)];
        let n1 = Math.floor(Math.random() * 12) + 1;
        let n2 = Math.floor(Math.random() * 12) + 1;
        let ans = 0;

        if (op === '+') ans = n1 + n2;
        else if (op === '-') {
            if (n1 < n2) [n1, n2] = [n2, n1]; // Ensure positive result
            ans = n1 - n2;
        } else {
            ans = n1 * n2;
        }

        // Generate options
        const options = new Set<number>();
        options.add(ans);
        while (options.size < 4) {
            const offset = Math.floor(Math.random() * 10) - 5;
            const val = ans + (offset === 0 ? 1 : offset);
            if (val >= 0) options.add(val);
        }

        this.currentQuestion = {
            question: `${n1} ${op} ${n2} = ?`,
            answer: ans,
            options: Array.from(options).sort(() => Math.random() - 0.5)
        };
    }

    answer(selected: number) {
        if (selected === this.currentQuestion.answer) {
            this.score += 10;
            this.correctAnswers++;
            // Bonus time for streaks could be added here
        } else {
            this.wrongAnswers++;
            this.timeLeft = Math.max(0, this.timeLeft - 5); // Penalty
            // Shake effect logic could go here
        }
        this.generateQuestion();
    }

    goHome() {
        this.router.navigate(['/']);
    }
}
