import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SmartTextParser, ParsingResult, InputFormat, ParsedQuestionData } from '../../utils/smart-text-parser';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-smart-question-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4">
      <!-- Input Mode Selector Tabs -->
      <div class="flex bg-gray-100 rounded-lg p-1 gap-1">
        <button 
          *ngFor="let mode of inputModes" 
          (click)="switchMode(mode.value)"
          [class.bg-white]="currentMode === mode.value"
          [class.shadow-sm]="currentMode === mode.value"
          [class.text-nafes-gold]="currentMode === mode.value"
          [class.font-bold]="currentMode === mode.value"
          class="flex-1 px-3 py-2 rounded-md text-sm transition-all hover:bg-white/50"
          [attr.aria-pressed]="currentMode === mode.value"
          role="tab">
          {{ mode.icon }} {{ mode.label }}
        </button>
      </div>

      <!-- Help / Syntax Guide -->
      <div class="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 flex justify-between items-start">
        <div>
          <span class="font-bold">{{ getModeHelp().title }}</span>
          <p class="text-xs mt-1 opacity-80">{{ getModeHelp().example }}</p>
        </div>
        <button (click)="showHelp = !showHelp" 
                class="text-xs underline text-blue-600 hover:text-blue-800 flex-shrink-0"
                [attr.aria-expanded]="showHelp">
          {{ showHelp ? 'إخفاء' : 'مساعدة' }}
        </button>
      </div>
      
      <!-- Detailed Help Panel -->
      <div *ngIf="showHelp" 
           class="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border animate-fadeIn space-y-3"
           role="region"
           aria-label="مساعدة">
        
        <div *ngIf="currentMode === 'pipe'">
          <p class="font-bold text-gray-800 mb-2">📝 الصيغة المبسطة (Pipe)</p>
          <code class="block bg-white p-2 rounded text-xs font-mono">ما عاصمة مصر؟ | القاهرة | القاهرة, الجيزة, الإسكندرية</code>
          <div class="mt-2 space-y-1 text-xs">
            <p><strong>اختيار من متعدد:</strong> السؤال | الإجابة | الخيار1, الخيار2, ...</p>
            <p><strong>صواب/خطأ:</strong> الأرض كروية؟ | صواب | صواب, خطأ</p>
            <p><strong>أكمل الفراغ:</strong> 5 + 5 = ؟ | 10</p>
          </div>
        </div>

        <div *ngIf="currentMode === 'json'">
          <p class="font-bold text-gray-800 mb-2">📋 تنسيق JSON</p>
          <pre class="bg-white p-2 rounded text-xs font-mono overflow-x-auto">{{"{"}}
  "text": "ما عاصمة مصر؟",
  "correctAnswer": "القاهرة",
  "options": ["القاهرة", "الجيزة", "الإسكندرية", "أسوان"],
  "type": "MCQ",
  "difficulty": "Easy"
{{"}"}}</pre>
        </div>

        <div *ngIf="currentMode === 'markdown'">
          <p class="font-bold text-gray-800 mb-2">📄 تنسيق Markdown</p>
          <pre class="bg-white p-2 rounded text-xs font-mono"># ما عاصمة مصر؟
- القاهرة ✓
- الجيزة
- الإسكندرية
- أسوان</pre>
          <p class="text-xs mt-2">استخدم ✓ لتحديد الإجابة الصحيحة</p>
        </div>

        <div *ngIf="currentMode === 'natural'">
          <p class="font-bold text-gray-800 mb-2">💬 اللغة الطبيعية</p>
          <pre class="bg-white p-2 rounded text-xs font-mono">السؤال: ما عاصمة مصر؟
الخيارات: القاهرة, الجيزة, الإسكندرية, أسوان
الإجابة: القاهرة
الصعوبة: سهل</pre>
        </div>
      </div>

      <!-- Editor Area -->
      <div class="relative">
        <textarea 
          [(ngModel)]="rawText" 
          (ngModelChange)="onTextChange()"
          [rows]="editorRows"
          class="w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-nafes-gold focus:border-nafes-gold font-mono text-base transition-colors resize-none"
          [ngClass]="{
            'border-red-300 bg-red-50': hasErrors,
            'border-yellow-300 bg-yellow-50': hasWarnings && !hasErrors,
            'border-green-300 bg-green-50': parsed?.isValid && !hasWarnings
          }"
          [placeholder]="getPlaceholder()"
          aria-label="محرر السؤال"
          [attr.aria-describedby]="hasErrors ? 'validation-errors' : null"></textarea>
         
         <!-- Character Count & Format Indicator -->
         <div class="absolute bottom-2 left-2 right-2 flex justify-between items-center text-xs text-gray-400">
           <span class="bg-white/80 px-2 py-0.5 rounded">
             {{ rawText.length }} حرف
             <span *ngIf="rawText.length > 400" class="text-yellow-600">⚠️</span>
             <span *ngIf="rawText.length > 500" class="text-red-600">❌</span>
           </span>
           <span *ngIf="parsed?.format && parsed?.format !== 'unknown'" 
                 class="bg-white/80 px-2 py-0.5 rounded capitalize">
             🔍 {{ getFormatLabel(parsed?.format || 'unknown') }}
           </span>
         </div>
      </div>

      <!-- Validation Status Section -->
      <div class="space-y-2" id="validation-errors" role="status" aria-live="polite">
        
        <!-- Errors -->
        <div *ngIf="parsed?.errors?.length" class="space-y-1">
          <div *ngFor="let err of parsed?.errors; let i = index" 
               class="flex items-start gap-2 text-sm p-2 rounded-lg"
               [ngClass]="{
                 'bg-red-50 text-red-700': err.severity === 'error',
                 'bg-yellow-50 text-yellow-700': err.severity === 'warning'
               }">
            <span *ngIf="err.severity === 'error'" class="flex-shrink-0">❌</span>
            <span *ngIf="err.severity === 'warning'" class="flex-shrink-0">⚠️</span>
            <span>
              {{ err.message }}
              <span *ngIf="err.line" class="text-xs opacity-70">(سطر {{ err.line }})</span>
            </span>
          </div>
        </div>

        <!-- Warnings -->
        <div *ngIf="parsed?.warnings?.length" class="space-y-1">
          <div *ngFor="let warning of parsed?.warnings" 
               class="flex items-start gap-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded-lg">
            <span class="flex-shrink-0">💡</span>
            <span>{{ warning }}</span>
          </div>
        </div>

        <!-- Suggestions -->
        <div *ngIf="parsed?.suggestions?.length && showSuggestions" class="space-y-1">
          <div *ngFor="let suggestion of parsed?.suggestions" 
               class="flex items-start gap-2 text-sm text-blue-700 bg-blue-50 p-2 rounded-lg">
            <span class="flex-shrink-0">💬</span>
            <span>{{ suggestion }}</span>
          </div>
        </div>
      </div>

      <!-- Live Analysis Tags -->
      <div *ngIf="parsed?.parsedData?.text" class="flex flex-wrap gap-2 text-xs">
        <span class="px-3 py-1.5 rounded-full flex items-center gap-1"
              [ngClass]="{
                'bg-green-100 text-green-800': parsed?.isValid,
                'bg-gray-100 text-gray-600': !parsed?.isValid
              }">
          <span *ngIf="parsed?.isValid">✓</span>
          <span *ngIf="!parsed?.isValid">○</span>
          {{ getTypeName(parsed?.parsedData?.type || 1) }}
        </span>
        
        <span *ngIf="parsed?.parsedData?.correctAnswer" 
              class="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center gap-1">
          ✓ {{ parsed?.parsedData?.correctAnswer }}
        </span>
        
        <span *ngIf="parsed?.parsedData?.options?.length" 
              class="px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 flex items-center gap-1">
          📋 {{ parsed?.parsedData?.options?.length }} خيارات
        </span>

        <span *ngIf="parsed?.parsedData?.difficulty" 
              class="px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 flex items-center gap-1">
          {{ getDifficultyIcon(parsed?.parsedData?.difficulty) }} {{ getDifficultyName(parsed?.parsedData?.difficulty) }}
        </span>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2 pt-2">
        <button (click)="insertTemplate()" 
                class="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition flex items-center gap-1">
          📝 قالب
        </button>
        <button (click)="clearEditor()" 
                *ngIf="rawText"
                class="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center gap-1">
          🗑️ مسح
        </button>
        <button (click)="showSuggestions = !showSuggestions" 
                *ngIf="parsed?.suggestions?.length"
                class="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition flex items-center gap-1">
          {{ showSuggestions ? '🙈 إخفاء' : '💡 اقتراحات' }}
        </button>
      </div>

    </div>
  `,
  styles: [`
    .animate-fadeIn { 
      animation: fadeIn 0.2s ease-out; 
    }
    @keyframes fadeIn { 
      from { opacity: 0; transform: translateY(-5px); } 
      to { opacity: 1; transform: translateY(0); } 
    }
    
    textarea::placeholder {
      color: #9ca3af;
      font-style: italic;
    }
  `]
})
export class SmartQuestionEditorComponent implements OnChanges, OnDestroy {
  @Input() initialValue: any; // { text, options, correctAnswer, type }
  @Output() statusChange = new EventEmitter<any>(); // Emits { isValid, data: ParsedQuestion }

  rawText = '';
  parsed: ParsingResult | null = null;
  showHelp = false;
  showSuggestions = true;
  currentMode: InputFormat = 'pipe';
  editorRows = 6;

  inputModes = [
    { value: 'pipe' as InputFormat, label: 'مبسط', icon: '📝' },
    { value: 'json' as InputFormat, label: 'JSON', icon: '{ }' },
    { value: 'markdown' as InputFormat, label: 'Markdown', icon: '📄' },
    { value: 'natural' as InputFormat, label: 'طبيعي', icon: '💬' }
  ];

  // Debounce subject for performance
  private textChange$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor() {
    // Setup debounced parsing (300ms)
    this.textChange$.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(text => {
      this.performParsing(text);
    });
  }

  ngOnInit() {
    // Load draft if no initial value
    const draft = localStorage.getItem('nafes_question_editor_draft');
    if (draft && !this.initialValue) {
      this.rawText = draft;
      setTimeout(() => this.performParsing(draft), 100); // Small delay to ensure view init
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue'] && this.initialValue) {
      this.reconstructRawText();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Convert structured object back to string (reverse parse)
  reconstructRawText() {
    if (!this.initialValue || !this.initialValue.text) return;

    // Reconstruct based on current mode
    if (this.currentMode === 'json') {
      this.rawText = SmartTextParser.toJsonFormat(this.initialValue);
    } else {
      this.rawText = SmartTextParser.toStringFormat(this.initialValue);
    }

    this.performParsing(this.rawText);
  }

  onTextChange() {
    // Trigger debounced parsing
    this.textChange$.next(this.rawText);

    // Autosave draft if it's a new question (not editing existing)
    if (!this.initialValue && this.rawText.trim()) {
      localStorage.setItem('nafes_question_editor_draft', this.rawText);
    } else if (!this.rawText.trim()) {
      localStorage.removeItem('nafes_question_editor_draft');
    }
  }

  performParsing(text: string) {
    this.parsed = SmartTextParser.parseAdvanced(text);

    // Emit status change
    this.statusChange.emit({
      isValid: this.parsed.isValid,
      data: this.parsed.parsedData,
      raw: this.rawText,
      format: this.parsed.format,
      errors: this.parsed.errors,
      warnings: this.parsed.warnings
    });
  }

  switchMode(mode: InputFormat) {
    const previousMode = this.currentMode;
    this.currentMode = mode;

    // Convert content if there's existing parsed data
    if (this.parsed?.parsedData?.text && previousMode !== mode) {
      switch (mode) {
        case 'json':
          this.rawText = SmartTextParser.toJsonFormat(this.parsed.parsedData);
          this.editorRows = 10;
          break;
        case 'markdown':
          this.rawText = this.toMarkdownFormat(this.parsed.parsedData);
          this.editorRows = 8;
          break;
        case 'natural':
          this.rawText = this.toNaturalFormat(this.parsed.parsedData);
          this.editorRows = 8;
          break;
        case 'pipe':
        default:
          this.rawText = SmartTextParser.toStringFormat(this.parsed.parsedData);
          this.editorRows = 6;
          break;
      }
      this.performParsing(this.rawText);
    }
  }

  toMarkdownFormat(data: ParsedQuestionData): string {
    let md = `# ${data.text}\n`;
    data.options.forEach(opt => {
      const isCorrect = opt === data.correctAnswer;
      md += `- ${opt}${isCorrect ? ' ✓' : ''}\n`;
    });
    return md;
  }

  toNaturalFormat(data: ParsedQuestionData): string {
    let str = `السؤال: ${data.text}\n`;
    if (data.options.length > 0) {
      str += `الخيارات: ${data.options.join(', ')}\n`;
    }
    str += `الإجابة: ${data.correctAnswer}\n`;
    if (data.difficulty) {
      str += `الصعوبة: ${this.getDifficultyName(data.difficulty)}\n`;
    }
    return str;
  }

  getModeHelp(): { title: string; example: string } {
    const helps: Record<InputFormat, { title: string; example: string }> = {
      pipe: {
        title: 'الصيغة الذكية:',
        example: 'السؤال | الإجابة الصحيحة | الخيار1, الخيار2'
      },
      json: {
        title: 'تنسيق JSON:',
        example: '{"text": "السؤال", "correctAnswer": "الإجابة", "options": [...]}'
      },
      markdown: {
        title: 'تنسيق Markdown:',
        example: '# السؤال ثم - الخيارات (استخدم ✓ للإجابة الصحيحة)'
      },
      natural: {
        title: 'اللغة الطبيعية:',
        example: 'السؤال: ... الخيارات: ... الإجابة: ...'
      },
      unknown: {
        title: 'اكتب السؤال:',
        example: 'سيتم اكتشاف التنسيق تلقائياً'
      }
    };
    return helps[this.currentMode] || helps.unknown;
  }

  getPlaceholder(): string {
    const placeholders: Record<InputFormat, string> = {
      pipe: 'ما عاصمة مصر؟ | القاهرة | القاهرة, الجيزة, الإسكندرية, أسوان',
      json: '{\n  "text": "ما عاصمة مصر؟",\n  "correctAnswer": "القاهرة",\n  "options": ["القاهرة", "الجيزة"]\n}',
      markdown: '# ما عاصمة مصر؟\n- القاهرة ✓\n- الجيزة\n- الإسكندرية',
      natural: 'السؤال: ما عاصمة مصر؟\nالخيارات: القاهرة, الجيزة, الإسكندرية\nالإجابة: القاهرة',
      unknown: 'اكتب السؤال هنا...'
    };
    return placeholders[this.currentMode] || placeholders.unknown;
  }

  getFormatLabel(format: InputFormat): string {
    const labels: Record<InputFormat, string> = {
      pipe: 'مبسط',
      json: 'JSON',
      markdown: 'Markdown',
      natural: 'طبيعي',
      unknown: 'غير محدد'
    };
    return labels[format] || format;
  }

  insertTemplate() {
    const templates: Record<InputFormat, string> = {
      pipe: 'ما عاصمة المملكة العربية السعودية؟ | الرياض | الرياض, جدة, مكة, المدينة',
      json: `{
  "text": "ما عاصمة المملكة العربية السعودية؟",
  "correctAnswer": "الرياض",
  "options": ["الرياض", "جدة", "مكة", "المدينة"],
  "type": "MCQ",
  "difficulty": "Easy"
}`,
      markdown: `# ما عاصمة المملكة العربية السعودية؟
- الرياض ✓
- جدة
- مكة
- المدينة`,
      natural: `السؤال: ما عاصمة المملكة العربية السعودية؟
الخيارات: الرياض, جدة, مكة, المدينة
الإجابة: الرياض
الصعوبة: سهل`,
      unknown: ''
    };

    this.rawText = templates[this.currentMode] || templates.pipe;
    this.performParsing(this.rawText);
  }

  clearEditor() {
    this.rawText = '';
    this.parsed = null;
    localStorage.removeItem('nafes_question_editor_draft');
    this.statusChange.emit({
      isValid: false,
      data: null,
      raw: '',
      format: 'unknown',
      errors: [],
      warnings: []
    });
  }

  get hasErrors(): boolean {
    return (this.parsed?.errors?.filter(e => e.severity === 'error').length || 0) > 0;
  }

  get hasWarnings(): boolean {
    return (this.parsed?.warnings?.length || 0) > 0 ||
      (this.parsed?.errors?.filter(e => e.severity === 'warning').length || 0) > 0;
  }

  getTypeName(type: number): string {
    return SmartTextParser.getTypeName(type);
  }

  getDifficultyName(difficulty: number | undefined): string {
    if (!difficulty) return '';
    return SmartTextParser.getDifficultyName(difficulty);
  }

  getDifficultyIcon(difficulty: number | undefined): string {
    const icons: Record<number, string> = {
      1: '🟢',
      2: '🟡',
      3: '🔴'
    };
    return icons[difficulty || 1] || '⚪';
  }
}
