
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-question-preview',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="h-full flex flex-col bg-gray-100 rounded-xl overflow-hidden border">
      <!-- Device Toolbar -->
      <div class="bg-white border-b p-2 flex justify-between items-center">
        <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">معاينة الطالب</span>
        <div class="flex bg-gray-100 rounded p-1">
          <button (click)="viewMode='mobile'" [class.bg-white]="viewMode=='mobile'" [class.shadow-sm]="viewMode=='mobile'" class="p-1 rounded transition text-gray-600 hover:text-black">
             📱 جوال
          </button>
          <button (click)="viewMode='desktop'" [class.bg-white]="viewMode=='desktop'" [class.shadow-sm]="viewMode=='desktop'" class="p-1 rounded transition text-gray-600 hover:text-black">
             💻 كمبيوتر
          </button>
        </div>
      </div>

      <!-- Preview Container -->
      <div class="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-200 bg-opacity-50 relative">
         <!-- Game Background Simulation -->
         <div class="absolute inset-0 z-0 opacity-10 pointer-events-none" 
              style="background-image: radial-gradient(#cbd5e1 1px, transparent 1px); background-size: 20px 20px;">
         </div>

         <!-- Device Frame -->
         <div 
            [class.w-full]="viewMode=='desktop'" 
            [class.max-w-4xl]="viewMode=='desktop'"
            [class.w-[375px]]="viewMode=='mobile'"
            [class.h-[667px]]="viewMode=='mobile'"
            class="bg-white shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 relative z-10 flex flex-col">
            
            <!-- Mock Header -->
            <div class="h-14 bg-nafes-dark text-white flex items-center justify-between px-4">
               <span>نافِس</span>
               <div class="w-8 h-8 rounded-full bg-white bg-opacity-20"></div>
            </div>

            <!-- Question Content -->
            <div class="flex-1 p-6 flex flex-col justify-center animate-fadeIn">
               
               <!-- Question Text -->
               <div class="mb-8">
                  <h2 class="text-xl md:text-2xl font-bold text-center text-nafes-dark leading-relaxed" 
                      [ngClass]="{'text-lg': viewMode=='mobile'}">
                    {{ question?.text || 'نص السؤال سيظهر هنا...' }}
                  </h2>
               </div>

               <!-- Options Grid -->
               <div *ngIf="question?.options?.length" class="grid gap-4" 
                    [ngClass]="{'grid-cols-1': viewMode=='mobile' || question.options.length > 4, 'grid-cols-2': viewMode=='desktop' && question.options.length <= 4}">
                  
                  <button *ngFor="let opt of question.options; let i = index"
                     class="p-4 rounded-xl border-2 border-gray-100 hover:border-nafes-gold hover:bg-yellow-50 transition text-lg font-medium text-center relative group">
                     
                     <span class="absolute right-3 top-3 text-xs text-gray-400 font-mono">{{ i + 1 }}</span>
                     {{ opt }}

                     <!-- Correct Answer Indicator (Admin Visibility Only) -->
                     <span *ngIf="opt == question.correctAnswer" class="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md z-10">✓</span>
                  </button>

               </div>

               <!-- Fill in Blank Placeholder -->
               <div *ngIf="(!question?.options || question?.options.length === 0) && question?.type === 4" class="text-center">
                  <input type="text" placeholder="أدخل إجابتك هنا..." class="w-full max-w-xs p-3 border-b-2 border-gray-300 focus:border-nafes-gold text-center text-xl outline-none bg-transparent">
               </div>

            </div>

             <!-- Mock Footer -->
             <div class="p-4 border-t bg-gray-50 text-center">
                 <button class="bg-gray-300 text-white px-8 py-2 rounded-full font-bold cursor-not-allowed">تحقق</button>
             </div>

         </div>
      </div>
    </div>
  `,
    styles: [`
    .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class QuestionPreviewComponent {
    @Input() question: any;
    viewMode: 'mobile' | 'desktop' = 'mobile';
}
