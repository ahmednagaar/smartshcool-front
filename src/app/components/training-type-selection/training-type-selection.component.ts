import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export type TrainingType = 'traditional' | 'interactive';

@Component({
  selector: 'app-training-type-selection',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-v0-gradient min-h-screen p-4">
      <div class="container max-w-5xl py-8">
        <button (click)="goBack()" class="btn-ghost mb-6">
          <span>→</span>
          رجوع
        </button>

        <div class="text-center mb-10">
          <h2 class="text-3xl md:text-4xl font-bold text-foreground mb-4">اختر طريقة التدريب</h2>
          <p class="text-muted text-lg">اختر الطريقة المناسبة لك</p>
        </div>

        <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <!-- Traditional Quiz -->
          <div
            class="training-card traditional"
            (click)="selectType('traditional')"
          >
            <div class="training-card-icon traditional">
              <span>❓</span>
            </div>
            <div class="space-y-3">
              <h3 class="text-2xl font-bold text-foreground">الاختبار التقليدي</h3>
              <p class="text-muted leading-relaxed">
                أسئلة شاملة مع صور توضيحية تشبه الاختبارات المركزية الفعلية
              </p>
            </div>
            <button class="btn-primary w-full mt-6">ابدأ الاختبار</button>
          </div>

          <!-- Interactive Games -->
          <div
            class="training-card interactive"
            (click)="selectType('interactive')"
          >
            <div class="training-card-icon interactive">
              <span>🎮</span>
            </div>
            <div class="space-y-3">
              <h3 class="text-2xl font-bold text-foreground">ألعاب تفاعلية تعليمية</h3>
              <p class="text-muted leading-relaxed">
                تعلّم بطريقة ممتعة من خلال ألعاب تفاعلية متنوعة
              </p>
            </div>
            <button class="btn-secondary w-full mt-6">ابدأ الألعاب</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TrainingTypeSelectionComponent {

  constructor(private router: Router) { }

  selectType(type: TrainingType) {
    sessionStorage.setItem('trainingType', type);
    if (type === 'traditional') {
      this.router.navigate(['/quiz']);
    } else {
      this.router.navigate(['/game-type']);
    }
  }

  goBack() {
    this.router.navigate(['/subject']);
  }
}
