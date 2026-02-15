import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
    LucideAngularModule,
    ArrowRight,
    ArrowLeft,
    Check,
    Plus,
    Trash,
    Eye,
    X,
    ChevronLeft,
    ChevronRight,
    Save,
    LUCIDE_ICONS,
    LucideIconProvider
} from 'lucide-angular';
import Swal from 'sweetalert2';
import { ApiService } from '../../../services/api.service';

interface QuestionDraft {
    type: number | null;
    grade: number | null;
    subject: number | null;
    difficulty: number | null;
    testType: number;
    text: string;
    options: string[];
    correctAnswer: string;
    correctAnswerIndex: number | null;
    mediaUrl: string;
    connectingPairs: { right: string; left: string }[];
    savedId?: number;
}

@Component({
    selector: 'app-question-wizard',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
    providers: [{
        provide: LUCIDE_ICONS,
        useValue: new LucideIconProvider({
            ArrowRight, ArrowLeft, Check, Plus, Trash, Eye, X,
            ChevronLeft, ChevronRight, Save
        })
    }],
    templateUrl: './question-wizard.component.html',
    styleUrls: ['./question-wizard.component.css']
})
export class QuestionWizardComponent implements OnInit {

    // Wizard state
    currentStep = 1;
    totalSteps = 5;
    isEditMode = false;
    editQuestionId: number | null = null;
    isSaving = false;

    // Multi-question session
    questionQueue: QuestionDraft[] = [];
    currentDraft: QuestionDraft = this.createEmptyDraft();

    // Step validation
    stepValidity: boolean[] = [false, false, false, true, true];

    // Options data
    grades = [
        { value: 3, label: 'الصف الثالث' },
        { value: 4, label: 'الصف الرابع' },
        { value: 5, label: 'الصف الخامس' },
        { value: 6, label: 'الصف السادس' }
    ];

    subjects = [
        { value: 1, label: 'اللغة العربية' },
        { value: 2, label: 'الرياضيات' },
        { value: 3, label: 'العلوم' }
    ];

    difficulties = [
        { value: 1, label: 'سهل', icon: '🟢', color: 'emerald' },
        { value: 2, label: 'متوسط', icon: '🟡', color: 'yellow' },
        { value: 3, label: 'صعب', icon: '🔴', color: 'red' }
    ];

    questionTypes = [
        {
            value: 1,
            label: 'اختيار من متعدد',
            icon: '🔘',
            description: 'سؤال مع عدة خيارات وإجابة صحيحة واحدة',
            example: 'ما هي عاصمة المملكة العربية السعودية؟'
        },
        {
            value: 2,
            label: 'صح أم خطأ',
            icon: '✅',
            description: 'عبارة يحدد الطالب صحتها أو خطأها',
            example: 'الشمس تشرق من الغرب.'
        },
        {
            value: 4,
            label: 'أكمل الفراغ',
            icon: '✏️',
            description: 'جملة ناقصة يكمل الطالب الكلمة المفقودة',
            example: 'عاصمة المملكة العربية السعودية هي _____'
        },
        {
            value: 3,
            label: 'وصل المتشابهات',
            icon: '🔗',
            description: 'ربط عناصر العمود الأيمن بالأيسر',
            example: 'صل كل مادة بوحدة قياسها'
        }
    ];

    stepLabels = ['نوع السؤال', 'التفاصيل', 'المحتوى', 'المعاينة', 'الحفظ'];

    constructor(
        private api: ApiService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode = true;
            this.editQuestionId = Number(id);
            this.loadQuestionForEdit();
        }
    }

    // ── Draft factory ─────────────────────────────
    createEmptyDraft(): QuestionDraft {
        return {
            type: null,
            grade: null,
            subject: null,
            difficulty: null,
            testType: 2,
            text: '',
            options: ['', '', '', ''],
            correctAnswer: '',
            correctAnswerIndex: null,
            mediaUrl: '',
            connectingPairs: [
                { right: '', left: '' },
                { right: '', left: '' },
                { right: '', left: '' }
            ]
        };
    }

    // ── Edit mode ─────────────────────────────────
    loadQuestionForEdit() {
        // Get question data from router state (passed by the list page)
        const navState = history.state as any;
        if (navState?.question) {
            const q = navState.question;
            let options = ['', '', '', ''];
            let correctAnswerIndex: number | null = null;

            if (q.options) {
                try {
                    const parsed = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                    if (Array.isArray(parsed)) {
                        options = parsed;
                        correctAnswerIndex = parsed.indexOf(q.correctAnswer);
                        if (correctAnswerIndex === -1) correctAnswerIndex = null;
                    }
                } catch {
                    options = ['', '', '', ''];
                }
            }

            this.currentDraft = {
                type: q.type,
                grade: q.grade,
                subject: q.subject,
                difficulty: q.difficulty,
                testType: q.testType || 2,
                text: q.text || '',
                options,
                correctAnswer: q.correctAnswer || '',
                correctAnswerIndex,
                mediaUrl: q.mediaUrl || '',
                connectingPairs: this.parseConnectingPairs(q)
            };

            this.stepValidity = [true, true, true, true, true];
        } else {
            // No state passed — go back
            this.toastError('لم يتم العثور على بيانات السؤال');
            this.router.navigate(['/admin/questions']);
        }
    }

    parseConnectingPairs(q: any): { right: string; left: string }[] {
        // If the question is connecting type, try to parse pairs
        if (q.type === 3 && q.options) {
            try {
                const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                if (Array.isArray(opts)) {
                    return opts.map((o: string) => ({ right: o, left: '' }));
                }
            } catch { /* ignore */ }
        }
        return [
            { right: '', left: '' },
            { right: '', left: '' },
            { right: '', left: '' }
        ];
    }

    // ── Navigation ────────────────────────────────
    nextStep() {
        if (this.currentStep < this.totalSteps && this.stepValidity[this.currentStep - 1]) {
            this.currentStep++;
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
        }
    }

    goToStep(step: number) {
        if (step <= this.currentStep || this.allPreviousStepsValid(step)) {
            this.currentStep = step;
        }
    }

    allPreviousStepsValid(step: number): boolean {
        for (let i = 0; i < step - 1; i++) {
            if (!this.stepValidity[i]) return false;
        }
        return true;
    }

    getStepLabel(step: number): string {
        return this.stepLabels[step - 1] || '';
    }

    getStepClass(step: number): string {
        if (step < this.currentStep) return 'bg-green-500 text-white';
        if (step === this.currentStep) return 'bg-blue-600 text-white ring-4 ring-blue-200';
        return 'bg-gray-200 text-gray-500';
    }

    // ── Type selection (Step 1) ───────────────────
    selectType(typeValue: number) {
        this.currentDraft.type = typeValue;
        // Reset answer fields when type changes
        this.currentDraft.correctAnswer = '';
        this.currentDraft.correctAnswerIndex = null;
        if (typeValue === 1) {
            this.currentDraft.options = ['', '', '', ''];
        } else {
            this.currentDraft.options = [];
        }
        this.currentDraft.connectingPairs = [
            { right: '', left: '' },
            { right: '', left: '' },
            { right: '', left: '' }
        ];
        this.validateStep1();
    }

    // ── MCQ Options (Step 3) ──────────────────────
    addOption() {
        if (this.currentDraft.options.length < 6) {
            this.currentDraft.options.push('');
        }
    }

    removeOption(index: number) {
        if (this.currentDraft.options.length > 2) {
            this.currentDraft.options.splice(index, 1);
            if (this.currentDraft.correctAnswerIndex === index) {
                this.currentDraft.correctAnswerIndex = null;
                this.currentDraft.correctAnswer = '';
            } else if (this.currentDraft.correctAnswerIndex !== null && this.currentDraft.correctAnswerIndex > index) {
                this.currentDraft.correctAnswerIndex--;
            }
        }
    }

    selectCorrectOption(index: number) {
        this.currentDraft.correctAnswerIndex = index;
        this.currentDraft.correctAnswer = this.currentDraft.options[index];
        this.validateStep3();
    }

    getOptionLabel(index: number): string {
        return ['أ', 'ب', 'ج', 'د', 'هـ', 'و'][index] || String(index + 1);
    }

    // ── True/False (Step 3) ───────────────────────
    selectTrueFalse(answer: string) {
        this.currentDraft.correctAnswer = answer;
        this.validateStep3();
    }

    // ── Connecting Pairs (Step 3) ─────────────────
    addConnectingPair() {
        if (this.currentDraft.connectingPairs.length < 6) {
            this.currentDraft.connectingPairs.push({ right: '', left: '' });
        }
    }

    removeConnectingPair() {
        if (this.currentDraft.connectingPairs.length > 2) {
            this.currentDraft.connectingPairs.pop();
        }
    }

    // ── Validation ────────────────────────────────
    validateStep1() {
        this.stepValidity[0] = this.currentDraft.type !== null;
    }

    validateStep2() {
        this.stepValidity[1] =
            this.currentDraft.grade !== null &&
            this.currentDraft.subject !== null &&
            this.currentDraft.difficulty !== null;
    }

    validateStep3() {
        const hasText = this.currentDraft.text.trim().length >= 10;
        let hasAnswer = false;

        switch (this.currentDraft.type) {
            case 1: // MCQ
                const validOptions = this.currentDraft.options.filter(o => o.trim()).length;
                hasAnswer = validOptions >= 2 && this.currentDraft.correctAnswerIndex !== null
                    && !!this.currentDraft.options[this.currentDraft.correctAnswerIndex]?.trim();
                break;
            case 2: // True/False
                hasAnswer = !!this.currentDraft.correctAnswer;
                break;
            case 4: // Fill blank
                hasAnswer = this.currentDraft.correctAnswer.trim().length > 0;
                break;
            case 3: // Connecting
                const validPairs = this.currentDraft.connectingPairs
                    .filter(p => p.right.trim() && p.left.trim()).length;
                hasAnswer = validPairs >= 2;
                break;
        }

        this.stepValidity[2] = hasText && hasAnswer;
    }

    onContentChange() {
        this.validateStep3();
    }

    onMetaChange() {
        this.validateStep2();
    }

    // ── Save ──────────────────────────────────────
    buildOptionsJson(): string | null {
        switch (this.currentDraft.type) {
            case 1: { // MCQ
                const validOptions = this.currentDraft.options.filter(o => o.trim());
                return validOptions.length >= 2 ? JSON.stringify(validOptions) : null;
            }
            case 2: // True/False
                return JSON.stringify(['صواب', 'خطأ']);
            case 3: { // Connecting
                const rightItems = this.currentDraft.connectingPairs
                    .filter(p => p.right.trim())
                    .map(p => p.right.trim());
                return rightItems.length > 0 ? JSON.stringify(rightItems) : null;
            }
            case 4: // Fill blank
                return null;
            default:
                return null;
        }
    }

    buildCorrectAnswer(): string {
        if (this.currentDraft.type === 3) {
            // For connecting, store left items as correct answer
            const leftItems = this.currentDraft.connectingPairs
                .filter(p => p.left.trim())
                .map(p => p.left.trim());
            return leftItems.join('|');
        }
        return this.currentDraft.correctAnswer;
    }

    async saveCurrentQuestion() {
        this.isSaving = true;

        const payload: any = {
            text: this.currentDraft.text.trim(),
            type: Number(this.currentDraft.type) || 1,
            difficulty: Number(this.currentDraft.difficulty) || 1,
            grade: Number(this.currentDraft.grade) || 3,
            subject: Number(this.currentDraft.subject) || 1,
            testType: Number(this.currentDraft.testType) || 2,
            mediaUrl: this.currentDraft.mediaUrl?.trim() || null,
            options: this.buildOptionsJson(),
            correctAnswer: this.buildCorrectAnswer()
        };

        try {
            if (this.isEditMode && this.editQuestionId) {
                await this.api.updateQuestion(this.editQuestionId, payload).toPromise();
                this.toastSuccess('تم تحديث السؤال بنجاح! ✅');
            } else {
                await this.api.createQuestion(payload).toPromise();
                this.questionQueue.push({ ...this.currentDraft });
                this.toastSuccess('تم حفظ السؤال بنجاح! ✅');
            }
        } catch (error: any) {
            const msg = error?.error?.message || 'حدث خطأ أثناء الحفظ. حاول مرة أخرى.';
            this.toastError(msg);
        } finally {
            this.isSaving = false;
        }
    }

    async saveAndAddAnother() {
        await this.saveCurrentQuestion();
        if (!this.isSaving) {
            // Keep same grade/subject/difficulty for convenience
            const prevGrade = this.currentDraft.grade;
            const prevSubject = this.currentDraft.subject;
            const prevDifficulty = this.currentDraft.difficulty;
            const prevTestType = this.currentDraft.testType;

            this.currentDraft = this.createEmptyDraft();
            this.currentDraft.grade = prevGrade;
            this.currentDraft.subject = prevSubject;
            this.currentDraft.difficulty = prevDifficulty;
            this.currentDraft.testType = prevTestType;

            this.currentStep = 1;
            this.stepValidity = [false, false, false, true, true];
        }
    }

    async saveAndFinish() {
        await this.saveCurrentQuestion();
        if (!this.isSaving) {
            this.router.navigate(['/admin/questions']);
        }
    }

    async saveAndStartType(typeValue: number) {
        await this.saveCurrentQuestion();
        if (!this.isSaving) {
            const prevGrade = this.currentDraft.grade;
            const prevSubject = this.currentDraft.subject;
            const prevDifficulty = this.currentDraft.difficulty;
            const prevTestType = this.currentDraft.testType;

            this.currentDraft = this.createEmptyDraft();
            this.currentDraft.type = typeValue;
            this.currentDraft.grade = prevGrade;
            this.currentDraft.subject = prevSubject;
            this.currentDraft.difficulty = prevDifficulty;
            this.currentDraft.testType = prevTestType;

            // Skip to step 3 since type and meta are set
            this.currentStep = 3;
            this.stepValidity[0] = true;
            this.stepValidity[1] = !!(prevGrade && prevSubject && prevDifficulty);
            this.stepValidity[2] = false;
        }
    }

    // ── Navigation helpers ────────────────────────
    goBack() {
        if (this.questionQueue.length > 0) {
            Swal.fire({
                title: 'هل تريد المغادرة؟',
                text: `تم حفظ ${this.questionQueue.length} سؤال. هل تريد العودة للقائمة؟`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'نعم، العودة',
                cancelButtonText: 'إلغاء',
                confirmButtonColor: '#c8a415'
            }).then((result) => {
                if (result.isConfirmed) {
                    this.router.navigate(['/admin/questions']);
                }
            });
        } else {
            this.router.navigate(['/admin/questions']);
        }
    }

    // ── Label helpers ─────────────────────────────
    getGradeLabel(value: number | null): string {
        return this.grades.find(g => g.value === value)?.label || '';
    }

    getSubjectLabel(value: number | null): string {
        return this.subjects.find(s => s.value === value)?.label || '';
    }

    getDifficultyLabel(value: number | null): string {
        return this.difficulties.find(d => d.value === value)?.label || '';
    }

    getDifficultyIcon(value: number | null): string {
        return this.difficulties.find(d => d.value === value)?.icon || '';
    }

    getTypeLabel(value: number | null): string {
        return this.questionTypes.find(t => t.value === value)?.label || '';
    }

    // ── Template helpers ───────────────────────────
    trackByIndex(index: number): number {
        return index;
    }

    isNonEmpty = (str: string): boolean => !!str?.trim();

    // ── Toasts ────────────────────────────────────
    toastSuccess(msg: string) {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2500
        });
        Toast.fire({ icon: 'success', title: msg });
    }

    toastError(msg: string) {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
        Toast.fire({ icon: 'error', title: msg });
    }
}
