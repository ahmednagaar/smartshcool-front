import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { SmartQuestionEditorComponent } from './smart-question-editor.component';
import { QuestionPreviewComponent } from './question-preview.component';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

type QuestionStatus = 'all' | 'active' | 'draft' | 'inactive';
type SortField = 'createdDate' | 'text' | 'grade' | 'subject' | 'type';
type SortDirection = 'asc' | 'desc';

interface QuestionFilter {
  search: string;
  grade: number | null;
  subject: number | null;
  type: number | null;
  difficulty: number | null;
  status: QuestionStatus;
}

@Component({
  selector: 'app-admin-questions',
  standalone: true,
  imports: [CommonModule, FormsModule, SmartQuestionEditorComponent, QuestionPreviewComponent, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div class="container mx-auto max-w-7xl">
        
        <!-- Page Header -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 class="text-3xl font-bold text-nafes-dark flex items-center gap-3">
              📚 إدارة الأسئلة
              <span class="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">v2.0</span>
            </h1>
            <p class="text-gray-500 mt-1">إضافة وتعديل وإدارة بنك الأسئلة</p>
          </div>
          <a routerLink="/admin/dashboard" 
             class="inline-flex items-center gap-2 bg-white text-gray-700 border-2 border-gray-200 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm">
            🏠 الرئيسية
          </a>
        </div>

        <!-- Stats Overview -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="bg-white p-5 rounded-xl shadow-sm border-r-4 border-nafes-gold hover:shadow-md transition">
            <h3 class="text-gray-500 text-sm font-medium mb-1">إجمالي الأسئلة</h3>
            <p class="text-3xl font-bold text-nafes-dark">{{ pagination.totalCount }}</p>
          </div>
          <div class="bg-white p-5 rounded-xl shadow-sm border-r-4 border-green-500 hover:shadow-md transition">
            <h3 class="text-gray-500 text-sm font-medium mb-1">فعالة</h3>
            <p class="text-3xl font-bold text-green-600">{{ stats.active }}</p>
          </div>
          <div class="bg-white p-5 rounded-xl shadow-sm border-r-4 border-blue-500 hover:shadow-md transition">
            <h3 class="text-gray-500 text-sm font-medium mb-1">مسودات</h3>
            <p class="text-3xl font-bold text-blue-600">{{ stats.draft }}</p>
          </div>
          <div class="bg-white p-5 rounded-xl shadow-sm border-r-4 border-red-500 hover:shadow-md transition">
            <h3 class="text-gray-500 text-sm font-medium mb-1">غير فعالة</h3>
            <p class="text-3xl font-bold text-red-600">{{ stats.inactive }}</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center gap-3 mb-6">
          <button (click)="navigateToAddQuestion()" 
                  class="bg-nafes-gold text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95">
            <span class="text-xl">+</span> إضافة سؤال جديد
          </button>
          
          <button (click)="openImportModal()" 
                  class="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition shadow-lg flex items-center gap-2">
            📥 استيراد
          </button>
          
          <button (click)="exportQuestions('json')" 
                  class="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-opacity-90 transition shadow-lg flex items-center gap-2">
            📤 تصدير JSON
          </button>
          
          <button (click)="exportQuestions('csv')" 
                  class="bg-purple-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-opacity-90 transition shadow-lg flex items-center gap-2">
            📊 تصدير CSV
          </button>
          
          <!-- Bulk Actions (visible when items selected) -->
          <div *ngIf="selectedIds.length > 0" class="flex gap-2 mr-auto">
            <span class="text-sm text-gray-600 self-center">
              {{ selectedIds.length }} محدد
            </span>
            <button (click)="bulkDelete()" 
                    class="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-opacity-90 transition flex items-center gap-1">
              🗑️ حذف
            </button>
            <button (click)="selectedIds = []" 
                    class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-300 transition">
              إلغاء التحديد
            </button>
          </div>
        </div>

        <!-- Filters & Search -->
        <div class="bg-white p-4 rounded-xl shadow-sm mb-4">
          <div class="flex flex-wrap gap-3 items-center">
            
            <!-- Search -->
            <div class="flex-1 min-w-[200px] relative">
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input type="text" 
                     [(ngModel)]="filter.search" 
                     (keyup.enter)="onFilterChange()" 
                     placeholder="بحث في الأسئلة..." 
                     class="w-full pl-3 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-nafes-gold focus:border-nafes-gold">
            </div>
            
            <!-- Grade Filter -->
            <select [(ngModel)]="filter.grade" 
                    (change)="onFilterChange()" 
                    class="p-2.5 border rounded-lg bg-white min-w-[120px]">
              <option [ngValue]="null">كل الصفوف</option>
              <option [value]="3">الصف 3</option>
              <option [value]="4">الصف 4</option>
              <option [value]="5">الصف 5</option>
              <option [value]="6">الصف 6</option>
            </select>
            
            <!-- Subject Filter -->
            <select [(ngModel)]="filter.subject" 
                    (change)="onFilterChange()" 
                    class="p-2.5 border rounded-lg bg-white min-w-[120px]">
              <option [ngValue]="null">كل المواد</option>
              <option [value]="1">لغة عربية</option>
              <option [value]="2">رياضيات</option>
              <option [value]="3">علوم</option>
            </select>
            
            <!-- Type Filter -->
            <select [(ngModel)]="filter.type" 
                    (change)="onFilterChange()" 
                    class="p-2.5 border rounded-lg bg-white min-w-[140px]">
              <option [ngValue]="null">كل الأنواع</option>
              <option [value]="1">اختيار من متعدد</option>
              <option [value]="2">صواب/خطأ</option>
              <option [value]="4">أكمل الفراغ</option>
              <option [value]="5">سحب وإفلات</option>
            </select>
            
            <!-- Difficulty Filter -->
            <select [(ngModel)]="filter.difficulty" 
                    (change)="onFilterChange()" 
                    class="p-2.5 border rounded-lg bg-white min-w-[100px]">
              <option [ngValue]="null">الصعوبة</option>
              <option [value]="1">سهل</option>
              <option [value]="2">متوسط</option>
              <option [value]="3">صعب</option>
            </select>
            
            <!-- Search Button -->
            <button (click)="onFilterChange()" 
                    class="bg-nafes-dark text-white px-5 py-2.5 rounded-lg hover:bg-opacity-90 transition font-bold">
              بحث
            </button>
            
            <!-- Clear Filters -->
            <button *ngIf="hasActiveFilters" 
                    (click)="clearFilters()" 
                    class="text-gray-500 hover:text-red-500 transition px-2">
              ✕ مسح
            </button>
          </div>
          
          <!-- Active Filters Tags -->
          <div *ngIf="hasActiveFilters" class="flex flex-wrap gap-2 mt-3 pt-3 border-t">
            <span *ngIf="filter.grade" 
                  class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
              الصف {{ filter.grade }}
              <button (click)="filter.grade = null; onFilterChange()" class="hover:text-red-500">×</button>
            </span>
            <span *ngIf="filter.subject" 
                  class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
              {{ getSubjectName(filter.subject) }}
              <button (click)="filter.subject = null; onFilterChange()" class="hover:text-red-500">×</button>
            </span>
            <span *ngIf="filter.type" 
                  class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
              {{ getTypeName(filter.type) }}
              <button (click)="filter.type = null; onFilterChange()" class="hover:text-red-500">×</button>
            </span>
            <span *ngIf="filter.search" 
                  class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
              "{{ filter.search }}"
              <button (click)="filter.search = ''; onFilterChange()" class="hover:text-red-500">×</button>
            </span>
          </div>
        </div>

        <!-- Questions Table -->
        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          
          <!-- Table Header -->
          <div class="overflow-x-auto">
            <table class="w-full text-right">
              <thead class="bg-gray-50 border-b-2 border-gray-100">
                <tr>
                  <th class="p-4 w-12">
                    <input type="checkbox" 
                           [checked]="allSelected" 
                           (change)="toggleSelectAll()" 
                           class="w-4 h-4 rounded text-nafes-gold focus:ring-nafes-gold cursor-pointer"
                           aria-label="تحديد الكل">
                  </th>
                  <th class="p-4 text-sm font-bold text-gray-600 cursor-pointer hover:text-nafes-gold transition"
                      (click)="toggleSort('text')">
                    النص
                    <span *ngIf="sortField === 'text'" class="mr-1">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </th>
                  <th class="p-4 text-sm font-bold text-gray-600 cursor-pointer hover:text-nafes-gold transition w-40"
                      (click)="toggleSort('grade')">
                    التفاصيل
                    <span *ngIf="sortField === 'grade'" class="mr-1">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </th>
                  <th class="p-4 text-sm font-bold text-gray-600 w-32">الحالة</th>
                  <th class="p-4 text-sm font-bold text-gray-600 w-40 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr *ngFor="let q of questions; trackBy: trackByQuestion" 
                    class="hover:bg-blue-50/50 transition group"
                    [class.bg-blue-50]="selectedIds.includes(q.id)">
                  
                  <!-- Checkbox -->
                  <td class="p-4">
                    <input type="checkbox" 
                           [checked]="selectedIds.includes(q.id)" 
                           (change)="toggleSelection(q.id)" 
                           class="w-4 h-4 rounded text-nafes-gold focus:ring-nafes-gold cursor-pointer">
                  </td>
                  
                  <!-- Question Text -->
                  <td class="p-4">
                    <p class="font-medium text-gray-800 line-clamp-2 leading-relaxed">{{ q.text }}</p>
                    <div class="flex gap-2 mt-2 text-xs text-gray-400">
                      <span>{{ q.createdDate | date:'shortDate' }}</span>
                      <span *ngIf="q.mediaUrl" class="text-blue-500">📎 وسائط</span>
                    </div>
                  </td>
                  
                  <!-- Details -->
                  <td class="p-4">
                    <div class="flex flex-col gap-1.5">
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                            [ngClass]="getTypeBadgeClass(q.type)">
                        {{ getTypeIcon(q.type) }} {{ getTypeName(q.type) }}
                      </span>
                      <span class="text-xs text-gray-500">
                        {{ getGradeName(q.grade) }} • {{ getSubjectName(q.subject) }}
                      </span>
                      <span class="text-xs"
                            [ngClass]="getDifficultyClass(q.difficulty)">
                        {{ getDifficultyName(q.difficulty) }}
                      </span>
                    </div>
                  </td>
                  
                  <!-- Status -->
                  <td class="p-4">
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                          [ngClass]="getStatusBadgeClass(q)">
                      {{ getStatusIcon(q) }} {{ getStatusText(q) }}
                    </span>
                  </td>
                  
                  <!-- Actions -->
                  <td class="p-4">
                    <div class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button (click)="previewQuestion(q)" 
                              title="معاينة" 
                              class="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition">
                        👁️
                      </button>
                      <button (click)="viewAnalytics(q.id)" 
                              title="تحليلات" 
                              class="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 transition">
                        📊
                      </button>
                      <button (click)="navigateToEditQuestion(q)" 
                              title="تعديل" 
                              class="p-2 rounded-lg bg-nafes-gold/10 hover:bg-nafes-gold/20 text-nafes-gold transition">
                        ✏️
                      </button>
                      <button (click)="deleteQuestion(q.id)" 
                              title="حذف" 
                              class="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
                
                <!-- Empty State -->
                <tr *ngIf="questions.length === 0 && !isLoading">
                  <td colspan="5" class="p-16 text-center">
                    <div class="flex flex-col items-center justify-center">
                      <span class="text-6xl mb-4">🔍</span>
                      <p class="text-xl text-gray-500 mb-2">لا توجد أسئلة</p>
                      <p class="text-gray-400 mb-4">{{ hasActiveFilters ? 'جرب تغيير معايير البحث' : 'ابدأ بإضافة سؤالك الأول' }}</p>
                      <button (click)="navigateToAddQuestion()" 
                              class="mt-2 bg-nafes-gold text-white px-6 py-2 rounded-lg font-bold hover:bg-opacity-90 transition">
                        + إضافة سؤال
                      </button>
                    </div>
                  </td>
                </tr>
                
                <!-- Loading State -->
                <tr *ngIf="isLoading">
                  <td colspan="5" class="p-16 text-center">
                    <div class="flex flex-col items-center justify-center">
                      <div class="animate-spin w-10 h-10 border-4 border-nafes-gold border-t-transparent rounded-full mb-4"></div>
                      <p class="text-gray-500">جاري التحميل...</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Pagination -->
          <div class="bg-gray-50 p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
            <div class="flex items-center gap-3 text-sm text-gray-600">
              <span>عرض:</span>
              <select [(ngModel)]="pagination.pageSize" 
                      (change)="onFilterChange()" 
                      class="border rounded-lg p-1.5 bg-white">
                <option [value]="10">10</option>
                <option [value]="25">25</option>
                <option [value]="50">50</option>
                <option [value]="100">100</option>
              </select>
              <span>من أصل {{ pagination.totalCount }} سؤال</span>
            </div>
            
            <div class="flex items-center gap-2">
              <button (click)="onPageChange(1)" 
                      [disabled]="pagination.page === 1" 
                      class="px-3 py-2 border rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition">
                ⟪
              </button>
              <button (click)="onPageChange(pagination.page - 1)" 
                      [disabled]="pagination.page === 1" 
                      class="px-4 py-2 border rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold">
                السابق
              </button>
              
              <div class="flex items-center gap-1.5 px-2">
                <ng-container *ngFor="let p of getVisiblePages()">
                  <button *ngIf="p !== '...'" 
                          (click)="onPageChange(+p)"
                          [class.bg-nafes-gold]="pagination.page === +p"
                          [class.text-white]="pagination.page === +p"
                          class="w-10 h-10 border rounded-lg hover:bg-gray-100 transition font-bold">
                    {{ p }}
                  </button>
                  <span *ngIf="p === '...'" class="px-2 text-gray-400">...</span>
                </ng-container>
              </div>
              
              <button (click)="onPageChange(pagination.page + 1)" 
                      [disabled]="pagination.page >= pagination.totalPages" 
                      class="px-4 py-2 border rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold">
                التالي
              </button>
              <button (click)="onPageChange(pagination.totalPages)" 
                      [disabled]="pagination.page >= pagination.totalPages" 
                      class="px-3 py-2 border rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition">
                ⟫
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Editor Modal -->
      <div *ngIf="showModal" 
           class="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
           (click)="onBackdropClick($event)">
        <div class="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl animate-modalIn"
             (click)="$event.stopPropagation()">
          
          <!-- Modal Header -->
          <div class="p-6 border-b flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
            <div>
              <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
                {{ isEditing ? '✏️ تعديل السؤال' : '➕ إضافة سؤال جديد' }}
              </h2>
              <p class="text-sm text-gray-500 mt-1">استخدم المحرر الذكي لكتابة السؤال ومشاهدة المعاينة الحية</p>
            </div>
            <div class="flex gap-3">
              <button (click)="closeModal()" 
                      class="px-6 py-2 border-2 border-gray-200 rounded-xl hover:bg-gray-100 font-bold transition">
                إلغاء
              </button>
              <button (click)="saveQuestion()" 
                      [disabled]="!isValid || isSaving" 
                      class="bg-nafes-gold text-white px-8 py-2 rounded-xl font-bold hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2">
                <span *ngIf="isSaving" class="animate-spin">⏳</span>
                {{ isEditing ? 'حفظ التغييرات' : 'نشر السؤال' }}
              </button>
            </div>
          </div>

          <!-- Modal Body (Split View) -->
          <div class="flex-1 overflow-hidden flex flex-col md:flex-row">
            
            <!-- Left: Editor & Settings -->
            <div class="w-full md:w-1/2 p-6 overflow-y-auto border-l">
              
              <!-- Metadata (Compact Grid) -->
              <div class="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">الصف</label>
                  <select [(ngModel)]="currentQuestion.grade" 
                          class="w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-nafes-gold">
                    <option [value]="3">الصف 3</option>
                    <option [value]="4">الصف 4</option>
                    <option [value]="5">الصف 5</option>
                    <option [value]="6">الصف 6</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">المادة</label>
                  <select [(ngModel)]="currentQuestion.subject" 
                          class="w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-nafes-gold">
                    <option [value]="1">لغة عربية</option>
                    <option [value]="2">رياضيات</option>
                    <option [value]="3">علوم</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">الصعوبة</label>
                  <select [(ngModel)]="currentQuestion.difficulty" 
                          class="w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-nafes-gold">
                    <option [value]="1">🟢 سهل</option>
                    <option [value]="2">🟡 متوسط</option>
                    <option [value]="3">🔴 صعب</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">نوع الاختبار</label>
                  <select [(ngModel)]="currentQuestion.testType" 
                          class="w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-nafes-gold">
                    <option [value]="1">نافس</option>
                    <option [value]="2">مركزي</option>
                  </select>
                </div>
              </div>
              
              <!-- Question Type Display -->
              <div class="mb-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <span class="text-sm text-gray-600">
                  <span class="font-bold">النوع:</span> {{ getTypeName(currentQuestion.type) }}
                </span>
                <span class="text-xs text-gray-400">(يتم اكتشافه تلقائياً)</span>
              </div>

              <!-- Smart Editor Component -->
              <div class="mb-6">
                <label class="block text-sm font-bold text-gray-700 mb-2">محتوى السؤال</label>
                <app-smart-question-editor 
                  [initialValue]="currentQuestion" 
                  (statusChange)="onEditorChange($event)">
                </app-smart-question-editor>
              </div>

            </div>

            <!-- Right: Live Preview -->
            <div class="w-full md:w-1/2 bg-gray-50 p-6 flex flex-col">
              <app-question-preview [question]="currentQuestion"></app-question-preview>
            </div>

          </div>
        </div>
      </div>

      <!-- Preview Modal -->
      <div *ngIf="showPreviewModal" 
           class="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
           (click)="showPreviewModal = false">
        <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
             (click)="$event.stopPropagation()">
          <div class="p-4 border-b flex justify-between items-center">
            <h3 class="text-lg font-bold">معاينة السؤال</h3>
            <button (click)="showPreviewModal = false" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          <div class="p-6">
            <app-question-preview [question]="previewQuestionData"></app-question-preview>
          </div>
        </div>
      </div>

      <!-- Analytics Modal -->
      <div *ngIf="showAnalyticsModal" 
           class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
           (click)="showAnalyticsModal = false">
        <div class="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl"
             (click)="$event.stopPropagation()">
          <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
            📊 تحليلات السؤال #{{ analyticsData?.Id }}
          </h3>
          <div *ngIf="analyticsData" class="space-y-4">
            <div class="flex justify-between items-center border-b pb-3">
              <span class="text-gray-600">عدد المحاولات</span>
              <span class="font-bold text-lg">{{ analyticsData.UsageCount }}</span>
            </div>
            <div class="flex justify-between items-center border-b pb-3">
              <span class="text-gray-600">معدل النجاح</span>
              <span class="font-bold text-lg text-green-600">{{ analyticsData.SuccessRate }}%</span>
            </div>
            <div class="flex justify-between items-center border-b pb-3">
              <span class="text-gray-600">متوسط الوقت</span>
              <span class="font-bold text-lg">{{ analyticsData.AvgTimeSeconds }} ثانية</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">مستوى الصعوبة</span>
              <span class="font-bold">{{ analyticsData.DifficultyRating }}</span>
            </div>
          </div>
          <button (click)="showAnalyticsModal = false" 
                  class="mt-6 w-full bg-gray-100 py-3 rounded-lg font-bold hover:bg-gray-200 transition">
            إغلاق
          </button>
        </div>
      </div>

      <!-- Import Modal -->
      <div *ngIf="showImportModal" 
           class="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
           (click)="showImportModal = false">
        <div class="bg-white rounded-2xl w-full max-w-xl p-6 shadow-2xl"
             (click)="$event.stopPropagation()">
          <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
            📥 استيراد الأسئلة
          </h3>
          
          <div class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-nafes-gold transition cursor-pointer"
               (dragover)="onDragOver($event)"
               (drop)="onFileDrop($event)"
               (click)="fileInput.click()">
            <input type="file" 
                   #fileInput 
                   class="hidden" 
                   accept=".json,.csv"
                   (change)="onFileSelect($event)">
            <span class="text-4xl mb-3 block">📁</span>
            <p class="text-gray-600 mb-2">اسحب الملف هنا أو انقر للاختيار</p>
            <p class="text-xs text-gray-400">يدعم: JSON, CSV</p>
          </div>
          
          <div *ngIf="importFile" class="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
            <span class="text-sm">{{ importFile.name }}</span>
            <button (click)="importFile = null" class="text-red-500 hover:text-red-700">✕</button>
          </div>
          
          <div *ngIf="importProgress > 0" class="mt-4">
            <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div class="h-full bg-nafes-gold transition-all" [style.width.%]="importProgress"></div>
            </div>
            <p class="text-sm text-gray-500 mt-2 text-center">{{ importProgress }}%</p>
          </div>
          
          <div class="flex gap-3 mt-6">
            <button (click)="showImportModal = false" 
                    class="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition">
              إلغاء
            </button>
            <button (click)="processImport()" 
                    [disabled]="!importFile"
                    class="flex-1 px-4 py-2 bg-nafes-gold text-white rounded-lg hover:bg-opacity-90 transition disabled:opacity-50">
              استيراد
            </button>
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
    
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class AdminQuestionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  questions: any[] = [];
  isLoading = false;
  isSaving = false;

  // Modal States
  showModal = false;
  showPreviewModal = false;
  showAnalyticsModal = false;
  showImportModal = false;
  isEditing = false;

  // Analytics
  analyticsData: any = null;

  // Selection
  selectedIds: number[] = [];

  // Preview
  previewQuestionData: any = null;

  // Import
  importFile: File | null = null;
  importProgress = 0;

  // Stats
  stats = {
    active: 0,
    draft: 0,
    inactive: 0
  };

  // Sorting
  sortField: SortField = 'createdDate';
  sortDirection: SortDirection = 'desc';

  // Current Question State
  currentQuestion: any = {
    grade: 3,
    subject: 1,
    testType: 1,
    type: 1,
    difficulty: 1,
    text: '',
    correctAnswer: '',
    options: []
  };

  isValid = false;

  // Filters
  filter: QuestionFilter = {
    search: '',
    grade: null,
    subject: null,
    type: null,
    difficulty: null,
    status: 'all'
  };

  pagination = {
    page: 1,
    pageSize: 25,
    totalCount: 0,
    totalPages: 0
  };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef, private router: Router) { }

  ngOnInit() {
    this.loadQuestions();
    this.loadStats();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadQuestions() {
    this.isLoading = true;
    this.api.getQuestions({
      page: this.pagination.page,
      pageSize: this.pagination.pageSize,
      search: this.filter.search,
      grade: this.filter.grade || undefined,
      subject: this.filter.subject || undefined,
      type: this.filter.type || undefined,
      difficulty: this.filter.difficulty || undefined,
      sortBy: this.sortField,
      sortOrder: this.sortDirection
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: response => {
        // ApiResponse<PaginatedResponse<QuestionGetDto>> -> response.data is the list
        // PaginatedResponse properties are merged in root for JSON
        this.questions = response.data || [];
        this.pagination.totalCount = response.totalCount || 0;
        this.pagination.totalPages = Math.ceil(this.pagination.totalCount / this.pagination.pageSize);
        this.isLoading = false;
      },
      error: err => {
        console.error('Error loading questions:', err);
        this.isLoading = false;
      }
    });
  }

  loadStats() {
    this.api.getQuestionStats().pipe(takeUntil(this.destroy$)).subscribe({
      next: response => {
        // ApiResponse<object> -> response.data has the stats object
        const statsData = response.data || response;
        this.stats.active = statsData.totalCount || statsData.TotalCount || this.pagination.totalCount;
        // Backend doesn't provide draft/inactive counts yet, using placeholders
        this.stats.draft = 0;
        this.stats.inactive = 0;
      },
      error: () => {
        // Fallback to total count
        this.stats.active = this.pagination.totalCount;
      }
    });
  }

  // Editor Interaction
  onEditorChange(event: any) {
    this.isValid = event.isValid;
    if (event.data) {
      this.currentQuestion.text = event.data.text;
      this.currentQuestion.correctAnswer = event.data.correctAnswer;
      this.currentQuestion.options = event.data.options;
      this.currentQuestion.type = event.data.type;

      if (event.data.difficulty) {
        this.currentQuestion.difficulty = event.data.difficulty;
      }
      if (event.data.grade) {
        this.currentQuestion.grade = event.data.grade;
      }
      if (event.data.subject) {
        this.currentQuestion.subject = event.data.subject;
      }
    }
    this.cdr.detectChanges();
  }

  trackByQuestion(index: number, q: any): number {
    return q.id;
  }

  saveQuestion() {
    if (!this.isValid || this.isSaving) return;

    this.isSaving = true;
    const payload = { ...this.currentQuestion };

    // Stringify options for backend
    if (Array.isArray(payload.options)) {
      payload.options = JSON.stringify(payload.options);
    }

    // Convert string values to numbers (select elements bind as strings)
    payload.grade = Number(payload.grade) || 3;
    payload.subject = Number(payload.subject) || 1;
    payload.type = Number(payload.type) || 1;
    payload.difficulty = Number(payload.difficulty) || 1;
    payload.testType = Number(payload.testType) || 1;

    // Sanitize optional fields
    if (!payload.mediaUrl) payload.mediaUrl = null;
    if (!payload.adminNotes) payload.adminNotes = null;

    const request = this.isEditing
      ? this.api.updateQuestion(payload.id, payload)
      : this.api.createQuestion(payload);

    request.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.closeModal();
        this.loadQuestions();
        this.loadStats();
        this.isSaving = false;
      },
      error: (err) => {
        console.error('❌ Save Question Error:', err);
        console.error('❌ Error Response Body:', err.error);
        console.error('❌ Payload Sent:', payload);
        const errorMsg = err.error?.message || err.error?.errors?.join(', ') || err.message;
        alert(this.isEditing ? 'فشل التحديث: ' + errorMsg : 'فشل الإضافة: ' + errorMsg);
        this.isSaving = false;
      }
    });
  }

  // Navigate to wizard for adding a new question
  navigateToAddQuestion() {
    this.router.navigate(['/admin/questions/new']);
  }

  // Navigate to wizard for editing an existing question
  navigateToEditQuestion(q: any) {
    this.router.navigate(['/admin/questions/edit', q.id], {
      state: { question: q }
    });
  }

  // Keep legacy modal methods for backward compatibility
  openModal() {
    this.navigateToAddQuestion();
  }

  editQuestion(q: any) {
    this.navigateToEditQuestion(q);
  }

  deleteQuestion(id: number) {
    if (confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
      this.api.deleteQuestion(id).pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.loadQuestions();
        this.loadStats();
      });
    }
  }

  previewQuestion(q: any) {
    this.previewQuestionData = JSON.parse(JSON.stringify(q));
    if (typeof this.previewQuestionData.options === 'string') {
      try {
        this.previewQuestionData.options = JSON.parse(this.previewQuestionData.options);
      } catch {
        this.previewQuestionData.options = [];
      }
    }
    this.showPreviewModal = true;
  }

  viewAnalytics(id: number) {
    this.api.getQuestionAnalytics(id).pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.analyticsData = data;
      this.showAnalyticsModal = true;
    });
  }

  // Bulk Operations
  onFilterChange() {
    this.pagination.page = 1;
    this.loadQuestions();
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.pagination.page = page;
      this.loadQuestions();
    }
  }

  toggleSort(field: SortField) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    // Note: Sorting is handled client-side for now
    this.sortQuestions();
  }

  sortQuestions() {
    this.questions.sort((a, b) => {
      let valA = a[this.sortField];
      let valB = b[this.sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      const comparison = valA < valB ? -1 : valA > valB ? 1 : 0;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  toggleSelectAll() {
    if (this.allSelected) {
      this.selectedIds = [];
    } else {
      this.selectedIds = this.questions.map(q => q.id);
    }
  }

  toggleSelection(id: number) {
    const idx = this.selectedIds.indexOf(id);
    if (idx > -1) {
      this.selectedIds.splice(idx, 1);
    } else {
      this.selectedIds.push(id);
    }
  }

  get allSelected(): boolean {
    return this.questions.length > 0 && this.selectedIds.length === this.questions.length;
  }

  bulkDelete() {
    if (confirm(`هل أنت متأكد من حذف ${this.selectedIds.length} سؤال؟`)) {
      const deleteObservables = this.selectedIds.map(id => this.api.deleteQuestion(id));
      import('rxjs').then(({ forkJoin }) => {
        forkJoin(deleteObservables).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.selectedIds = [];
            this.loadQuestions();
            this.loadStats();
          },
          error: () => alert('فشل حذف بعض الأسئلة')
        });
      });
    }
  }

  // Export
  exportQuestions(format: 'json' | 'csv') {
    const questionsToExport = this.selectedIds.length > 0
      ? this.questions.filter(q => this.selectedIds.includes(q.id))
      : this.questions;

    if (questionsToExport.length === 0) {
      alert('لا توجد أسئلة للتصدير');
      return;
    }

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'json') {
      content = JSON.stringify(questionsToExport.map(q => ({
        text: q.text,
        type: q.type,
        correctAnswer: q.correctAnswer,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        grade: q.grade,
        subject: q.subject,
        difficulty: q.difficulty
      })), null, 2);
      filename = `questions_${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    } else {
      const headers = ['النص', 'النوع', 'الإجابة الصحيحة', 'الخيارات', 'الصف', 'المادة', 'الصعوبة'];
      const rows = questionsToExport.map(q => [
        `"${q.text.replace(/"/g, '""')}"`,
        this.getTypeName(q.type),
        q.correctAnswer,
        typeof q.options === 'string' ? q.options : JSON.stringify(q.options),
        q.grade,
        this.getSubjectName(q.subject),
        this.getDifficultyName(q.difficulty)
      ]);
      content = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      filename = `questions_${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv;charset=utf-8';
    }

    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // Import
  openImportModal() {
    this.showImportModal = true;
    this.importFile = null;
    this.importProgress = 0;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.importFile = files[0];
    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.importFile = input.files[0];
    }
  }

  async processImport() {
    if (!this.importFile) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        let questions: any[] = [];

        if (this.importFile!.name.endsWith('.json')) {
          questions = JSON.parse(content);
        } else if (this.importFile!.name.endsWith('.csv')) {
          questions = this.parseCsv(content);
        }

        if (!Array.isArray(questions)) {
          questions = [questions];
        }

        let imported = 0;
        for (const q of questions) {
          try {
            const payload = {
              text: q.text,
              type: q.type || 1,
              correctAnswer: q.correctAnswer,
              options: typeof q.options === 'string' ? q.options : JSON.stringify(q.options || []),
              grade: q.grade || 3,
              subject: q.subject || 1,
              difficulty: q.difficulty || 1,
              testType: q.testType || 1
            };

            await this.api.createQuestion(payload).toPromise();
            imported++;
            this.importProgress = Math.round((imported / questions.length) * 100);
          } catch (err) {
            console.error('Failed to import question:', err);
          }
        }

        alert(`تم استيراد ${imported} من ${questions.length} سؤال`);
        this.showImportModal = false;
        this.loadQuestions();
        this.loadStats();
      } catch (err) {
        alert('فشل في قراءة الملف: ' + (err as Error).message);
      }
    };
    reader.readAsText(this.importFile);
  }

  parseCsv(content: string): any[] {
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const q: any = {};
      headers.forEach((h, i) => {
        q[h] = values[i]?.trim();
      });
      return {
        text: q['النص'] || q.text,
        correctAnswer: q['الإجابة الصحيحة'] || q.correctAnswer,
        options: q['الخيارات'] || q.options,
        grade: parseInt(q['الصف'] || q.grade) || 3,
        subject: this.parseSubject(q['المادة'] || q.subject),
        difficulty: this.parseDifficulty(q['الصعوبة'] || q.difficulty),
        type: 1
      };
    });
  }

  parseSubject(value: string | number): number {
    if (typeof value === 'number') return value;
    const lower = (value || '').toLowerCase();
    if (lower.includes('عربي') || lower.includes('arabic')) return 1;
    if (lower.includes('رياضي') || lower.includes('math')) return 2;
    if (lower.includes('علوم') || lower.includes('science')) return 3;
    return 1;
  }

  parseDifficulty(value: string | number): number {
    if (typeof value === 'number') return value;
    const lower = (value || '').toLowerCase();
    if (lower.includes('سهل') || lower.includes('easy')) return 1;
    if (lower.includes('متوسط') || lower.includes('medium')) return 2;
    if (lower.includes('صعب') || lower.includes('hard')) return 3;
    return 1;
  }

  closeModal() {
    this.showModal = false;
    this.isEditing = false;
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('fixed')) {
      if (this.currentQuestion.text && this.isValid) {
        if (confirm('هل تريد إغلاق النافذة؟ ستفقد التغييرات غير المحفوظة.')) {
          this.closeModal();
        }
      } else {
        this.closeModal();
      }
    }
  }

  clearFilters() {
    this.filter = {
      search: '',
      grade: null,
      subject: null,
      type: null,
      difficulty: null,
      status: 'all'
    };
    this.onFilterChange();
  }

  get hasActiveFilters(): boolean {
    return !!(this.filter.search || this.filter.grade || this.filter.subject || this.filter.type || this.filter.difficulty);
  }

  getVisiblePages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.pagination.totalPages;
    const current = this.pagination.page;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }

    return pages;
  }

  // Helper Methods
  getTypeName(type: number): string {
    const types: Record<number, string> = {
      1: 'اختيار من متعدد',
      2: 'صواب/خطأ',
      3: 'توصيل',
      4: 'أكمل الفراغ',
      5: 'سحب وإفلات'
    };
    return types[type] || 'غير معروف';
  }

  getTypeIcon(type: number): string {
    const icons: Record<number, string> = {
      1: '📋',
      2: '✓✗',
      3: '🔗',
      4: '✍️',
      5: '🎯'
    };
    return icons[type] || '❓';
  }

  getTypeBadgeClass(type: number): string {
    const classes: Record<number, string> = {
      1: 'bg-blue-100 text-blue-800',
      2: 'bg-green-100 text-green-800',
      3: 'bg-purple-100 text-purple-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-pink-100 text-pink-800'
    };
    return classes[type] || 'bg-gray-100 text-gray-800';
  }

  getGradeName(g: number): string {
    return `الصف ${g}`;
  }

  getSubjectName(s: number): string {
    const subjects: Record<number, string> = {
      1: 'لغة عربية',
      2: 'رياضيات',
      3: 'علوم'
    };
    return subjects[s] || 'غير محدد';
  }

  getDifficultyName(d: number): string {
    const levels: Record<number, string> = {
      1: 'سهل',
      2: 'متوسط',
      3: 'صعب'
    };
    return levels[d] || 'غير محدد';
  }

  getDifficultyClass(d: number): string {
    const classes: Record<number, string> = {
      1: 'text-green-600',
      2: 'text-yellow-600',
      3: 'text-red-600'
    };
    return classes[d] || 'text-gray-600';
  }

  getStatusIcon(q: any): string {
    if (q.isDeleted) return '🗑️';
    return '✓';
  }

  getStatusText(q: any): string {
    if (q.isDeleted) return 'محذوف';
    return 'فعال';
  }

  getStatusBadgeClass(q: any): string {
    if (q.isDeleted) return 'bg-red-100 text-red-700';
    return 'bg-green-100 text-green-700';
  }
}
