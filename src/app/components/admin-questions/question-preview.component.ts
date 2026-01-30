import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
   selector: 'app-question-preview',
   standalone: true,
   imports: [CommonModule],
   template: `
    <div class="h-full flex flex-col bg-gray-100 rounded-xl overflow-hidden border"
         role="region"
         aria-label="معاينة السؤال">
      
      <!-- Device Toolbar -->
      <div class="bg-white border-b p-3 flex justify-between items-center">
        <span class="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          👁️ معاينة الطالب
        </span>
        <div class="flex bg-gray-100 rounded-lg p-1 gap-1">
          <button (click)="viewMode='mobile'" 
                  [class.bg-white]="viewMode=='mobile'" 
                  [class.shadow-sm]="viewMode=='mobile'"
                  [attr.aria-pressed]="viewMode=='mobile'"
                  class="px-3 py-1.5 rounded-md transition text-gray-600 hover:text-black text-sm">
            📱 جوال
          </button>
          <button (click)="viewMode='desktop'" 
                  [class.bg-white]="viewMode=='desktop'" 
                  [class.shadow-sm]="viewMode=='desktop'"
                  [attr.aria-pressed]="viewMode=='desktop'"
                  class="px-3 py-1.5 rounded-md transition text-gray-600 hover:text-black text-sm">
            💻 كمبيوتر
          </button>
        </div>
      </div>

      <!-- Preview Container -->
      <div class="flex-1 overflow-auto p-4 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 relative">
        
        <!-- Grid Background Pattern -->
        <div class="absolute inset-0 z-0 opacity-10 pointer-events-none" 
             style="background-image: radial-gradient(#94a3b8 1px, transparent 1px); background-size: 20px 20px;">
        </div>

        <!-- Device Frame -->
        <div [class.w-full]="viewMode=='desktop'" 
             [class.max-w-3xl]="viewMode=='desktop'"
             [class.w-[375px]]="viewMode=='mobile'"
             [class.h-[667px]]="viewMode=='mobile'"
             [class.border-[8px]]="viewMode=='mobile'"
             [class.border-gray-800]="viewMode=='mobile'"
             [class.rounded-[2.5rem]]="viewMode=='mobile'"
             class="bg-white shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 relative z-10 flex flex-col">
          
          <!-- Phone Notch (Mobile only) -->
          <div *ngIf="viewMode=='mobile'" 
               class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-20">
          </div>
          
          <!-- Mock Header -->
          <div class="h-14 bg-gradient-to-r from-nafes-dark to-nafes-dark/90 text-white flex items-center justify-between px-4 shadow-md"
               [class.pt-4]="viewMode=='mobile'">
            <span class="font-bold text-lg">نافِس</span>
            <div class="flex items-center gap-3">
              <span class="text-sm opacity-80">{{ getQuestionTypeLabel() }}</span>
              <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                👤
              </div>
            </div>
          </div>

          <!-- Progress Bar Mock -->
          <div class="h-1 bg-gray-200">
            <div class="h-full bg-nafes-gold w-1/3 transition-all"></div>
          </div>

          <!-- Question Content -->
          <div class="flex-1 p-6 flex flex-col overflow-y-auto" 
               [class.p-4]="viewMode=='mobile'">
            
            <!-- Question Number Badge -->
            <div class="flex justify-between items-center mb-4">
              <span class="bg-nafes-gold/10 text-nafes-gold px-3 py-1 rounded-full text-sm font-bold">
                سؤال 1 من 10
              </span>
              <span *ngIf="question?.difficulty" 
                    class="px-2 py-1 rounded-full text-xs"
                    [ngClass]="getDifficultyBadgeClass()">
                {{ getDifficultyLabel() }}
              </span>
            </div>
            
            <!-- Question Text -->
            <div class="mb-6 flex-shrink-0">
              <h2 class="font-bold text-center leading-relaxed animate-fadeIn" 
                  [class.text-xl]="viewMode=='desktop'"
                  [class.text-lg]="viewMode=='mobile'"
                  [class.text-nafes-dark]="hasText">
                {{ question?.text || 'نص السؤال سيظهر هنا...' }}
              </h2>
            </div>

            <!-- Media Preview -->
            <div *ngIf="question?.mediaUrl" class="mb-6 flex justify-center">
              <div class="bg-gray-100 rounded-xl p-4 max-w-xs">
                <div class="w-full aspect-video bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                  🖼️ صورة/وسائط
                </div>
              </div>
            </div>

            <!-- Options Grid -->
            <div *ngIf="hasOptions" 
                 class="grid gap-3 flex-1"
                 [ngClass]="getOptionsGridClass()"
                 role="radiogroup"
                 aria-label="خيارات الإجابة">
              
              <button *ngFor="let opt of getOptions(); let i = index"
                      class="p-4 rounded-xl border-2 transition text-center relative group"
                      [ngClass]="getOptionClass(opt)"
                      role="radio"
                      [attr.aria-checked]="opt === question?.correctAnswer">
                
                <!-- Option Number -->
                <span class="absolute right-3 top-3 w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center group-hover:bg-nafes-gold/20 group-hover:text-nafes-gold transition">
                  {{ getOptionLetter(i) }}
                </span>
                
                <!-- Option Text -->
                <span class="block pr-8 text-base font-medium">{{ opt }}</span>

                <!-- Correct Answer Indicator (Admin View) -->
                <span *ngIf="opt === question?.correctAnswer" 
                      class="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md z-10 animate-bounce"
                      title="الإجابة الصحيحة">
                  ✓
                </span>
              </button>
            </div>

            <!-- Fill in Blank Input -->
            <div *ngIf="isFillBlank" class="flex-1 flex items-center justify-center">
              <div class="w-full max-w-md">
                <input type="text" 
                       [placeholder]="question?.correctAnswer ? 'الإجابة: ' + question.correctAnswer : 'أدخل إجابتك هنا...'" 
                       disabled
                       class="w-full p-4 border-b-4 border-gray-300 focus:border-nafes-gold text-center text-xl outline-none bg-white/50 rounded-t-lg">
                <p class="text-center text-xs text-gray-400 mt-2">اكتب إجابتك في المربع أعلاه</p>
              </div>
            </div>

            <!-- True/False Options -->
            <div *ngIf="isTrueFalse && !hasCustomOptions" class="flex gap-4 justify-center flex-1 items-center">
              <button class="flex-1 max-w-[150px] p-6 rounded-2xl border-2 transition text-center"
                      [ngClass]="question?.correctAnswer === 'صواب' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'">
                <span class="text-4xl block mb-2">✓</span>
                <span class="font-bold text-lg">صواب</span>
              </button>
              <button class="flex-1 max-w-[150px] p-6 rounded-2xl border-2 transition text-center"
                      [ngClass]="question?.correctAnswer === 'خطأ' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'">
                <span class="text-4xl block mb-2">✗</span>
                <span class="font-bold text-lg">خطأ</span>
              </button>
            </div>

            <!-- Empty State -->
            <div *ngIf="!hasText" class="flex-1 flex items-center justify-center text-gray-400">
              <div class="text-center">
                <span class="text-4xl block mb-2">✍️</span>
                <p>ابدأ بكتابة السؤال لرؤية المعاينة</p>
              </div>
            </div>

          </div>

          <!-- Mock Footer -->
          <div class="p-4 border-t bg-gray-50 flex justify-between items-center">
            <button class="px-4 py-2 text-gray-400 text-sm">السابق</button>
            <button class="bg-nafes-gold text-white px-8 py-2.5 rounded-full font-bold shadow-lg hover:shadow-xl transition cursor-not-allowed opacity-75">
              تحقق من الإجابة
            </button>
            <button class="px-4 py-2 text-gray-400 text-sm">التالي</button>
          </div>

        </div>
      </div>
      
      <!-- Quick Stats (Bottom) -->
      <div class="bg-white border-t p-3 flex justify-around text-xs text-gray-500">
        <span>النوع: <strong>{{ getQuestionTypeLabel() }}</strong></span>
        <span>الخيارات: <strong>{{ getOptionsCount() }}</strong></span>
        <span *ngIf="question?.correctAnswer">الإجابة: <strong class="text-green-600">✓</strong></span>
      </div>
    </div>
  `,
   styles: [`
    .animate-fadeIn { 
      animation: fadeIn 0.3s ease-out; 
    }
    @keyframes fadeIn { 
      from { opacity: 0; transform: translateY(10px); } 
      to { opacity: 1; transform: translateY(0); } 
    }
    
    .animate-bounce {
      animation: bounce 1s infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
      50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
    }
  `]
})
export class QuestionPreviewComponent {
   @Input() question: any;
   viewMode: 'mobile' | 'desktop' = 'mobile';

   get hasText(): boolean {
      return !!(this.question?.text && this.question.text.trim());
   }

   get hasOptions(): boolean {
      const options = this.getOptions();
      return options.length > 0 && this.question?.type !== 4;
   }

   get hasCustomOptions(): boolean {
      return this.getOptions().length > 0;
   }

   get isTrueFalse(): boolean {
      return this.question?.type === 2;
   }

   get isFillBlank(): boolean {
      return this.question?.type === 4;
   }

   getOptions(): string[] {
      if (!this.question?.options) return [];

      if (typeof this.question.options === 'string') {
         try {
            return JSON.parse(this.question.options);
         } catch {
            return [];
         }
      }

      return Array.isArray(this.question.options) ? this.question.options : [];
   }

   getOptionsCount(): number {
      return this.getOptions().length;
   }

   getOptionLetter(index: number): string {
      const letters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي'];
      return letters[index] || (index + 1).toString();
   }

   getOptionClass(opt: string): string {
      const isCorrect = opt === this.question?.correctAnswer;
      if (isCorrect) {
         return 'border-green-400 bg-green-50 hover:bg-green-100';
      }
      return 'border-gray-200 hover:border-nafes-gold hover:bg-yellow-50';
   }

   getOptionsGridClass(): string {
      const count = this.getOptionsCount();
      if (this.viewMode === 'mobile' || count > 4) {
         return 'grid-cols-1';
      }
      return count <= 2 ? 'grid-cols-1' : 'grid-cols-2';
   }

   getQuestionTypeLabel(): string {
      const types: Record<number, string> = {
         1: 'اختيار من متعدد',
         2: 'صواب/خطأ',
         3: 'توصيل',
         4: 'أكمل الفراغ',
         5: 'سحب وإفلات'
      };
      return types[this.question?.type] || 'غير محدد';
   }

   getDifficultyLabel(): string {
      const levels: Record<number, string> = {
         1: '🟢 سهل',
         2: '🟡 متوسط',
         3: '🔴 صعب'
      };
      return levels[this.question?.difficulty] || '';
   }

   getDifficultyBadgeClass(): string {
      const classes: Record<number, string> = {
         1: 'bg-green-100 text-green-700',
         2: 'bg-yellow-100 text-yellow-700',
         3: 'bg-red-100 text-red-700'
      };
      return classes[this.question?.difficulty] || 'bg-gray-100 text-gray-600';
   }
}
