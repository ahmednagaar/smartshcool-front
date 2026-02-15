
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LucideAngularModule, LayoutGrid, ArrowLeft, Pencil, Trash2, Plus, Loader2, BookOpen, HelpCircle } from 'lucide-angular';

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
          <button (click)="openModal()"
                  class="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all duration-300 flex items-center gap-2 self-start hover:scale-105 active:scale-95">
            <lucide-icon [img]="icons.Plus" class="w-5 h-5"></lucide-icon>
            إنشاء اختبار جديد
          </button>
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

        <!-- Divider -->
        <div class="w-full h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent mb-8"></div>

        <!-- ==================== SECTION B: Legacy Game Management ==================== -->
        <div>
          <div class="flex items-center gap-3 mb-2">
            <lucide-icon [img]="icons.HelpCircle" class="w-5 h-5 text-amber-600"></lucide-icon>
            <h2 class="text-xl font-bold text-slate-700 dark:text-slate-200">إدارة الاختبارات المجمّعة</h2>
          </div>
          <p class="text-slate-400 text-sm mb-6 mr-8">إنشاء اختبارات تضم مجموعة من الأسئلة التقليدية</p>

          <!-- Loading State -->
          <div *ngIf="isLoadingGames" class="text-center py-12">
            <span class="inline-block w-10 h-10 border-3 border-amber-300 border-t-transparent rounded-full animate-spin mb-3"></span>
            <p class="text-slate-400">جاري التحميل...</p>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoadingGames && games.length === 0" class="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
            <div class="text-5xl mb-4">🎮</div>
            <p class="text-lg font-bold text-slate-600 dark:text-slate-300 mb-2">لا توجد اختبارات مجمّعة بعد</p>
            <p class="text-slate-400 mb-6">أنشئ اختباراً يجمع أسئلة متعددة في جلسة واحدة</p>
            <button (click)="openModal()" class="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-600 transition">
              + إنشاء أول اختبار
            </button>
          </div>

          <!-- Games Grid -->
          <div *ngIf="!isLoadingGames && games.length > 0"
               class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div *ngFor="let game of games"
                 class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all duration-300">
              <!-- Card Header -->
              <div class="p-5">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <h3 class="font-bold text-lg text-slate-800 dark:text-white">{{ game.title }}</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ game.description || 'لا يوجد وصف' }}</p>
                  </div>
                  <div class="flex gap-1 mr-3">
                    <button (click)="editGame(game)" class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition">
                      <lucide-icon [img]="icons.Pencil" class="w-4 h-4"></lucide-icon>
                    </button>
                    <button (click)="deleteGame(game.id)" class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                      <lucide-icon [img]="icons.Trash2" class="w-4 h-4"></lucide-icon>
                    </button>
                  </div>
                </div>
                <!-- Tags -->
                <div class="flex flex-wrap gap-2 mb-3">
                  <span class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-lg text-xs font-semibold">
                    الصف {{ game.grade }}
                  </span>
                  <span class="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-lg text-xs font-semibold">
                    {{ getSubjectName(game.subject) }}
                  </span>
                  <span class="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg text-xs">
                    ⏱ {{ game.timeLimit }} دقيقة
                  </span>
                  <span class="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg text-xs">
                    ✓ {{ game.passingScore }}% للنجاح
                  </span>
                </div>
                <!-- Question Count -->
                <div class="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <lucide-icon [img]="icons.HelpCircle" class="w-4 h-4 text-amber-500"></lucide-icon>
                  <span class="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {{ game.questionCount || game.questions?.length || 0 }} سؤال
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ==================== MODAL (Kept exactly as-is) ==================== -->
      <div *ngIf="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 animate-modalIn">
          <h2 class="text-2xl font-bold mb-6 text-slate-800 dark:text-white">{{ isEditing ? 'تعديل اختبار' : 'إضافة اختبار جديد' }}</h2>
          
          <div class="grid md:grid-cols-2 gap-8">
            <!-- Game Details Form -->
            <div class="space-y-4">
               <div>
                 <label class="block mb-1 font-bold text-slate-700 dark:text-slate-300">العنوان</label>
                 <input [(ngModel)]="currentGame.title" class="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
               </div>
               <div>
                 <label class="block mb-1 font-bold text-slate-700 dark:text-slate-300">الوصف</label>
                 <textarea [(ngModel)]="currentGame.description" rows="3" class="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"></textarea>
               </div>
               <div class="grid grid-cols-2 gap-4">
                 <div>
                   <label class="block mb-1 font-bold text-slate-700 dark:text-slate-300">الزمن (دقيقة)</label>
                   <input type="number" [(ngModel)]="currentGame.timeLimit" class="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
                 </div>
                 <div>
                   <label class="block mb-1 font-bold text-slate-700 dark:text-slate-300">درجة النجاح %</label>
                   <input type="number" [(ngModel)]="currentGame.passingScore" class="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
                 </div>
               </div>
               <div class="grid grid-cols-2 gap-4">
                 <div>
                   <label class="block mb-1 font-bold text-slate-700 dark:text-slate-300">الصف</label>
                   <select [(ngModel)]="currentGame.grade" (change)="filterQuestions()" class="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
                    <option [value]="3">الصف 3</option>
                    <option [value]="4">الصف 4</option>
                    <option [value]="5">الصف 5</option>
                    <option [value]="6">الصف 6</option>
                   </select>
                 </div>
                 <div>
                   <label class="block mb-1 font-bold text-slate-700 dark:text-slate-300">المادة</label>
                   <select [(ngModel)]="currentGame.subject" (change)="filterQuestions()" class="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
                     <option [value]="1">لغة عربية</option>
                     <option [value]="2">رياضيات</option>
                     <option [value]="3">علوم</option>
                   </select>
                 </div>
               </div>
            </div>

            <!-- Question Picker -->
            <div class="border-r pr-8 border-slate-200 dark:border-slate-700">
               <h3 class="font-bold mb-4 text-slate-700 dark:text-slate-300">اختر الأسئلة ({{ currentGame.questionIds.length }})</h3>
               
               <div class="h-96 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-lg p-2 bg-slate-50 dark:bg-slate-700/50">
                 <div *ngFor="let q of filteredQuestions" class="flex items-start gap-2 p-2 border-b border-slate-100 dark:border-slate-600 bg-white dark:bg-slate-700 mb-2 rounded-lg hover:shadow-sm transition">
                   <input type="checkbox" 
                          [checked]="currentGame.questionIds.includes(q.id)"
                          (change)="toggleQuestion(q.id)"
                          class="mt-1 accent-amber-500">
                   <div>
                     <p class="font-bold text-sm text-slate-800 dark:text-white">{{ q.text }}</p>
                     <div class="text-xs text-slate-500 mt-1">
                       {{ getTypeName(q.type) }} | {{ getSubjectName(q.subject) }}
                     </div>
                   </div>
                 </div>
                 <div *ngIf="filteredQuestions.length === 0" class="text-center p-4 text-slate-500">
                   لا توجد أسئلة تطابق الصف والمادة المحددة.
                 </div>
               </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button (click)="closeModal()" class="px-5 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition">إلغاء</button>
            <button (click)="saveGame()" class="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2.5 rounded-lg font-bold hover:shadow-lg transition">حفظ</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .animate-modalIn { animation: modalIn 0.3s ease-out; }

    .content-card:hover {
      transform: translateY(-4px);
    }
  `]
})
export class AdminGamesComponent implements OnInit {
  games: any[] = [];
  allQuestions: any[] = [];
  filteredQuestions: any[] = [];
  showModal = false;
  isEditing = false;
  isLoadingGames = true;

  readonly icons = { LayoutGrid, ArrowLeft, Pencil, Trash2, Plus, Loader2, BookOpen, HelpCircle };

  // Content Overview counts
  contentOverview = {
    questions: { count: 0, loading: true },
    dragdrop: { count: 0, loading: true },
    matching: { count: 0, loading: true },
    flipcards: { count: 0, loading: true },
    wheel: { count: 0, loading: true }
  };

  currentGame: any = {
    questionIds: [],
    grade: 3,
    subject: 1
  };

  constructor(private api: ApiService, private router: Router) { }

  ngOnInit() {
    this.loadGames();
    this.loadQuestions();
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
        this.contentOverview.flipcards.count = res.count || res || 0;
        this.contentOverview.flipcards.loading = false;
      },
      error: () => {
        // Fallback to paginated
        this.api.getFlipCardQuestionsList({ page: 1, pageSize: 1 }).subscribe({
          next: (r: any) => {
            this.contentOverview.flipcards.count = r.totalCount || r.length || 0;
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

  // ==================== Legacy Game Management (unchanged logic) ====================

  loadGames() {
    this.isLoadingGames = true;
    this.api.getGames().subscribe({
      next: data => {
        this.games = data;
        this.isLoadingGames = false;
      },
      error: () => { this.isLoadingGames = false; }
    });
  }

  loadQuestions() {
    this.api.getQuestions().subscribe(response => {
      this.allQuestions = response.data || [];
      this.filterQuestions();
    });
  }

  filterQuestions() {
    if (!this.currentGame.grade || !this.currentGame.subject) {
      this.filteredQuestions = this.allQuestions;
      return;
    }
    this.filteredQuestions = this.allQuestions.filter(q =>
      q.grade == this.currentGame.grade &&
      q.subject == this.currentGame.subject
    );
  }

  openModal() {
    this.isEditing = false;
    this.currentGame = {
      title: '',
      description: '',
      timeLimit: 10,
      passingScore: 60,
      grade: 3,
      subject: 1,
      questionIds: []
    };
    this.filterQuestions();
    this.showModal = true;
  }

  editGame(game: any) {
    this.isEditing = true;
    this.api.getGameWithQuestions(game.id).subscribe(details => {
      this.currentGame = {
        ...details,
        questionIds: details.questions.map((q: any) => q.questionId)
      };
      this.filterQuestions();
      this.showModal = true;
    });
  }

  saveGame() {
    if (this.isEditing) {
      this.api.updateGame(this.currentGame.id, this.currentGame).subscribe(() => {
        this.loadGames();
        this.closeModal();
      });
    } else {
      this.api.createGame(this.currentGame).subscribe(() => {
        this.loadGames();
        this.closeModal();
      });
    }
  }

  deleteGame(id: number) {
    if (confirm('هل أنت متأكد من حذف هذا الاختبار؟')) {
      this.api.deleteGame(id).subscribe(() => this.loadGames());
    }
  }

  toggleQuestion(questionId: number) {
    const index = this.currentGame.questionIds.indexOf(questionId);
    if (index > -1) {
      this.currentGame.questionIds.splice(index, 1);
    } else {
      this.currentGame.questionIds.push(questionId);
    }
  }

  closeModal() {
    this.showModal = false;
  }

  getGradeName(grade: number): string {
    return `الصف ${grade}`;
  }

  getSubjectName(subject: number): string {
    const subjects: any = { 1: 'لغة عربية', 2: 'رياضيات', 3: 'علوم' };
    return subjects[subject] || 'غير معروف';
  }

  getTypeName(type: number): string {
    const types: any = { 1: 'اختيارات', 2: 'صواب/خطأ', 3: 'توصيل', 4: 'إكمال' };
    return types[type] || 'غير معروف';
  }
}
