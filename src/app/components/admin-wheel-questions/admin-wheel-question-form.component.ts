import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { WheelQuestionService } from '../../services/wheel-question.service';
import { CreateWheelQuestionDto, WheelQuestion } from '../../models/wheel-game.model';
import { DifficultyLevel, QuestionType, TestType } from '../../models/models';
import { LucideAngularModule, ArrowRight, Save, Plus, Trash2, CheckCircle, AlertCircle, Info } from 'lucide-angular';

@Component({
    selector: 'app-admin-wheel-question-form',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
    templateUrl: './admin-wheel-question-form.component.html',
    styleUrls: ['./admin-wheel-question-form.component.css']
})
export class AdminWheelQuestionFormComponent implements OnInit {
    isEditMode = false;
    questionId?: number;
    loading = false;
    saving = false;
    submitted = false;

    // Toast
    toastMessage = '';
    toastType: 'success' | 'error' | 'info' = 'info';
    toastVisible = false;

    // Icons
    readonly ArrowRightIcon = ArrowRight;
    readonly SaveIcon = Save;
    readonly PlusIcon = Plus;
    readonly Trash2Icon = Trash2;
    readonly CheckCircleIcon = CheckCircle;
    readonly AlertCircleIcon = AlertCircle;
    readonly InfoIcon = Info;

    // Constants
    readonly MIN_WRONG_ANSWERS = 1;
    readonly MAX_WRONG_ANSWERS = 5;

    // Form Model
    model: CreateWheelQuestionDto = {
        gradeId: 4,
        subjectId: 1,
        questionText: '',
        questionType: QuestionType.MultipleChoice,
        correctAnswer: '',
        wrongAnswers: ['', '', ''],
        difficultyLevel: DifficultyLevel.Medium,
        pointsValue: 20,
        timeLimit: 30,
        hintText: '',
        explanation: '',
        categoryTag: '',
        displayOrder: 0
    };

    testType: number = TestType.Nafes;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private wheelService: WheelQuestionService
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id && id !== 'new') {
            this.isEditMode = true;
            this.questionId = +id;
            this.loadQuestion(this.questionId);
        }
    }

    loadQuestion(id: number): void {
        this.loading = true;
        this.wheelService.getById(id).subscribe({
            next: (q: WheelQuestion) => {
                this.model = {
                    gradeId: q.gradeId,
                    subjectId: q.subjectId,
                    questionText: q.questionText,
                    questionType: q.questionType,
                    correctAnswer: q.correctAnswer,
                    wrongAnswers: this.extractWrongAnswers(q.options, q.correctAnswer),
                    difficultyLevel: q.difficultyLevel,
                    pointsValue: q.pointsValue,
                    timeLimit: q.timeLimit,
                    hintText: q.hintText || '',
                    explanation: q.explanation || '',
                    categoryTag: q.categoryTag || '',
                    displayOrder: q.displayOrder || 0
                };
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading question', err);
                this.showToast('فشل تحميل بيانات السؤال', 'error');
                setTimeout(() => this.router.navigate(['/admin/wheel-questions']), 1500);
            }
        });
    }

    private extractWrongAnswers(options: string[], correctAnswer: string): string[] {
        if (!options) return [''];
        const wrong = options.filter(o => o !== correctAnswer);
        return wrong.length > 0 ? wrong : [''];
    }

    // ========== OPTIONS MANAGEMENT ==========

    addWrongAnswer(): void {
        if (this.model.wrongAnswers.length < this.MAX_WRONG_ANSWERS) {
            this.model.wrongAnswers.push('');
        }
    }

    removeWrongAnswer(index: number): void {
        if (this.model.wrongAnswers.length > this.MIN_WRONG_ANSWERS) {
            this.model.wrongAnswers.splice(index, 1);
        }
    }

    get canAddMore(): boolean {
        return this.model.wrongAnswers.length < this.MAX_WRONG_ANSWERS;
    }

    get canRemove(): boolean {
        return this.model.wrongAnswers.length > this.MIN_WRONG_ANSWERS;
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    // ========== VALIDATION ==========

    get hasDuplicateAnswers(): boolean {
        const allAnswers = [this.model.correctAnswer, ...this.model.wrongAnswers]
            .map(a => a.trim().toLowerCase())
            .filter(a => a.length > 0);
        return new Set(allAnswers).size !== allAnswers.length;
    }

    get hasEmptyWrongAnswers(): boolean {
        return this.model.wrongAnswers.some(w => !w.trim());
    }

    get isQuestionTextValid(): boolean {
        return this.model.questionText.trim().length >= 5;
    }

    get isCorrectAnswerValid(): boolean {
        return this.model.correctAnswer.trim().length > 0;
    }

    get isFormValid(): boolean {
        return this.isQuestionTextValid
            && this.isCorrectAnswerValid
            && !this.hasEmptyWrongAnswers
            && !this.hasDuplicateAnswers;
    }

    get completedFieldsCount(): number {
        let count = 0;
        if (this.isQuestionTextValid) count++;
        if (this.model.gradeId) count++;
        if (this.model.subjectId) count++;
        if (this.model.difficultyLevel) count++;
        if (this.isCorrectAnswerValid) count++;
        if (!this.hasEmptyWrongAnswers) count++;
        return count;
    }

    readonly totalRequiredFields = 6;

    get completionPercentage(): number {
        return Math.round((this.completedFieldsCount / this.totalRequiredFields) * 100);
    }

    getFormErrors(): string[] {
        const errors: string[] = [];
        if (!this.isQuestionTextValid) errors.push('نص السؤال مطلوب (5 أحرف على الأقل)');
        if (!this.isCorrectAnswerValid) errors.push('الإجابة الصحيحة مطلوبة');
        if (this.hasEmptyWrongAnswers) errors.push('جميع خانات الإجابات الخاطئة يجب ملؤها');
        if (this.hasDuplicateAnswers) errors.push('يوجد تكرار في الإجابات');
        return errors;
    }

    // ========== SAVE ==========

    saveQuestion(): void {
        this.submitted = true;

        if (!this.isFormValid) {
            const errors = this.getFormErrors();
            this.showToast(errors[0], 'error');
            return;
        }

        this.saving = true;

        // Build payload with testType
        const payload: any = {
            ...this.model,
            testType: this.testType
        };

        if (this.isEditMode && this.questionId) {
            this.wheelService.update(this.questionId, { ...payload, isActive: true }).subscribe({
                next: () => {
                    this.showToast('تم تعديل السؤال بنجاح ✅', 'success');
                    setTimeout(() => this.router.navigate(['/admin/wheel-questions']), 1200);
                },
                error: (err) => {
                    this.saving = false;
                    this.handleApiError(err);
                }
            });
        } else {
            this.wheelService.create(payload).subscribe({
                next: () => {
                    this.showToast('تم إضافة السؤال بنجاح ✅', 'success');
                    setTimeout(() => this.router.navigate(['/admin/wheel-questions']), 1200);
                },
                error: (err) => {
                    this.saving = false;
                    this.handleApiError(err);
                }
            });
        }
    }

    private handleApiError(err: any): void {
        console.error('API Error:', err);
        if (err.status === 400 && err.error?.errors) {
            // Parse backend validation errors
            const messages = Object.values(err.error.errors).flat() as string[];
            this.showToast(messages[0] || 'خطأ في البيانات المدخلة', 'error');
        } else if (err.status === 401) {
            this.showToast('يرجى تسجيل الدخول مرة أخرى', 'error');
        } else if (err.status === 403) {
            this.showToast('ليست لديك صلاحية لتنفيذ هذا الإجراء', 'error');
        } else if (err.status === 0) {
            this.showToast('فشل الاتصال بالخادم. تحقق من الإنترنت', 'error');
        } else {
            this.showToast('حدث خطأ غير متوقع. حاول مرة أخرى', 'error');
        }
    }

    // ========== TOAST ==========

    showToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 4000): void {
        this.toastMessage = message;
        this.toastType = type;
        this.toastVisible = true;
        setTimeout(() => {
            this.toastVisible = false;
        }, duration);
    }
}
