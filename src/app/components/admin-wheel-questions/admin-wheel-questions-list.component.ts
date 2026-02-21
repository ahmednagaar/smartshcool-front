import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { WheelQuestionService } from '../../services/wheel-question.service';
import { WheelQuestion } from '../../models/wheel-game.model';
import { DifficultyLevel, QuestionType } from '../../models/models';
import { LucideAngularModule, Plus, Search, Filter, Edit, Trash2, MoreVertical } from 'lucide-angular';

@Component({
    selector: 'app-admin-wheel-questions-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
    templateUrl: './admin-wheel-questions-list.component.html',
    styleUrls: ['./admin-wheel-questions-list.component.css']
})
export class AdminWheelQuestionsListComponent implements OnInit {
    questions: WheelQuestion[] = [];
    totalCount = 0;
    page = 1;
    pageSize = 10;

    gradeFilter?: number;
    subjectFilter?: number;
    difficultyFilter?: number;
    searchTerm = '';

    loading = false;

    // Delete Dialog
    showDeleteDialog = false;
    deleteTargetId: number | null = null;
    deleting = false;

    // Toast
    toastMessage = '';
    toastType: 'success' | 'error' | 'info' = 'info';
    toastVisible = false;

    // Enums for template
    QuestionType = QuestionType;
    DifficultyLevel = DifficultyLevel;

    constructor(private wheelService: WheelQuestionService) { }

    ngOnInit(): void {
        this.loadQuestions();
    }

    loadQuestions(): void {
        this.loading = true;
        this.wheelService.getQuestions(this.page, this.pageSize, this.gradeFilter, this.subjectFilter, this.searchTerm)
            .subscribe({
                next: (response) => {
                    this.questions = response.data;
                    this.totalCount = response.totalCount;
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Error loading questions', err);
                    this.showToast('فشل تحميل الأسئلة', 'error');
                    this.loading = false;
                }
            });
    }

    onFilterChange(): void {
        this.page = 1;
        this.loadQuestions();
    }

    onPageChange(newPage: number): void {
        this.page = newPage;
        this.loadQuestions();
    }

    // ========== DELETE ==========

    confirmDelete(id: number): void {
        this.deleteTargetId = id;
        this.showDeleteDialog = true;
    }

    cancelDelete(): void {
        this.showDeleteDialog = false;
        this.deleteTargetId = null;
    }

    executeDelete(): void {
        if (!this.deleteTargetId) return;
        this.deleting = true;
        this.wheelService.delete(this.deleteTargetId).subscribe({
            next: () => {
                this.showDeleteDialog = false;
                this.deleteTargetId = null;
                this.deleting = false;
                this.showToast('تم حذف السؤال بنجاح ✅', 'success');
                this.loadQuestions();
            },
            error: () => {
                this.deleting = false;
                this.showToast('فشل حذف السؤال. حاول مرة أخرى', 'error');
            }
        });
    }

    // ========== HELPERS ==========

    getSubjectName(subjectId: number): string {
        switch (subjectId) {
            case 1: return 'اللغة العربية';
            case 2: return 'الرياضيات';
            case 3: return 'العلوم';
            default: return 'غير محدد';
        }
    }

    getGradeName(gradeId: number): string {
        return `الصف ${gradeId === 3 ? 'الثالث' : gradeId === 4 ? 'الرابع' : gradeId === 5 ? 'الخامس' : 'السادس'}`;
    }

    getDifficultyName(level: DifficultyLevel): string {
        switch (level) {
            case DifficultyLevel.Easy: return 'سهل';
            case DifficultyLevel.Medium: return 'متوسط';
            case DifficultyLevel.Hard: return 'صعب';
            default: return 'غير محدد';
        }
    }

    getDifficultyColor(level: DifficultyLevel): string {
        switch (level) {
            case DifficultyLevel.Easy: return 'bg-green-100 text-green-800';
            case DifficultyLevel.Medium: return 'bg-yellow-100 text-yellow-800';
            case DifficultyLevel.Hard: return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    get totalPages(): number {
        return Math.ceil(this.totalCount / this.pageSize);
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
