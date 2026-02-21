import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export type GameType = 'matching' | 'wheel' | 'dragdrop' | 'flipcards';

interface GameOption {
  value: GameType;
  label: string;
  description: string;
  iconClass: string;
}

@Component({
  selector: 'app-game-type-selection',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-v0-gradient min-h-screen p-4">
      <div class="container max-w-6xl py-8">
        <button (click)="goBack()" class="btn-ghost mb-6">
          <span>→</span>
          رجوع
        </button>

        <div class="text-center mb-10">
          <h2 class="text-3xl md:text-4xl font-bold text-foreground mb-4">اختر اللعبة التفاعلية</h2>
          <p class="text-muted text-lg">اختر اللعبة التي تفضلها للتدريب</p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            *ngFor="let game of games"
            class="game-card"
            (click)="selectGame(game.value)"
          >
            <div class="game-card-icon" [ngClass]="game.iconClass">
              <span *ngIf="game.value === 'matching'">🧩</span>
              <span *ngIf="game.value === 'wheel'">🎡</span>
              <span *ngIf="game.value === 'dragdrop'">↔️</span>
              <span *ngIf="game.value === 'flipcards'">🃏</span>
            </div>
            <div class="space-y-2">
              <h3 class="text-xl font-bold text-foreground">{{ game.label }}</h3>
              <p class="text-sm text-muted leading-relaxed">{{ game.description }}</p>
            </div>
            <button class="btn-primary w-full mt-4">ابدأ اللعب</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class GameTypeSelectionComponent {
  games: GameOption[] = [
    {
      value: 'matching',
      label: 'لعبة المطابقة',
      description: 'اربط الأسئلة بالإجابات الصحيحة',
      iconClass: 'matching'
    },
    {
      value: 'wheel',
      label: 'العجلة الدوارة',
      description: 'أدر العجلة واختبر معلوماتك',
      iconClass: 'wheel'
    },
    {
      value: 'dragdrop',
      label: 'السحب والإفلات',
      description: 'رتب العناصر في المكان الصحيح',
      iconClass: 'dragdrop'
    }
    // Flip Cards game hidden from student UI (code preserved)
    // {
    //     value: 'flipcards',
    //     label: 'بطاقات الذاكرة',
    //     description: 'اقلب البطاقات واكتشف المحتوى',
    //     iconClass: 'flipcards'
    // }
  ];

  constructor(private router: Router) { }

  selectGame(type: GameType) {
    sessionStorage.setItem('gameType', type);
    if (type === 'wheel') {
      this.router.navigate(['/wheel']);
    } else {
      this.router.navigate(['/game', type]);
    }
  }

  goBack() {
    this.router.navigate(['/training-type']);
  }
}
