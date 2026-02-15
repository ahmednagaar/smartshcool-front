
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LucideAngularModule, LayoutGrid, ArrowLeft, Loader2, BookOpen } from 'lucide-angular';

@Component({
  selector: 'app-admin-games',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div class="container mx-auto max-w-7xl">

        <!-- Page Header -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 class="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <span class="text-3xl">🎮</span>
              إدارة المحتوى التعليمي
            </h1>
            <p class="text-slate-500 dark:text-slate-400 mt-1">
              نظرة شاملة على جميع أنواع المحتوى والألعاب في المنصة
            </p>
          </div>
        </div>

        <!-- ==================== SECTION A: Content Overview Cards ==================== -->
        <div class="mb-10">
          <div class="flex items-center gap-3 mb-2">
            <lucide-icon [img]="icons.LayoutGrid" class="w-5 h-5 text-blue-600"></lucide-icon>
            <h2 class="text-xl font-bold text-slate-700 dark:text-slate-200">نظرة عامة على المحتوى</h2>
          </div>
          <p class="text-slate-400 text-sm mb-6 mr-8">اضغط على أي بطاقة للانتقال إلى إدارتها</p>

          <!-- Cards Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

            <!-- Traditional Questions Card -->
            <div (click)="navigateTo('/admin/questions')"
                 class="content-card group bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border-2 border-transparent hover:border-blue-400 hover:shadow-blue-100 dark:hover:shadow-none cursor-pointer transition-all duration-300">
              <div class="text-center">
                <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📝
                </div>
                <div class="text-3xl font-bold text-slate-800 dark:text-white mb-1">
                  <span *ngIf="!contentOverview.questions.loading">{{ contentOverview.questions.count }}</span>
                  <span *ngIf="contentOverview.questions.loading" class="inline-block w-8 h-8 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></span>
                </div>
                <div class="font-semibold text-slate-600 dark:text-slate-300 text-sm">أسئلة تقليدية</div>
                <div class="text-xs text-slate-400 mt-1">اختيار متعدد، صح/خطأ، فراغ</div>
              </div>
            </div>

            <!-- Drag & Drop Card -->
            <div (click)="navigateTo('/admin/dragdrop-questions')"
                 class="content-card group bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border-2 border-transparent hover:border-emerald-400 hover:shadow-emerald-100 dark:hover:shadow-none cursor-pointer transition-all duration-300">
              <div class="text-center">
                <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🖐️
                </div>
                <div class="text-3xl font-bold text-slate-800 dark:text-white mb-1">
                  <span *ngIf="!contentOverview.dragdrop.loading">{{ contentOverview.dragdrop.count }}</span>
                  <span *ngIf="contentOverview.dragdrop.loading" class="inline-block w-8 h-8 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin"></span>
                </div>
                <div class="font-semibold text-slate-600 dark:text-slate-300 text-sm">سحب وإفلات</div>
                <div class="text-xs text-slate-400 mt-1">لعبة السحب والإفلات التفاعلية</div>
              </div>
            </div>

            <!-- Matching Game Card -->
            <div (click)="navigateTo('/admin/matching-questions')"
                 class="content-card group bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border-2 border-transparent hover:border-purple-400 hover:shadow-purple-100 dark:hover:shadow-none cursor-pointer transition-all duration-300">
              <div class="text-center">
                <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🧩
                </div>
                <div class="text-3xl font-bold text-slate-800 dark:text-white mb-1">
                  <span *ngIf="!contentOverview.matching.loading">{{ contentOverview.matching.count }}</span>
                  <span *ngIf="contentOverview.matching.loading" class="inline-block w-8 h-8 border-2 border-purple-300 border-t-transparent rounded-full animate-spin"></span>
                </div>
                <div class="font-semibold text-slate-600 dark:text-slate-300 text-sm">لعبة المطابقة</div>
                <div class="text-xs text-slate-400 mt-1">وصل الأسئلة بالإجابات الصحيحة</div>
              </div>
            </div>

            <!-- Flip Cards Card -->
            <div (click)="navigateTo('/admin/flipcard-questions')"
                 class="content-card group bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border-2 border-transparent hover:border-orange-400 hover:shadow-orange-100 dark:hover:shadow-none cursor-pointer transition-all duration-300">
              <div class="text-center">
                <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🃏
                </div>
                <div class="text-3xl font-bold text-slate-800 dark:text-white mb-1">
                  <span *ngIf="!contentOverview.flipcards.loading">{{ contentOverview.flipcards.count }}</span>
                  <span *ngIf="contentOverview.flipcards.loading" class="inline-block w-8 h-8 border-2 border-orange-300 border-t-transparent rounded-full animate-spin"></span>
                </div>
                <div class="font-semibold text-slate-600 dark:text-slate-300 text-sm">بطاقات القلب</div>
                <div class="text-xs text-slate-400 mt-1">لعبة الذاكرة والمطابقة</div>
              </div>
            </div>

            <!-- Wheel Card -->
            <div (click)="navigateTo('/admin/wheel-questions')"
                 class="content-card group bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border-2 border-transparent hover:border-pink-400 hover:shadow-pink-100 dark:hover:shadow-none cursor-pointer transition-all duration-300">
              <div class="text-center">
                <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🎡
                </div>
                <div class="text-3xl font-bold text-slate-800 dark:text-white mb-1">
                  <span *ngIf="!contentOverview.wheel.loading">{{ contentOverview.wheel.count }}</span>
                  <span *ngIf="contentOverview.wheel.loading" class="inline-block w-8 h-8 border-2 border-pink-300 border-t-transparent rounded-full animate-spin"></span>
                </div>
                <div class="font-semibold text-slate-600 dark:text-slate-300 text-sm">عجلة الحظ</div>
                <div class="text-xs text-slate-400 mt-1">أسئلة عجلة الدوران</div>
              </div>
            </div>

          </div>

          <!-- Total Summary Bar -->
          <div class="mt-4 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <lucide-icon [img]="icons.BookOpen" class="w-5 h-5 text-blue-600"></lucide-icon>
              <span class="font-bold text-slate-600 dark:text-slate-300">إجمالي المحتوى:</span>
              <span class="text-xl font-bold text-blue-600">
                {{ totalContent }} عنصر
              </span>
            </div>
            <div class="flex flex-wrap gap-3 text-xs text-slate-500">
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                أسئلة: {{ contentOverview.questions.count }}
              </span>
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                سحب وإفلات: {{ contentOverview.dragdrop.count }}
              </span>
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-purple-500"></span>
                مطابقة: {{ contentOverview.matching.count }}
              </span>
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-orange-500"></span>
                بطاقات: {{ contentOverview.flipcards.count }}
              </span>
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-pink-500"></span>
                عجلة: {{ contentOverview.wheel.count }}
              </span>
            </div>
          </div>
        </div>


      </div>
    </div>
  `,
  styles: [`
    .content-card:hover {
      transform: translateY(-4px);
    }
  `]
})
export class AdminGamesComponent implements OnInit {
  readonly icons = { LayoutGrid, ArrowLeft, Loader2, BookOpen };

  // Content Overview counts
  contentOverview = {
    questions: { count: 0, loading: true },
    dragdrop: { count: 0, loading: true },
    matching: { count: 0, loading: true },
    flipcards: { count: 0, loading: true },
    wheel: { count: 0, loading: true }
  };

  constructor(private api: ApiService, private router: Router) { }

  ngOnInit() {
    this.loadContentOverview();
  }

  get totalContent(): number {
    return this.contentOverview.questions.count
      + this.contentOverview.dragdrop.count
      + this.contentOverview.matching.count
      + this.contentOverview.flipcards.count
      + this.contentOverview.wheel.count;
  }

  // ==================== Content Overview Loading ====================

  loadContentOverview() {
    // Traditional Questions
    this.api.getQuestionStats().subscribe({
      next: (stats: any) => {
        this.contentOverview.questions.count = stats.totalCount || 0;
        this.contentOverview.questions.loading = false;
      },
      error: () => { this.contentOverview.questions.loading = false; }
    });

    // DragDrop
    this.api.getDragDropQuestionsList({ page: 1, pageSize: 1 }).subscribe({
      next: (res: any) => {
        this.contentOverview.dragdrop.count = res.totalCount || res.length || 0;
        this.contentOverview.dragdrop.loading = false;
      },
      error: () => { this.contentOverview.dragdrop.loading = false; }
    });

    // Matching
    this.api.getMatchingGamesList({ page: 1, pageSize: 1 }).subscribe({
      next: (res: any) => {
        this.contentOverview.matching.count = res.totalCount || res.length || 0;
        this.contentOverview.matching.loading = false;
      },
      error: () => { this.contentOverview.matching.loading = false; }
    });

    // FlipCard (has dedicated count endpoint)
    this.api.getFlipCardQuestionsCount().subscribe({
      next: (res: any) => {
        this.contentOverview.flipcards.count = typeof res === 'number' ? res : (res.count ?? res.totalCount ?? 0);
        this.contentOverview.flipcards.loading = false;
      },
      error: () => {
        // Fallback to paginated
        this.api.getFlipCardQuestionsList({ page: 1, pageSize: 1 }).subscribe({
          next: (r: any) => {
            this.contentOverview.flipcards.count = typeof r === 'number' ? r : (r.totalCount ?? r.count ?? r.length ?? 0);
            this.contentOverview.flipcards.loading = false;
          },
          error: () => { this.contentOverview.flipcards.loading = false; }
        });
      }
    });

    // Wheel
    this.api.getWheelQuestionsList({ page: 1, pageSize: 1 }).subscribe({
      next: (res: any) => {
        this.contentOverview.wheel.count = res.totalCount || res.length || 0;
        this.contentOverview.wheel.loading = false;
      },
      error: () => { this.contentOverview.wheel.loading = false; }
    });
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }


}
