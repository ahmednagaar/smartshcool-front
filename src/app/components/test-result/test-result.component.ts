import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TestResult } from '../../models/models';

@Component({
    selector: 'app-test-result',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="min-h-screen bg-nafes-cream py-12">
      <div class="container mx-auto px-6">
        <div class="max-w-3xl mx-auto">
          <!-- Result Card -->
          <div class="card-nafes text-center">
            <!-- Pass/Fail Icon -->
            <div class="text-9xl mb-6">
              {{ result?.passed ? '🎉' : '😔' }}
            </div>

            <!-- Status -->
            <h1 class="text-5xl font-bold mb-4" [class.text-green-600]="result?.passed" [class.text-red-600]="!result?.passed">
              {{ result?.passed ? 'نجحت!' : 'لم تنجح هذه المرة' }}
            </h1>

            <!-- Score -->
            <div class="bg-nafes-gold bg-opacity-10 rounded-2xl p-8 mb-8">
              <div class="text-7xl font-bold text-nafes-gold mb-2">{{ result?.score }}%</div>
              <p class="text-xl text-gray-600">درجتك النهائية</p>
            </div>

            <!-- Details -->
            <div class="grid md:grid-cols-2 gap-6 mb-8 text-right">
              <div class="bg-gray-100 rounded-xl p-6">
                <p class="text-gray-600 mb-2">اسم الطالب</p>
                <p class="text-2xl font-bold text-nafes-dark">{{ result?.studentName }}</p>
              </div>

              <div class="bg-gray-100 rounded-xl p-6">
                <p class="text-gray-600 mb-2">الاختبار</p>
                <p class="text-2xl font-bold text-nafes-dark">{{ result?.gameTitle }}</p>
              </div>

              <div class="bg-gray-100 rounded-xl p-6">
                <p class="text-gray-600 mb-2">الوقت المستغرق</p>
                <p class="text-2xl font-bold text-nafes-dark">{{ result?.timeSpent }} دقيقة</p>
              </div>

              <div class="bg-gray-100 rounded-xl p-6">
                <p class="text-gray-600 mb-2">الحالة</p>
                <p class="text-2xl font-bold" [class.text-green-600]="result?.passed" [class.text-red-600]="!result?.passed">
                  {{ result?.passed ? 'ناجح' : 'راسب' }}
                </p>
              </div>
            </div>

            <!-- Message -->
            <div class="mb-8">
              <p *ngIf="result?.passed" class="text-xl text-gray-700">
                أحسنت! لقد أظهرت مستوى ممتازاً في هذا الاختبار. استمر في التدريب!
              </p>
              <p *ngIf="!result?.passed" class="text-xl text-gray-700">
                لا تقلق! يمكنك المحاولة مرة أخرى. التدريب المستمر هو مفتاح النجاح.
              </p>
            </div>

            <!-- Actions -->
            <div class="flex gap-4 justify-center">
              <button (click)="tryAgain()" class="btn-gold">
                حاول مرة أخرى
              </button>
              <button (click)="goHome()" class="px-8 py-4 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400 transition">
                الصفحة الرئيسية
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TestResultComponent implements OnInit {
    result: TestResult | null = null;

    constructor(
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit() {
        // Try to get result from session storage first
        const storedResult = sessionStorage.getItem('lastTestResult');
        if (storedResult) {
            this.result = JSON.parse(storedResult);
        }
    }

    tryAgain() {
        this.router.navigate(['/games']);
    }

    goHome() {
        sessionStorage.clear();
        this.router.navigate(['/']);
    }
}
