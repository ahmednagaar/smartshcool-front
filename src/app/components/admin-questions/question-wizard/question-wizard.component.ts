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

interface SubQuestionDraft {
    text: string;
    options: string[];
    correctAnswerIndex: number | null;
    correctAnswer: string;
    explanation: string;
}

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
    savedId?: number;
    // Passage fields
    passageText: string;
    estimatedTimeMinutes: number | null;
    subQuestions: SubQuestionDraft[];
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
    totalSteps = 4;
    isEditMode = false;
    editQuestionId: number | null = null;
    isSaving = false;

    // Multi-question session
    questionQueue: QuestionDraft[] = [];
    currentDraft: QuestionDraft = this.createEmptyDraft();

    // Step validation (4 steps: metadata, content, preview, save)
    stepValidity: boolean[] = [false, false, true, true];

    // Options data
    grades = [
        { value: 3, label: 'الصف الثالث' },
        { value: 4, label: 'الصف الرابع' },
        { value: 5, label: 'الصف الخامس' },
        { value: 6, label: 'الصف السادس' }
    ];

    // Dynamic grades based on testType (1=نافس → 3,6 only; 2=مركزي or 3=Both → all)
    get availableGrades() {
        if (this.currentDraft.testType === 1) {
            return this.grades.filter(g => g.value === 3 || g.value === 6);
        }
        return this.grades;
    }

    onTestTypeChange(newType: number) {
        this.currentDraft.testType = newType;
        // Reset grade if it's not valid for the new test type
        if (newType === 1 && this.currentDraft.grade !== 3 && this.currentDraft.grade !== 6) {
            this.currentDraft.grade = 0;
        }
        this.onMetaChange();
    }

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
            value: 6,
            label: 'قطعة فهم',
            icon: '📄',
            description: 'نص قراءة مع أسئلة فرعية متعددة',
            example: 'اقرأ النص التالي ثم أجب عن الأسئلة'
        }
    ];

    stepLabels = ['التفاصيل', 'المحتوى', 'المعاينة', 'الحفظ'];

    constructor(
        private api: ApiService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        // Default to MCQ
        this.currentDraft.type = 1;

        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode = true;
            this.editQuestionId = Number(id);
            this.loadQuestionForEdit();
        }
    }

    // ── Passage helpers ──────────────────────────
    get isPassageType(): boolean {
        return this.currentDraft.type === 6;
    }

    selectType(type: number) {
        this.currentDraft.type = type;
        if (type === 6) {
            // Initialize passage defaults
            if (this.currentDraft.subQuestions.length === 0) {
                this.addSubQuestion();
                this.addSubQuestion();
            }
        }
        this.onMetaChange();
    }

    // ── Draft factory ─────────────────────────────
    createEmptyDraft(): QuestionDraft {
        return {
            type: 1,
            grade: null,
            subject: null,
            difficulty: null,
            testType: 2,
            text: '',
            options: ['', '', '', ''],
            correctAnswer: '',
            correctAnswerIndex: null,
            mediaUrl: '',
            passageText: '',
            estimatedTimeMinutes: null,
            subQuestions: []
        };
    }

    createEmptySubQuestion(): SubQuestionDraft {
        return {
            text: '',
            options: ['', '', '', ''],
            correctAnswerIndex: null,
            correctAnswer: '',
            explanation: ''
        };
    }

    // ── Sub-Question CRUD ──────────────────────────
    addSubQuestion() {
        if (this.currentDraft.subQuestions.length < 20) {
            this.currentDraft.subQuestions.push(this.createEmptySubQuestion());
        }
    }

    removeSubQuestion(index: number) {
        if (this.currentDraft.subQuestions.length > 2) {
            this.currentDraft.subQuestions.splice(index, 1);
            this.validateStep2();
        }
    }

    addSubQuestionOption(sqIndex: number) {
        const sq = this.currentDraft.subQuestions[sqIndex];
        if (sq && sq.options.length < 6) {
            sq.options.push('');
        }
    }

    removeSubQuestionOption(sqIndex: number, optIndex: number) {
        const sq = this.currentDraft.subQuestions[sqIndex];
        if (sq && sq.options.length > 2) {
            sq.options.splice(optIndex, 1);
            if (sq.correctAnswerIndex === optIndex) {
                sq.correctAnswerIndex = null;
                sq.correctAnswer = '';
            } else if (sq.correctAnswerIndex !== null && sq.correctAnswerIndex > optIndex) {
                sq.correctAnswerIndex--;
            }
            this.validateStep2();
        }
    }

    selectSubQuestionCorrectAnswer(sqIndex: number, optIndex: number) {
        const sq = this.currentDraft.subQuestions[sqIndex];
        if (sq) {
            sq.correctAnswerIndex = optIndex;
            sq.correctAnswer = sq.options[optIndex];
            this.validateStep2();
        }
    }

    // ── Edit mode ─────────────────────────────────
    loadQuestionForEdit() {
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

            // Build sub-questions from API data
            let subQuestions: SubQuestionDraft[] = [];
            if (q.type === 6 && q.subQuestions && Array.isArray(q.subQuestions)) {
                subQuestions = q.subQuestions.map((sq: any) => {
                    let sqOptions = ['', '', '', ''];
                    let sqCorrectIndex: number | null = null;
                    try {
                        const parsed = typeof sq.options === 'string' ? JSON.parse(sq.options) : sq.options;
                        if (Array.isArray(parsed)) {
                            sqOptions = parsed;
                            sqCorrectIndex = parsed.indexOf(sq.correctAnswer);
                            if (sqCorrectIndex === -1) sqCorrectIndex = null;
                        }
                    } catch { }
                    return {
                        text: sq.text || '',
                        options: sqOptions,
                        correctAnswerIndex: sqCorrectIndex,
                        correctAnswer: sq.correctAnswer || '',
                        explanation: sq.explanation || ''
                    } as SubQuestionDraft;
                });
            }

            this.currentDraft = {
                type: q.type || 1,
                grade: q.grade,
                subject: q.subject,
                difficulty: q.difficulty,
                testType: q.testType || 2,
                text: q.text || '',
                options,
                correctAnswer: q.correctAnswer || '',
                correctAnswerIndex,
                mediaUrl: q.mediaUrl || '',
                passageText: q.passageText || '',
                estimatedTimeMinutes: q.estimatedTimeMinutes || null,
                subQuestions
            };

            this.stepValidity = [true, true, true, true];
        } else {
            this.toastError('لم يتم العثور على بيانات السؤال');
            this.router.navigate(['/admin/questions']);
        }
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

    // ── MCQ Options ──────────────────────────────
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
        this.validateStep2();
    }

    getOptionLabel(index: number): string {
        return ['أ', 'ب', 'ج', 'د', 'هـ', 'و'][index] || String(index + 1);
    }

    // ── Validation ────────────────────────────────
    validateStep1() {
        this.stepValidity[0] =
            this.currentDraft.type !== null &&
            this.currentDraft.grade !== null &&
            this.currentDraft.subject !== null &&
            this.currentDraft.difficulty !== null;
    }

    validateStep2() {
        if (this.isPassageType) {
            // Passage validation
            const hasText = this.currentDraft.text.trim().length >= 5;
            const hasPassage = this.currentDraft.passageText.trim().length >= 100;
            const hasSubs = this.currentDraft.subQuestions.length >= 2;

            let allSubsValid = true;
            for (const sq of this.currentDraft.subQuestions) {
                const sqHasText = sq.text.trim().length >= 5;
                const sqValidOpts = sq.options.filter(o => o.trim()).length >= 2;
                const sqHasAnswer = sq.correctAnswerIndex !== null
                    && !!sq.options[sq.correctAnswerIndex]?.trim();
                if (!sqHasText || !sqValidOpts || !sqHasAnswer) {
                    allSubsValid = false;
                    break;
                }
            }

            this.stepValidity[1] = hasText && hasPassage && hasSubs && allSubsValid;
        } else {
            // MCQ validation
            const hasText = this.currentDraft.text.trim().length >= 10;
            const validOptions = this.currentDraft.options.filter(o => o.trim()).length;
            const hasAnswer = validOptions >= 2 && this.currentDraft.correctAnswerIndex !== null
                && !!this.currentDraft.options[this.currentDraft.correctAnswerIndex]?.trim();
            this.stepValidity[1] = hasText && hasAnswer;
        }
    }

    onContentChange() {
        this.validateStep2();
    }

    onMetaChange() {
        this.validateStep1();
    }

    // ── Save ──────────────────────────────────────
    buildOptionsJson(): string | null {
        if (this.isPassageType) return null;
        const validOptions = this.currentDraft.options.filter(o => o.trim());
        return validOptions.length >= 2 ? JSON.stringify(validOptions) : null;
    }

    buildCorrectAnswer(): string {
        if (this.isPassageType) return '';
        return this.currentDraft.correctAnswer;
    }

    buildSubQuestionsPayload(): any[] | null {
        if (!this.isPassageType) return null;
        return this.currentDraft.subQuestions.map((sq, i) => {
            const validOpts = sq.options.filter(o => o.trim());
            return {
                orderIndex: i + 1,
                text: sq.text.trim(),
                options: JSON.stringify(validOpts),
                correctAnswer: sq.correctAnswer,
                explanation: sq.explanation?.trim() || null
            };
        });
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
            correctAnswer: this.buildCorrectAnswer() || null
        };

        // Add passage fields
        if (this.isPassageType) {
            payload.passageText = this.currentDraft.passageText;
            payload.estimatedTimeMinutes = this.currentDraft.estimatedTimeMinutes;
            payload.subQuestions = this.buildSubQuestionsPayload();
        }

        try {
            // Handle "Both" (testType === 3): save for Nafes (1) and Central (2)
            if (this.currentDraft.testType === 3) {
                const payloadNafes = { ...payload, testType: 1 };
                const payloadCentral = { ...payload, testType: 2 };
                // Re-add passage subQuestions (spread doesn't deep-copy)
                if (this.isPassageType) {
                    payloadNafes.subQuestions = this.buildSubQuestionsPayload();
                    payloadCentral.subQuestions = this.buildSubQuestionsPayload();
                }

                if (this.isEditMode && this.editQuestionId) {
                    await this.api.updateQuestion(this.editQuestionId, payloadNafes).toPromise();
                    await this.api.createQuestion(payloadCentral).toPromise();
                    this.toastSuccess('تم حفظ السؤال لنافس والمركزي بنجاح! ✅');
                } else {
                    await this.api.createQuestion(payloadNafes).toPromise();
                    await this.api.createQuestion(payloadCentral).toPromise();
                    this.questionQueue.push({ ...this.currentDraft });
                    this.toastSuccess('تم حفظ السؤال لنافس والمركزي بنجاح! ✅');
                }
            } else {
                if (this.isEditMode && this.editQuestionId) {
                    await this.api.updateQuestion(this.editQuestionId, payload).toPromise();
                    this.toastSuccess('تم تحديث السؤال بنجاح! ✅');
                } else {
                    await this.api.createQuestion(payload).toPromise();
                    this.questionQueue.push({ ...this.currentDraft });
                    this.toastSuccess('تم حفظ السؤال بنجاح! ✅');
                }
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
            const prevType = this.currentDraft.type;

            this.currentDraft = this.createEmptyDraft();
            this.currentDraft.grade = prevGrade;
            this.currentDraft.subject = prevSubject;
            this.currentDraft.difficulty = prevDifficulty;
            this.currentDraft.testType = prevTestType;
            this.currentDraft.type = prevType;

            // If passage type, re-initialize sub-questions
            if (prevType === 6) {
                this.addSubQuestion();
                this.addSubQuestion();
            }

            // Skip to step 2 (content) since metadata is pre-filled
            this.currentStep = 2;
            this.stepValidity = [
                !!(prevGrade && prevSubject && prevDifficulty),
                false,
                true,
                true
            ];
        }
    }

    async saveAndFinish() {
        await this.saveCurrentQuestion();
        if (!this.isSaving) {
            this.router.navigate(['/admin/questions']);
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
