import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FlipCardQuestionService } from '../../../services/flip-card-question.service';
import { FlipCardQuestionDto, FlipCardGameMode } from '../../../models/flip-card.model';
import { GradeLevel, SubjectType } from '../../../models/drag-drop.model';
import { LucideAngularModule, Plus, Edit, Trash2, Search, Filter, Copy } from 'lucide-angular';

@Component({
    selector: 'app-admin-flipcard-questions-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
    templateUrl: './admin-flipcard-questions-list.component.html',
    styleUrls: ['./admin-flipcard-questions-list.component.css']
})
export class AdminFlipCardQuestionsListComponent implements OnInit {
    questions: FlipCardQuestionDto[] = [];
    filteredQuestions: FlipCardQuestionDto[] = [];
    loading = false;

    // Filter states
    selectedGrade: number | null = null;
    selectedSubject: number | null = null;
    searchTerm: string = '';

    // Inline delete confirmation
    deleteConfirmId: number | null = null;

    // Toast
    toastMessage = '';
    toastType: 'success' | 'error' | 'info' = 'info';
    toastVisible = false;
    private toastTimeout: any;

    // Enums
    GradeLevel = GradeLevel;
    SubjectType = SubjectType;
    FlipCardGameMode = FlipCardGameMode;

    constructor(private questionService: FlipCardQuestionService) { }

    ngOnInit(): void {
        this.loadQuestions();
    }

    // ========== TOAST ==========
    showToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000): void {
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastMessage = message;
        this.toastType = type;
        this.toastVisible = true;
        this.toastTimeout = setTimeout(() => { this.toastVisible = false; }, duration);
    }

    // ========== DATA LOADING ==========
    loadQuestions(): void {
        if (!this.selectedGrade || !this.selectedSubject) {
            this.loadPaginated();
            return;
        }

        this.loading = true;
        this.questionService.getQuestions(this.selectedGrade, this.selectedSubject)
            .subscribe({
                next: (data) => {
                    this.questions = data;
                    this.filterQuestions();
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Failed to load questions', err);
                    this.loading = false;
                    this.showToast('فشل تحميل الألعاب', 'error');
                }
            });
    }

    loadPaginated(): void {
        this.loading = true;
        this.questionService.getAllPaginated({ pageNumber: 1, pageSize: 50, searchTerm: this.searchTerm })
            .subscribe({
                next: (data) => {
                    this.questions = data.items;
                    this.filteredQuestions = data.items;
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Failed to load questions', err);
                    this.loading = false;
                    this.showToast('فشل تحميل الألعاب', 'error');
                }
            });
    }

    filterQuestions(): void {
        if (!this.searchTerm) {
            this.filteredQuestions = this.questions;
            return;
        }
        const lowerTerm = this.searchTerm.toLowerCase();
        this.filteredQuestions = this.questions.filter(q =>
            q.gameTitle.toLowerCase().includes(lowerTerm)
        );
    }

    onFilterChange(): void {
        this.loadQuestions();
    }

    onSearch(): void {
        if (this.selectedGrade && this.selectedSubject) {
            this.filterQuestions();
        } else {
            this.loadPaginated();
        }
    }

    // ========== ACTIONS ==========
    confirmDelete(id: number): void {
        this.deleteConfirmId = id;
    }

    cancelDelete(): void {
        this.deleteConfirmId = null;
    }

    deleteQuestion(id: number): void {
        this.questionService.delete(id).subscribe({
            next: () => {
                this.questions = this.questions.filter(q => q.id !== id);
                this.filterQuestions();
                this.deleteConfirmId = null;
                this.showToast('تم حذف اللعبة بنجاح', 'success');
            },
            error: () => {
                this.deleteConfirmId = null;
                this.showToast('فشل حذف اللعبة', 'error');
            }
        });
    }

    duplicateQuestion(q: FlipCardQuestionDto): void {
        this.loading = true;
        const createDto: any = {
            gameTitle: 'نسخة من: ' + q.gameTitle,
            instructions: q.instructions,
            gradeId: q.gradeId,
            subjectId: q.subjectId,
            gameMode: q.gameMode,
            difficultyLevel: q.difficultyLevel,
            isActive: false,
            category: q.category,
            timerMode: q.timerMode,
            timeLimitSeconds: q.timeLimitSeconds,
            showHints: q.showHints,
            maxHints: q.maxHints,
            uiTheme: q.uiTheme,
            cardBackDesign: q.cardBackDesign,
            pointsPerMatch: q.pointsPerMatch,
            movePenalty: q.movePenalty,
            enableAudio: q.enableAudio,
            enableExplanations: q.enableExplanations,
            numberOfPairs: q.numberOfPairs,
            displayOrder: 0,
            pairs: q.pairs.map(p => ({
                card1Type: p.card1Type,
                card1Text: p.card1Text,
                card1ImageUrl: p.card1ImageUrl,
                card1AudioUrl: p.card1AudioUrl,
                card2Type: p.card2Type,
                card2Text: p.card2Text,
                card2ImageUrl: p.card2ImageUrl,
                card2AudioUrl: p.card2AudioUrl
            }))
        };

        this.questionService.create(createDto).subscribe({
            next: () => {
                this.showToast('تم نسخ اللعبة بنجاح! ستظهر كمسودة', 'success');
                this.loadQuestions();
            },
            error: () => {
                this.loading = false;
                this.showToast('فشل نسخ اللعبة', 'error');
            }
        });
    }

    toggleActive(q: FlipCardQuestionDto): void {
        const updated: any = {
            ...q,
            isActive: !q.isActive
        };

        this.questionService.update(q.id, updated).subscribe({
            next: () => {
                q.isActive = !q.isActive;
                this.showToast(q.isActive ? 'تم تفعيل اللعبة' : 'تم إيقاف اللعبة', 'success', 2000);
            },
            error: () => {
                this.showToast('فشل تحديث الحالة', 'error');
            }
        });
    }

    // ========== HELPERS ==========
    getGradeName(gradeId: number): string {
        const map: { [key: number]: string } = { 3: 'الصف الثالث', 4: 'الصف الرابع', 5: 'الصف الخامس', 6: 'الصف السادس' };
        return map[gradeId] || 'غير معروف';
    }

    getSubjectName(subjectId: number): string {
        const map: { [key: number]: string } = { 1: 'عربي', 2: 'رياضيات', 3: 'علوم' };
        return map[subjectId] || 'غير معروف';
    }

    getModeName(mode: FlipCardGameMode): string {
        return mode === FlipCardGameMode.Classic ? '🧠 ذاكرة' : '🔗 مطابقة';
    }

    getDifficultyBadge(level?: number): string {
        if (!level || level === 1) return '⭐ سهل';
        if (level === 2) return '⭐⭐ متوسط';
        return '⭐⭐⭐ صعب';
    }

    getDifficultyColor(level?: number): string {
        if (!level || level === 1) return '#059669';
        if (level === 2) return '#d97706';
        return '#dc2626';
    }
}
