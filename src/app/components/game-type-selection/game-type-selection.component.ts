import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export type GameType = 'matching' | 'wheel' | 'dragdrop' | 'flipcards';

interface GameOption {
  value: GameType;
  label: string;
  description: string;
  emoji: string;
  gradient: string;
  glowColor: string;
  features: string[];
}

@Component({
  selector: 'app-game-type-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-type-selection.component.html',
  styleUrls: ['./game-type-selection.component.css']
})
export class GameTypeSelectionComponent {
  games: GameOption[] = [
    {
      value: 'matching',
      label: 'لعبة المطابقة',
      description: 'اربط كل سؤال بالإجابة الصحيحة واختبر سرعتك في التفكير!',
      emoji: '🧩',
      gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
      glowColor: 'rgba(59, 130, 246, 0.35)',
      features: ['تحدي الوقت', 'مستويات متعددة']
    },
    {
      value: 'wheel',
      label: 'العجلة الدوارة',
      description: 'أدر العجلة واختبر معلوماتك مع أسئلة عشوائية ممتعة!',
      emoji: '🎡',
      gradient: 'linear-gradient(135deg, #a855f7, #ec4899)',
      glowColor: 'rgba(168, 85, 247, 0.35)',
      features: ['أسئلة عشوائية', 'مفاجآت ممتعة']
    },
    {
      value: 'dragdrop',
      label: 'السحب والإفلات',
      description: 'رتّب العناصر في المكان الصحيح واكتشف قدراتك في التصنيف!',
      emoji: '🎯',
      gradient: 'linear-gradient(135deg, #22c55e, #10b981)',
      glowColor: 'rgba(34, 197, 94, 0.35)',
      features: ['تصنيف ذكي', 'تلميحات مساعدة']
    }
    // Flip Cards game hidden from student UI (code preserved)
    // {
    //     value: 'flipcards',
    //     label: 'بطاقات الذاكرة',
    //     description: 'اقلب البطاقات واكتشف المحتوى',
    //     emoji: '🃏',
    //     gradient: 'linear-gradient(135deg, #f97316, #ef4444)',
    //     glowColor: 'rgba(249, 115, 22, 0.35)',
    //     features: ['تنشيط الذاكرة', 'بطاقات ملونة']
    // }
  ];

  hoveredGame: GameType | null = null;

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

  onCardHover(type: GameType) {
    this.hoveredGame = type;
  }

  onCardLeave() {
    this.hoveredGame = null;
  }
}
