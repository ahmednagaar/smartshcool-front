import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { FlipCardQuestionService } from '../../../services/flip-card-question.service';
import {
    FlipCardGameMode,
    FlipCardTimerMode,
    FlipCardContentType,
    CreateFlipCardQuestionDto,
    UpdateFlipCardQuestionDto
} from '../../../models/flip-card.model';
import { GradeLevel, SubjectType } from '../../../models/drag-drop.model';
import { LucideAngularModule, ChevronLeft, ChevronRight, Save, Plus, Trash2, Image, Mic, Type, Copy } from 'lucide-angular';

@Component({
    selector: 'app-admin-flipcard-question-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
    templateUrl: './admin-flipcard-question-form.component.html',
    styleUrls: ['./admin-flipcard-question-form.component.css']
})
export class AdminFlipCardQuestionFormComponent implements OnInit, OnDestroy {
    questionForm: FormGroup;
    isEditMode = false;
    questionId: number | null = null;
    loading = false;
    currentStep = 1;

    // Pair constraints (must match backend [Range(4, 12)])
    readonly MIN_PAIRS = 4;
    readonly MAX_PAIRS = 12;

    // Toast notification system
    toastMessage = '';
    toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
    toastVisible = false;
    private toastTimeout: any;

    // Enums for template
    GradeLevel = GradeLevel;
    SubjectType = SubjectType;
    FlipCardGameMode = FlipCardGameMode;
    FlipCardTimerMode = FlipCardTimerMode;
    FlipCardContentType = FlipCardContentType;

    // Track subscriptions for cleanup
    private subscriptions: Subscription[] = [];

    // Options
    themes = [
        { id: 'modern', name: 'عصري' },
        { id: 'kids', name: 'أطفال' },
        { id: 'dark', name: 'داكن' }
    ];

    cardBacks = [
        { id: 'standard', name: 'قياسي' },
        { id: 'pattern', name: 'نمط' },
        { id: 'logo', name: 'شعار المدرسة' }
    ];

    categories = [
        { id: 'عام', name: 'عام' },
        { id: 'مفردات', name: 'مفردات' },
        { id: 'قواعد', name: 'قواعد' },
        { id: 'أرقام', name: 'أرقام' },
        { id: 'علوم', name: 'علوم' },
        { id: 'جغرافيا', name: 'جغرافيا' }
    ];

    constructor(
        private fb: FormBuilder,
        private questionService: FlipCardQuestionService,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.questionForm = this.fb.group({
            // Step 1: Basic Info
            gameTitle: ['', [Validators.required, Validators.minLength(3)]],
            instructions: ['طابق الأزواج المتشابهة', [Validators.required]],
            gradeId: [null, [Validators.required]],
            subjectId: [null, [Validators.required]],
            gameMode: [FlipCardGameMode.Classic, [Validators.required]],
            difficultyLevel: [1],
            isActive: [true],
            category: ['عام'],

            // Step 2: Settings
            timerMode: [FlipCardTimerMode.None, [Validators.required]],
            timeLimitSeconds: [60],
            showHints: [true],
            maxHints: [3],
            uiTheme: ['modern'],
            cardBackDesign: ['standard'],
            customCardBackUrl: [''],

            // Scoring & Options
            pointsPerMatch: [10],
            movePenalty: [0],
            enableAudio: [false],
            enableExplanations: [false],

            // Step 3: Pairs
            pairs: this.fb.array([])
        });
    }

    get pairs(): FormArray {
        return this.questionForm.get('pairs') as FormArray;
    }

    /** Check if timer settings should be visible */
    get isTimerEnabled(): boolean {
        return this.questionForm.get('timerMode')?.value !== FlipCardTimerMode.None;
    }

    /** Check if explanations are enabled */
    get explanationsEnabled(): boolean {
        return this.questionForm.get('enableExplanations')?.value === true;
    }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode = true;
            this.questionId = +id;
            this.loadQuestion(this.questionId);
        } else {
            // Initialize with MIN_PAIRS (backend requires at least 4)
            for (let i = 0; i < this.MIN_PAIRS; i++) {
                this.addPair();
            }
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
    }

    // ========== TOAST NOTIFICATIONS ==========
    showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration = 4000): void {
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastMessage = message;
        this.toastType = type;
        this.toastVisible = true;

        this.toastTimeout = setTimeout(() => {
            this.dismissToast();
        }, duration);
    }

    dismissToast(): void {
        this.toastVisible = false;
    }

    // ========== LOAD QUESTION (EDIT MODE) ==========
    loadQuestion(id: number): void {
        this.loading = true;
        this.questionService.getById(id).subscribe({
            next: (data) => {
                this.questionForm.patchValue({
                    gameTitle: data.gameTitle,
                    instructions: data.instructions,
                    gradeId: data.gradeId,
                    subjectId: data.subjectId,
                    gameMode: data.gameMode,
                    difficultyLevel: data.difficultyLevel,
                    isActive: data.isActive,
                    category: data.category,
                    timerMode: data.timerMode,
                    timeLimitSeconds: data.timeLimitSeconds,
                    showHints: data.showHints,
                    maxHints: data.maxHints,
                    uiTheme: data.uiTheme,
                    cardBackDesign: data.cardBackDesign,
                    customCardBackUrl: data.customCardBackUrl,
                    pointsPerMatch: data.pointsPerMatch,
                    movePenalty: data.movePenalty,
                    enableAudio: data.enableAudio,
                    enableExplanations: data.enableExplanations
                });

                // Clear and rebuild pairs array
                this.pairs.clear();
                data.pairs.forEach(p => {
                    const group = this.createPairGroup();
                    group.patchValue({
                        id: p.id,
                        card1Type: p.card1Type,
                        card1Text: p.card1Text,
                        card1ImageUrl: p.card1ImageUrl,
                        card1AudioUrl: p.card1AudioUrl,
                        card2Type: p.card2Type,
                        card2Text: p.card2Text,
                        card2ImageUrl: p.card2ImageUrl,
                        card2AudioUrl: p.card2AudioUrl
                    });
                    this.pairs.push(group);
                });

                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to load question', err);
                this.loading = false;
                this.showToast('فشل تحميل بيانات اللعبة', 'error');
            }
        });
    }

    // ========== PAIR MANAGEMENT ==========
    createPairGroup(): FormGroup {
        const group = this.fb.group({
            id: [0],
            // Card 1
            card1Type: [FlipCardContentType.Text, Validators.required],
            card1Text: [''],
            card1ImageUrl: [''],
            card1AudioUrl: [''],
            // Card 2
            card2Type: [FlipCardContentType.Text, Validators.required],
            card2Text: [''],
            card2ImageUrl: [''],
            card2AudioUrl: [''],
            // Explanation (Phase 3 - for pair explanation toast)
            explanation: ['']
        });

        this.setupCardValidators(group, 'card1Type', 'card1Text', 'card1ImageUrl', 'card1AudioUrl');
        this.setupCardValidators(group, 'card2Type', 'card2Text', 'card2ImageUrl', 'card2AudioUrl');

        return group;
    }

    private setupCardValidators(
        group: FormGroup,
        typeControl: string,
        textControl: string,
        imageControl: string,
        audioControl: string
    ): void {
        const type = group.get(typeControl);
        const text = group.get(textControl);
        const image = group.get(imageControl);
        const audio = group.get(audioControl);

        if (!type || !text || !image || !audio) return;

        const sub = type.valueChanges.subscribe((cardType: FlipCardContentType) => {
            text.clearValidators();
            image.clearValidators();
            audio.clearValidators();

            switch (cardType) {
                case FlipCardContentType.Text:
                    text.setValidators([Validators.required]);
                    break;
                case FlipCardContentType.Image:
                    image.setValidators([Validators.required]);
                    break;
                case FlipCardContentType.Audio:
                    audio.setValidators([Validators.required]);
                    break;
                case FlipCardContentType.Mixed:
                default:
                    text.setValidators([Validators.required]);
                    break;
            }

            text.updateValueAndValidity();
            image.updateValueAndValidity();
            audio.updateValueAndValidity();
        });

        this.subscriptions.push(sub);

        type.updateValueAndValidity({ emitEvent: true });

        const currentType = type.value as FlipCardContentType;
        text.clearValidators();
        image.clearValidators();
        audio.clearValidators();
        if (currentType === FlipCardContentType.Text || currentType === FlipCardContentType.Mixed) {
            text.setValidators([Validators.required]);
        } else if (currentType === FlipCardContentType.Image) {
            image.setValidators([Validators.required]);
        } else if (currentType === FlipCardContentType.Audio) {
            audio.setValidators([Validators.required]);
        }
        text.updateValueAndValidity();
        image.updateValueAndValidity();
        audio.updateValueAndValidity();
    }

    addPair(): void {
        if (this.pairs.length >= this.MAX_PAIRS) {
            this.showToast(`الحد الأقصى هو ${this.MAX_PAIRS} زوج`, 'warning');
            return;
        }
        this.pairs.push(this.createPairGroup());
    }

    removePair(index: number): void {
        if (this.pairs.length <= this.MIN_PAIRS) {
            this.showToast(`الحد الأدنى هو ${this.MIN_PAIRS} أزواج. لا يمكن الحذف`, 'warning');
            return;
        }
        this.pairs.removeAt(index);
        this.showToast('تم حذف الزوج', 'info', 2000);
    }

    duplicatePair(index: number): void {
        if (this.pairs.length >= this.MAX_PAIRS) {
            this.showToast(`الحد الأقصى هو ${this.MAX_PAIRS} زوج`, 'warning');
            return;
        }

        const source = this.pairs.at(index) as FormGroup;
        const newGroup = this.createPairGroup();
        newGroup.patchValue({
            ...source.value,
            id: 0  // Reset ID for new pair
        });
        this.pairs.insert(index + 1, newGroup);
        this.showToast('تم نسخ الزوج', 'success', 2000);
    }

    // ========== DIFFICULTY LEVEL ==========
    setDifficulty(level: number): void {
        this.questionForm.patchValue({ difficultyLevel: level });
    }

    // ========== WIZARD NAVIGATION ==========
    nextStep(): void {
        if (!this.validateCurrentStep()) {
            return;
        }
        if (this.currentStep < 3) {
            this.currentStep++;
        }
    }

    prevStep(): void {
        if (this.currentStep > 1) {
            this.currentStep--;
        }
    }

    setStep(step: number): void {
        this.currentStep = step;
    }

    private validateCurrentStep(): boolean {
        switch (this.currentStep) {
            case 1: {
                const title = this.questionForm.get('gameTitle');
                const grade = this.questionForm.get('gradeId');
                const subject = this.questionForm.get('subjectId');

                if (title?.invalid) {
                    this.showToast('يرجى إدخال عنوان اللعبة (3 أحرف على الأقل)', 'warning');
                    title.markAsTouched();
                    return false;
                }
                if (grade?.invalid) {
                    this.showToast('يرجى اختيار الصف الدراسي', 'warning');
                    grade.markAsTouched();
                    return false;
                }
                if (subject?.invalid) {
                    this.showToast('يرجى اختيار المادة', 'warning');
                    subject.markAsTouched();
                    return false;
                }
                return true;
            }
            case 2:
                return true;
            default:
                return true;
        }
    }

    // ========== SUBMIT ==========
    onSubmit(): void {
        if (this.questionForm.invalid) {
            this.questionForm.markAllAsTouched();

            const errors: string[] = [];

            if (this.questionForm.get('gameTitle')?.invalid) {
                errors.push('عنوان اللعبة مطلوب (3 أحرف على الأقل)');
            }
            if (this.questionForm.get('gradeId')?.invalid) {
                errors.push('اختر الصف الدراسي');
            }
            if (this.questionForm.get('subjectId')?.invalid) {
                errors.push('اختر المادة');
            }

            if (this.pairs.length < this.MIN_PAIRS) {
                errors.push(`الحد الأدنى ${this.MIN_PAIRS} أزواج (حالياً: ${this.pairs.length})`);
            }

            let invalidPairCount = 0;
            this.pairs.controls.forEach((pair) => {
                if (pair.invalid) {
                    invalidPairCount++;
                }
            });

            if (invalidPairCount > 0) {
                errors.push(`${invalidPairCount} زوج غير مكتمل - تحقق من المحتوى المطلوب`);
            }

            const errorMessage = errors.length > 0
                ? errors.join(' • ')
                : 'الرجاء تعبئة جميع الحقول المطلوبة';

            this.showToast(errorMessage, 'error', 6000);
            return;
        }

        this.loading = true;
        const formValue = this.questionForm.value;

        if (this.isEditMode && this.questionId) {
            const updateDto: UpdateFlipCardQuestionDto = {
                ...formValue,
                id: this.questionId,
                numberOfPairs: formValue.pairs.length
            };

            this.questionService.update(this.questionId, updateDto).subscribe({
                next: () => {
                    this.showToast('تم تحديث اللعبة بنجاح! ✅', 'success');
                    setTimeout(() => {
                        this.router.navigate(['../../list'], { relativeTo: this.route });
                    }, 1500);
                },
                error: (err) => {
                    console.error('Update error:', err);
                    this.loading = false;
                    const message = err?.error?.message || err?.message || 'حدث خطأ أثناء تحديث اللعبة';
                    this.showToast('فشل التحديث: ' + message, 'error', 6000);
                }
            });
        } else {
            const createDto: CreateFlipCardQuestionDto = {
                ...formValue,
                numberOfPairs: formValue.pairs.length,
                displayOrder: 0
            };

            this.questionService.create(createDto).subscribe({
                next: () => {
                    this.showToast('تم إنشاء اللعبة بنجاح! ✅', 'success');
                    setTimeout(() => {
                        this.router.navigate(['../list'], { relativeTo: this.route });
                    }, 1500);
                },
                error: (err) => {
                    console.error('Create error:', err);
                    this.loading = false;
                    const message = err?.error?.message || err?.message || 'حدث خطأ أثناء إنشاء اللعبة';
                    this.showToast('فشل الإنشاء: ' + message, 'error', 6000);
                }
            });
        }
    }
}
