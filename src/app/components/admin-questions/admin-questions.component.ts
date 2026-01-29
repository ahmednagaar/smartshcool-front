
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { SmartQuestionEditorComponent } from './smart-question-editor.component';
import { QuestionPreviewComponent } from './question-preview.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-questions',
  standalone: true,
  imports: [CommonModule, FormsModule, SmartQuestionEditorComponent, QuestionPreviewComponent, RouterLink],
  template: `
    <div class="min-h-screen bg-nafes-cream p-8">
      <div class="container mx-auto">
        <h1 class="text-3xl font-bold text-nafes-dark mb-8">إدارة الأسئلة 2.0</h1>

        <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
           <div class="bg-white p-6 rounded-xl shadow border-r-4 border-nafes-gold">
              <h3 class="text-gray-500 font-bold mb-2">إجمالي الأسئلة</h3>
              <p class="text-3xl font-bold">{{ pagination.totalCount }}</p>
           </div>
           <div class="bg-white p-6 rounded-xl shadow border-r-4 border-green-500">
              <h3 class="text-gray-500 font-bold mb-2">فعالة</h3>
              <p class="text-3xl font-bold">{{ pagination.totalCount }}</p> 
           </div>
            <div class="bg-white p-6 rounded-xl shadow border-r-4 border-blue-500">
              <h3 class="text-gray-500 font-bold mb-2">مسودات</h3>
              <p class="text-3xl font-bold">0</p>
           </div>
           <div class="bg-white p-6 rounded-xl shadow border-r-4 border-red-500">
              <h3 class="text-gray-500 font-bold mb-2">محذوفة</h3>
              <p class="text-3xl font-bold">--</p>
           </div>
        </div>

        <!-- Action Buttons & Navigation -->
        <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div class="flex gap-4">
            <button (click)="openModal()" class="bg-nafes-gold text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition shadow-lg flex items-center gap-2">
              <span>+</span> إضافة سؤال ذكي
            </button>
            <button (click)="openImportModal()" class="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition shadow-lg flex items-center gap-2">
              <span>📥</span> استيراد
            </button>
            <button *ngIf="selectedIds.length > 0" 
                    (click)="bulkDelete()" 
                    class="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition shadow-lg flex items-center gap-2">
              <span>🗑️</span> حذف {{ selectedIds.length }}
            </button>
          </div>
          
          <a routerLink="/admin/dashboard" class="bg-white text-gray-700 border-2 border-gray-200 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition flex items-center gap-2 cursor-pointer shadow-sm">
            <span>🏠</span> الرئيسية
          </a>
        </div>

        <!-- Filters & Search -->
        <div class="bg-white p-4 rounded-xl shadow mb-4 flex flex-wrap gap-4 items-center">
          <div class="flex-1 min-w-[200px]">
            <input type="text" [(ngModel)]="filter.search" (keyup.enter)="onFilterChange()" placeholder="بحث في الأسئلة..." class="w-full p-2 border rounded focus:ring-2 focus:ring-nafes-gold">
          </div>
          <select [(ngModel)]="filter.grade" (change)="onFilterChange()" class="p-2 border rounded">
            <option [ngValue]="null">كل الصفوف</option>
            <option [value]="3">الصف 3</option>
            <option [value]="4">الصف 4</option>
            <option [value]="5">الصف 5</option>
            <option [value]="6">الصف 6</option>
          </select>
          <select [(ngModel)]="filter.subject" (change)="onFilterChange()" class="p-2 border rounded">
            <option [ngValue]="null">كل المواد</option>
            <option [value]="1">رياضيات</option>
            <option [value]="2">علوم</option>
            <option [value]="3">لغتي</option>
          </select>
          <select [(ngModel)]="filter.type" (change)="onFilterChange()" class="p-2 border rounded">
            <option [ngValue]="null">كل الأنواع</option>
            <option [value]="1">اختيار من متعدد</option>
            <option [value]="2">صواب/خطأ</option>
            <option [value]="4">أكمل الفراغ</option>
            <option [value]="5">سحب وإفلات</option>
          </select>
          <button (click)="onFilterChange()" class="bg-nafes-dark text-white px-4 py-2 rounded hover:bg-opacity-90">بحث</button>
        </div>

        <!-- Questions List -->
        <div class="bg-white rounded-xl shadow overflow-hidden">
          <table class="w-full text-right">
            <thead class="bg-gray-50 border-b text-gray-500 text-sm uppercase">
              <tr>
                <th class="p-4 w-10">
                  <input type="checkbox" [checked]="allSelected" (change)="toggleSelectAll()" class="w-4 h-4 rounded text-nafes-gold focus:ring-nafes-gold">
                </th>
                <th class="p-4 w-1/2">النص</th>
                <th class="p-4">التفاصيل</th>
                <th class="p-4">الأداء</th>
                <th class="p-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
               <tr *ngFor="let q of questions; trackBy: trackByQuestion" class="hover:bg-blue-50 transition group">
                <td class="p-4">
                  <input type="checkbox" [checked]="selectedIds.includes(q.id)" (change)="toggleSelection(q.id)" class="w-4 h-4 rounded text-nafes-gold focus:ring-nafes-gold">
                </td>
                <td class="p-4">
                  <p class="font-bold text-gray-800 line-clamp-2">{{ q.text }}</p>
                  <p class="text-xs text-gray-400 mt-1">تاريخ الإضافة: {{ q.createdDate | date:'shortDate' }}</p>
                </td>
                <td class="p-4 text-sm">
                  <div class="flex flex-col gap-1">
                     <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                       {{ getTypeName(q.type) }}
                     </span>
                     <span class="text-gray-500">{{ getGradeName(q.grade) }} | {{ getSubjectName(q.subject) }}</span>
                  </div>
                </td>
                <td class="p-4">
                   <!-- Analytics Placeholder -->
                   <div class="flex items-center gap-1 text-xs text-gray-500">
                      <span class="font-bold text-green-600">--%</span> نجاح
                   </div>
                   <div class="w-20 h-1 bg-gray-200 rounded mt-1 overflow-hidden">
                      <div class="bg-green-500 h-full" style="width: 75%"></div>
                   </div>
                </td>
                <td class="p-4">
                  <div class="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition">
                    <button (click)="viewAnalytics(q.id)" title="تحليلات" class="text-gray-400 hover:text-blue-600">
                       📊
                    </button>
                    <button (click)="editQuestion(q)" title="تعديل" class="text-blue-600 hover:text-blue-800 bg-blue-50 p-2 rounded-lg">
                       ✏️
                    </button>
                    <button (click)="deleteQuestion(q.id)" title="حذف" class="text-red-600 hover:text-red-800 bg-red-50 p-2 rounded-lg">
                       🗑️
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="questions.length === 0">
                <td colspan="5" class="p-12 text-center text-gray-500">
                  <div class="flex flex-col items-center justify-center">
                    <span class="text-4xl mb-4">🔍</span>
                    <p>لا توجد أسئلة تطابق بحثك</p>
                    <button (click)="openModal()" class="mt-4 text-nafes-gold font-bold hover:underline">أضف سؤالك الأول</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <!-- Pagination -->
          <div class="bg-gray-50 p-4 border-t flex justify-between items-center">
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <select [(ngModel)]="pagination.pageSize" (change)="onFilterChange()" class="border rounded p-1 bg-white">
                <option [value]="10">10</option>
                <option [value]="20">20</option>
                <option [value]="50">50</option>
              </select>
              <span>من أصل {{ pagination.totalCount }}</span>
            </div>
            
            <div class="flex gap-2">
              <button (click)="onPageChange(pagination.page - 1)" [disabled]="pagination.page === 1" class="px-4 py-2 border rounded bg-white hover:bg-gray-100 disabled:opacity-50 text-sm font-bold">السابق</button>
              <span class="px-4 py-2 font-bold bg-white border rounded">{{ pagination.page }}</span>
              <button (click)="onPageChange(pagination.page + 1)" [disabled]="pagination.page >= pagination.totalPages" class="px-4 py-2 border rounded bg-white hover:bg-gray-100 disabled:opacity-50 text-sm font-bold">التالي</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Editor Modal (Smart + Preview) -->
      <div *ngIf="showModal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
        <div class="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
          
          <!-- Modal Header -->
          <div class="p-6 border-b flex justify-between items-center bg-gray-50">
             <div>
                <h2 class="text-2xl font-bold text-gray-800">{{ isEditing ? 'تعديل السؤال' : 'إضافة سؤال جديد' }}</h2>
                <p class="text-sm text-gray-500">استخدم المحرر الذكي لكتابة السؤال ومشاهدة المعاينة الحية</p>
             </div>
             <div class="flex gap-3">
               <button (click)="closeModal()" class="px-6 py-2 border-2 border-gray-200 rounded-xl hover:bg-gray-100 font-bold transition">إلغاء</button>
               <button (click)="saveQuestion()" [disabled]="!isValid" class="bg-nafes-gold text-white px-8 py-2 rounded-xl font-bold hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                  {{ isEditing ? 'حفظ التغييرات' : 'نشر السؤال' }}
               </button>
             </div>
          </div>

          <!-- Modal Body (Split View) -->
          <div class="flex-1 overflow-hidden flex flex-col md:flex-row">
            
            <!-- Left: Editor & Settings -->
            <div class="w-full md:w-1/2 p-6 overflow-y-auto border-l">
              
              <!-- Metadata (Inline/Compact) -->
              <div class="grid grid-cols-2 gap-4 mb-6">
                 <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">الصف</label>
                    <select [(ngModel)]="currentQuestion.grade" class="w-full p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-nafes-gold">
                       <option [value]="3">الصف 3</option>
                       <option [value]="4">الصف 4</option>
                       <option [value]="5">الصف 5</option>
                       <option [value]="6">الصف 6</option>
                    </select>
                 </div>
                 <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">المادة</label>
                    <select [(ngModel)]="currentQuestion.subject" class="w-full p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-nafes-gold">
                       <option [value]="1">رياضيات</option>
                       <option [value]="2">علوم</option>
                       <option [value]="3">لغتي</option>
                    </select>
                 </div>
                 <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">الصعوبة</label>
                    <select [(ngModel)]="currentQuestion.difficulty" class="w-full p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-nafes-gold">
                       <option [value]="1">سهل</option>
                       <option [value]="2">متوسط</option>
                       <option [value]="3">صعب</option>
                    </select>
                 </div>
                 <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">النوع (تلقائي)</label>
                    <div class="p-2 bg-gray-100 rounded-lg text-gray-600 text-sm">
                       {{ getTypeName(currentQuestion.type) }}
                    </div>
                 </div>
              </div>

              <div class="mb-6">
                 <label class="block text-sm font-bold text-gray-700 mb-2">محتوى السؤال</label>
                 <!-- Smart Editor Component -->
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

      <!-- Analytics Modal -->
      <div *ngIf="showAnalyticsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
         <div class="bg-white rounded-xl w-full max-w-md p-6">
            <h3 class="text-xl font-bold mb-4">تحليلات السؤال #{{ analyticsData?.Id }}</h3>
            <div *ngIf="analyticsData" class="space-y-4">
               <div class="flex justify-between border-b pb-2">
                  <span class="text-gray-600">عدد المحاولات</span>
                  <span class="font-bold">{{ analyticsData.UsageCount }}</span>
               </div>
               <div class="flex justify-between border-b pb-2">
                  <span class="text-gray-600">معدل النجاح</span>
                  <span class="font-bold text-green-600">{{ analyticsData.SuccessRate }}%</span>
               </div>
               <div class="flex justify-between border-b pb-2">
                  <span class="text-gray-600">متوسط الوقت</span>
                  <span class="font-bold">{{ analyticsData.AvgTimeSeconds }} ثانية</span>
               </div>
            </div>
            <button (click)="showAnalyticsModal = false" class="mt-6 w-full bg-gray-100 py-2 rounded-lg font-bold hover:bg-gray-200">إغلاق</button>
         </div>
      </div>

    </div>
  `
})
export class AdminQuestionsComponent implements OnInit {
  questions: any[] = [];

  // Modal State
  showModal = false;
  isEditing = false;
  showImportModal = false; // Kept for logic compatibility but UI might be removed or moved
  showAnalyticsModal = false;
  analyticsData: any = null;

  // Selection
  selectedIds: number[] = [];

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
  filter = {
    search: '',
    grade: null,
    subject: null,
    type: null
  };

  pagination = {
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.loadQuestions();
  }

  loadQuestions() {
    this.api.getQuestions({
      page: this.pagination.page,
      pageSize: this.pagination.pageSize,
      search: this.filter.search,
      grade: this.filter.grade || undefined,
      subject: this.filter.subject || undefined,
      type: this.filter.type || undefined
    }).subscribe(response => {
      this.questions = response.items;
      this.pagination.totalCount = response.totalCount;
      this.pagination.totalPages = Math.ceil(response.totalCount / this.pagination.pageSize);
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

      // Keep other fields (grade, subject, etc.) intact
    }
    this.cdr.detectChanges(); // Force check to avoid ExpressionChanged error
  }

  trackByQuestion(index: number, q: any): number {
    return q.id;
  }

  saveQuestion() {
    if (!this.isValid) return;

    // Prepare for backend
    const payload = { ...this.currentQuestion };

    // Stringify options if needed by backend (legacy support)
    // The backend expects JSON string for options
    if (Array.isArray(payload.options)) {
      payload.options = JSON.stringify(payload.options);
    }

    // Ensure testType is set
    payload.testType = payload.testType || 1;

    if (this.isEditing) {
      this.api.updateQuestion(payload.id, payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadQuestions();
        },
        error: (err) => alert('فشل التحديث: ' + err.message)
      });
    } else {
      this.api.createQuestion(payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadQuestions();
        },
        error: (err) => alert('فشل الإضافة: ' + err.message)
      });
    }
  }

  openModal() {
    this.isEditing = false;
    this.currentQuestion = {
      grade: 3,
      subject: 1,
      testType: 1,
      type: 1,
      difficulty: 1,
      text: '',
      correctAnswer: '',
      options: []
    };
    this.showModal = true;
    this.isValid = false;
  }

  editQuestion(q: any) {
    this.isEditing = true;
    // Deep copy to avoid mutation reference issues
    this.currentQuestion = JSON.parse(JSON.stringify(q));

    // Parse options if string (backend sends string)
    if (typeof this.currentQuestion.options === 'string' && this.currentQuestion.options) {
      try {
        this.currentQuestion.options = JSON.parse(this.currentQuestion.options);
      } catch {
        this.currentQuestion.options = [];
      }
    }

    this.showModal = true;
    // Validity will be set by the editor component upon initialization
  }

  deleteQuestion(id: number) {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      this.api.deleteQuestion(id).subscribe(() => this.loadQuestions());
    }
  }

  // Analytics
  viewAnalytics(id: number) {
    this.api.getQuestionAnalytics(id).subscribe(data => {
      this.analyticsData = data;
      this.showAnalyticsModal = true;
    });
  }

  // Bulk & Filters
  onFilterChange() {
    this.pagination.page = 1;
    this.loadQuestions();
  }

  onPageChange(page: number) {
    this.pagination.page = page;
    this.loadQuestions();
  }

  toggleSelectAll() {
    if (this.allSelected) this.selectedIds = [];
    else this.selectedIds = this.questions.map(q => q.id);
  }

  toggleSelection(id: number) {
    const idx = this.selectedIds.indexOf(id);
    if (idx > -1) this.selectedIds.splice(idx, 1);
    else this.selectedIds.push(id);
  }

  get allSelected() {
    return this.questions.length > 0 && this.selectedIds.length === this.questions.length;
  }

  bulkDelete() {
    if (confirm(`حذف ${this.selectedIds.length} عنصر؟`)) {
      // Implementation of bulk delete loop
      let completed = 0;
      this.selectedIds.forEach(id => {
        this.api.deleteQuestion(id).subscribe(() => {
          completed++;
          if (completed === this.selectedIds.length) {
            this.selectedIds = [];
            this.loadQuestions();
          }
        });
      });
    }
  }

  closeModal() {
    this.showModal = false;
  }

  // Helpers
  getTypeName(type: number): string {
    const types: any = { 1: 'اختيار من متعدد', 2: 'صواب/خطأ', 3: 'توصيل', 4: 'أكمل الفراغ', 5: 'سحب وإفلات' };
    return types[type] || 'غير معروف';
  }
  getGradeName(g: number) { return `الصف ${g}`; }
  getSubjectName(s: number) { return s === 1 ? 'عربي' : s === 2 ? 'رياضيات' : 'علوم'; }

  // Legacy Import Logic (Placeholder to avoid breaking if referenced)
  openImportModal() { alert('سيتم تحديث خاصية الاستيراد قريباً'); }
}
