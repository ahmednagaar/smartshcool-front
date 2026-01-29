
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SmartTextParser, ParsedQuestion } from '../../utils/smart-text-parser';

@Component({
  selector: 'app-smart-question-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4">
      <!-- Help / Syntax Guide -->
      <div class="bg-blue-50 p-3 rounded text-sm text-blue-800 flex justify-between items-start">
        <div>
          <span class="font-bold">الصيغة الذكية:</span>
          السؤال | الإجابة الصحيحة | الخيار1, الخيار2
        </div>
        <button (click)="showHelp = !showHelp" class="text-xs underline text-blue-600">
          {{ showHelp ? 'اخفاء' : 'مساعدة' }}
        </button>
      </div>
      
      <div *ngIf="showHelp" class="text-xs text-gray-600 bg-gray-50 p-3 rounded border">
        <p><strong>اختيار من متعدد:</strong> <code>ما عاصمة مصر؟ | القاهرة | القاهرة, الجيزة, الإسكندرية</code></p>
        <p><strong>صواب/خطأ:</strong> <code>الأرض مسطحة؟ | خطأ | صواب, خطأ</code></p>
        <p><strong>أكمل الفراغ:</strong> <code>5 + 5 = ? | 10</code> (بدون خيارات)</p>
      </div>

      <!-- Editor Area -->
      <div class="relative">
        <textarea 
          [(ngModel)]="rawText" 
          (ngModelChange)="onTextChange()"
          rows="6"
          class="w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-nafes-gold focus:border-nafes-gold font-mono text-lg transition-colors"
          [ngClass]="{'border-red-300 bg-red-50': parsed?.errors?.length, 'border-green-300': parsed?.isValid}"
          placeholder="اكتب السؤال هنا..."></textarea>
         
         <div class="absolute bottom-2 left-2 text-xs text-gray-400">
           {{ rawText.length }} حرف
         </div>
      </div>

      <!-- Validation Errors -->
      <div *ngIf="parsed?.errors?.length" class="text-red-600 text-sm animate-pulse">
        <div *ngFor="let err of parsed?.errors">⚠️ {{ err }}</div>
      </div>

      <!-- Live Analysis Tags -->
      <div *ngIf="parsed && parsed.text" class="flex flex-wrap gap-2 text-xs">
        <span class="px-2 py-1 rounded bg-gray-200" [ngClass]="{'bg-green-100 text-green-800': parsed.isValid}">
           النوع: {{ getTypeName(parsed.type) }}
        </span>
        <span class="px-2 py-1 rounded bg-blue-50 text-blue-700 font-bold" *ngIf="parsed.correctAnswer">
          الإجابة: {{ parsed.correctAnswer }}
        </span>
        <span class="px-2 py-1 rounded bg-purple-50 text-purple-700" *ngIf="parsed.options.length">
          {{ parsed.options.length }} خيارات
        </span>
      </div>

    </div>
  `
})
export class SmartQuestionEditorComponent implements OnChanges {
  @Input() initialValue: any; // { text, options, correctAnswer, type }
  @Output() statusChange = new EventEmitter<any>(); // Emits { isValid, data: ParsedQuestion }

  rawText = '';
  parsed: ParsedQuestion | null = null;
  showHelp = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue'] && this.initialValue) {
      this.reconstructRawText();
    }
  }

  // Convert structured object back to string (reverse parse)
  reconstructRawText() {
    if (!this.initialValue || !this.initialValue.text) return;

    let text = this.initialValue.text;

    const answer = this.initialValue.correctAnswer || '';
    text += ` | ${answer}`;

    if (this.initialValue.type === 1 || (this.initialValue.options && this.initialValue.options.length > 0)) {
      let opts = this.initialValue.options;
      if (typeof opts === 'string') {
        try { opts = JSON.parse(opts); } catch { }
      }
      if (Array.isArray(opts) && opts.length > 0) {
        text += ` | ${opts.join(', ')}`;
      }
    }

    this.rawText = text;
    this.onTextChange(); // Trigger parsing
  }

  onTextChange() {
    this.parsed = SmartTextParser.parse(this.rawText);
    this.statusChange.emit({
      isValid: this.parsed.isValid,
      data: this.parsed,
      raw: this.rawText
    });
  }

  getTypeName(type: number): string {
    const types: any = { 1: 'اختيارات متعددة', 2: 'صواب/خطأ', 4: 'أكمل الفراغ' };
    return types[type] || 'غير محدد';
  }
}
