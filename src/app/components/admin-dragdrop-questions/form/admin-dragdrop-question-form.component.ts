import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ArrowRight, Check, Plus, Trash, AlertTriangle } from 'lucide-angular';
import { DragDropQuestionService } from '../../../services/drag-drop-question.service';
import {
    CreateDragDropQuestionDto,
    UpdateDragDropQuestionDto,
    UITheme,
    GradeLevel,
    SubjectType,
    CreateDragDropZoneDto,
    CreateDragDropItemDto
} from '../../../models/drag-drop.model';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-admin-dragdrop-question-form',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
    templateUrl: './admin-dragdrop-question-form.component.html',
    styles: [`
    .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AdminDragDropQuestionFormComponent implements OnInit {
    isEditMode = false;
    questionId: number | null = null;
    currentStep = 1;
    steps = ['البيانات الأساسية', 'المظهر', 'المجموعات', 'العناصر', 'مراجعة'];

    // Data
    themes: UITheme[] = [];
    loadingThemes = false;
    isSaving = false;

    grades = [
        { value: GradeLevel.Grade3, label: 'الصف الثالث' },
        { value: GradeLevel.Grade4, label: 'الصف الرابع' },
        { value: GradeLevel.Grade5, label: 'الصف الخامس' },
        { value: GradeLevel.Grade6, label: 'الصف السادس' }
    ];

    subjects = [
        { value: SubjectType.Arabic, label: 'لغتي' },
        { value: SubjectType.Math, label: 'الرياضيات' },
        { value: SubjectType.Science, label: 'العلوم' }
    ];

    // Model
    question: CreateDragDropQuestionDto = {
        grade: GradeLevel.Grade3,
        subject: SubjectType.Science,
        gameTitle: '',
        instructions: '',
        numberOfZones: 2,
        zones: [
            { label: 'مجموعة 1', colorCode: '#4CAF50', zoneOrder: 1 },
            { label: 'مجموعة 2', colorCode: '#FF9800', zoneOrder: 2 }
        ],
        items: [],
        pointsPerCorrectItem: 10,
        showImmediateFeedback: true,
        uiTheme: 'modern'
    };

    constructor(
        private service: DragDropQuestionService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.loadThemes();

        // Check Edit Mode
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode = true;
            this.questionId = +id;
            this.loadQuestion(this.questionId);
        }
    }

    loadThemes(): void {
        this.loadingThemes = true;
        this.service.getThemes().subscribe(themes => {
            this.themes = themes;
            this.loadingThemes = false;
        });
    }

    loadQuestion(id: number): void {
        this.service.getQuestionById(id).subscribe(q => {
            // Map response to DTO structure for form
            // Note: Create DTO is slightly different specifically in Items (CorrectZoneIndex vs ID)
            // For simple editing, we might need to map ID based logic back to Index based or handle it.
            // For Phase 2 MVP, implementing creating new games is priority. Editing can reload data.

            this.question = {
                grade: q.grade,
                subject: q.subject,
                gameTitle: q.gameTitle,
                instructions: q.instructions,
                numberOfZones: q.zones.length,
                zones: q.zones.map(z => ({
                    label: z.label,
                    colorCode: z.colorCode,
                    zoneOrder: z.zoneOrder
                })),
                items: q.items.map(i => {
                    // Find index of zone with ID = correctZoneId
                    const zoneIndex = q.zones.findIndex(z => z.id === i.correctZoneId);
                    return {
                        text: i.text,
                        itemOrder: i.itemOrder,
                        correctZoneIndex: zoneIndex
                    };
                }),
                pointsPerCorrectItem: q.pointsPerCorrectItem,
                showImmediateFeedback: q.showImmediateFeedback,
                uiTheme: q.uiTheme
            };
        });
    }

    // Navigation
    goToStep(step: number): void {
        if (this.validateStep(this.currentStep)) {
            this.currentStep = step;
        }
    }

    nextStep(): void {
        if (this.currentStep < 5 && this.validateStep(this.currentStep)) {
            this.currentStep++;
        }
    }

    validateStep(step: number): boolean {
        switch (step) {
            case 1:
                if (!this.question.gameTitle) {
                    this.toastError('يرجى إدخال عنوان اللعبة');
                    return false;
                }
                return true;
            case 3:
                if (this.question.zones.length < 2) {
                    this.toastError('يجب إضافة مجموعتين على الأقل');
                    return false;
                }
                // Check empty labels
                if (this.question.zones.some(z => !z.label)) {
                    this.toastError('يرجى تسمية جميع المجموعات');
                    return false;
                }
                return true;
            case 4:
                // Check items linked
                if (this.question.items.some(i => i.correctZoneIndex < 0)) {
                    this.toastError('يرجى تحديد المجموعة الصحيحة لكل عنصر');
                    return false;
                }
                return true;
            default:
                return true;
        }
    }

    // Logic
    selectTheme(themeId: string): void {
        this.question.uiTheme = themeId;
    }

    addZone(): void {
        if (this.question.zones.length >= 5) {
            this.toastError('الحد الأقصى 5 مجموعات');
            return;
        }
        this.question.zones.push({
            label: '',
            colorCode: '#cccccc',
            zoneOrder: this.question.zones.length + 1
        });
    }

    removeZone(index: number): void {
        this.question.zones.splice(index, 1);
        // Reset items that point to this index or shift indices?
        // Very tricky. Better to reset items mapped to higher indices or warn.
        this.question.items.forEach(i => {
            if (i.correctZoneIndex === index) i.correctZoneIndex = -1;
            else if (i.correctZoneIndex > index) i.correctZoneIndex--;
        });
    }

    addItem(): void {
        this.question.items.push({
            text: '',
            itemOrder: this.question.items.length + 1,
            correctZoneIndex: -1 // Invalid initially
        });
    }

    removeItem(index: number): void {
        this.question.items.splice(index, 1);
    }

    saveGame(): void {
        this.isSaving = true;
        this.question.numberOfZones = this.question.zones.length;

        const request = this.isEditMode
            ? this.service.updateQuestion(this.questionId!, { ...this.question, id: this.questionId! })
            : this.service.createQuestion(this.question);

        request.subscribe({
            next: () => {
                Swal.fire({
                    title: 'تم الحفظ!',
                    text: 'تم حفظ اللعبة بنجاح',
                    icon: 'success',
                    confirmButtonText: 'حسناً'
                }).then(() => {
                    this.router.navigate(['/admin/dragdrop-questions']);
                });
            },
            error: (err) => {
                console.error(err);
                Swal.fire('خطأ', 'حدث خطأ أثناء الحفظ', 'error');
                this.isSaving = false;
            }
        });
    }

    // Helpers
    getStepIconClass(step: number): string {
        if (step < this.currentStep) return 'bg-indigo-600 text-white';
        if (step === this.currentStep) return 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-600';
        return 'bg-slate-100 text-slate-400';
    }

    toastError(msg: string): void {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
        Toast.fire({ icon: 'error', title: msg });
    }

    getGradeLabel(grade: GradeLevel): string {
        return this.grades.find(g => g.value === grade)?.label || '';
    }

    getSubjectLabel(subject: SubjectType): string {
        return this.subjects.find(s => s.value === subject)?.label || '';
    }

    getThemeName(id: string): string {
        return this.themes.find(t => t.id === id)?.name || id;
    }
}
