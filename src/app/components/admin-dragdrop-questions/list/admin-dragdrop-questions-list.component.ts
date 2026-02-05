import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, PlusCircle, Search, Edit3, Trash2, Layers, Puzzle, MoreVertical, ClipboardList, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import { DragDropQuestionService } from '../../../services/drag-drop-question.service';
import { DragDropQuestionDto, GradeLevel, SubjectType, PaginationParams } from '../../../models/drag-drop.model';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-admin-dragdrop-questions-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        LucideAngularModule
    ],
    providers: [{ provide: LUCIDE_ICONS, useValue: new LucideIconProvider({ PlusCircle, Search, Edit3, Trash2, Layers, Puzzle, MoreVertical, ClipboardList }) }],
    templateUrl: './admin-dragdrop-questions-list.component.html',
    styles: []
})
export class AdminDragDropQuestionsListComponent implements OnInit {
    questions: DragDropQuestionDto[] = [];
    isLoading = false;

    // Filters
    searchTerm = '';
    selectedGrade: GradeLevel | null = null;
    selectedSubject: SubjectType | null = null;

    // Pagination
    pageNumber = 1;
    pageSize = 12;
    totalCount = 0;
    totalPages = 0;

    // Enums for UI
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

    constructor(private service: DragDropQuestionService) { }

    ngOnInit(): void {
        this.loadQuestions();
    }

    loadQuestions(): void {
        this.isLoading = true;
        const params: PaginationParams = {
            pageNumber: this.pageNumber,
            pageSize: this.pageSize,
            searchTerm: this.searchTerm
        };

        this.service.getQuestions(params, this.selectedGrade || undefined, this.selectedSubject || undefined)
            .subscribe({
                next: (result) => {
                    this.questions = result.items;
                    this.totalCount = result.totalCount;
                    this.totalPages = result.totalPages;
                    this.isLoading = false;
                },
                error: (err) => {
                    console.error('Error loading questions', err);
                    this.isLoading = false;
                }
            });
    }

    onFilterChange(): void {
        this.pageNumber = 1;
        this.loadQuestions();
    }

    onSearch(): void {
        this.pageNumber = 1;
        this.loadQuestions();
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.selectedGrade = null;
        this.selectedSubject = null;
        this.pageNumber = 1;
        this.loadQuestions();
    }

    changePage(newPage: number): void {
        if (newPage >= 1 && newPage <= this.totalPages) {
            this.pageNumber = newPage;
            this.loadQuestions();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    deleteQuestion(question: DragDropQuestionDto): void {
        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: `سيتم حذف لعبة "${question.gameTitle}" نهائياً.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'نعم، احذفها',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                this.service.deleteQuestion(question.id).subscribe({
                    next: (result: void) => {
                        Swal.fire('تم الحذف!', 'تم حذف اللعبة بنجاح.', 'success');
                        this.loadQuestions();
                    },
                    error: () => {
                        Swal.fire('خطأ', 'حدث خطأ أثناء الحذف.', 'error');
                    }
                });
            }
        });
    }

    // Helpers
    getGradeLabel(grade: GradeLevel): string {
        return this.grades.find(g => g.value === grade)?.label || 'غير محدد';
    }

    getSubjectLabel(subject: SubjectType): string {
        return this.subjects.find(s => s.value === subject)?.label || 'غير محدد';
    }

    getSubjectColorClass(subject: SubjectType): string {
        switch (subject) {
            case SubjectType.Arabic: return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
            case SubjectType.Math: return 'bg-blue-100 text-blue-700 border border-blue-200';
            case SubjectType.Science: return 'bg-amber-100 text-amber-700 border border-amber-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    }

    getThemeColorClass(themeId: string): string {
        switch (themeId?.toLowerCase()) {
            case 'nature': return 'bg-green-500 text-white';
            case 'ocean': return 'bg-sky-500 text-white';
            case 'sunset': return 'bg-orange-500 text-white';
            case 'modern': return 'bg-blue-600 text-white';
            default: return 'bg-slate-500 text-white';
        }
    }
}
