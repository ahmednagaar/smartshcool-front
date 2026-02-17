import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FlipCardQuestionService } from '../../../services/flip-card-question.service';
import { FlipCardQuestionDto } from '../../../models/flip-card.model';
import { GradeLevel, SubjectType } from '../../../models/drag-drop.model';
import { LucideAngularModule, Plus, Edit, Trash2, Search, Filter } from 'lucide-angular';

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

    // Enums for template
    GradeLevel = GradeLevel;
    SubjectType = SubjectType;

    constructor(private questionService: FlipCardQuestionService) { }

    ngOnInit(): void {
        this.loadQuestions();
    }

    loadQuestions(): void {
        if (!this.selectedGrade || !this.selectedSubject) {
            // Just load all or prompt user?
            // Admin usually wants to see everything or filter.
            // If API requires grade/subject, we must default or allow optional params.
            // My Service 'getQuestions' *requires* gradeId, subjectId.
            // Ideally, I should update service to allow optional if backend supports it.
            // Backend 'GetByGradeAndSubject' implies required.
            // Let's force selection or default to Grade 3 / Arabic for now to show something, 
            // OR implement 'GetAllPaginated' usage if available.
            // Backend Controller: GetByGradeAndSubject(int gradeId, int subjectId)
            // Backend Controller: GetAllPaginated(int page, int pageSize)
            // I implemented 'getAllPaginated' in service. Let's use that for the main list!

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
                }
            });
    }

    loadPaginated(): void {
        this.loading = true;
        this.questionService.getAllPaginated({ pageNumber: 1, pageSize: 50, searchTerm: this.searchTerm })
            .subscribe({
                next: (data) => {
                    this.questions = data.items;
                    this.filteredQuestions = data.items; // Search applied by backend if passed
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Failed to load questions', err);
                    this.loading = false;
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
        // If grade/subject selected, use getQuestions, else paginated?
        // For simplicity, let's just trigger loadQuestions which decides.
        this.loadQuestions();
    }

    onSearch(): void {
        if (this.selectedGrade && this.selectedSubject) {
            this.filterQuestions(); // Local filter
        } else {
            this.loadPaginated(); // Backend search
        }
    }

    deleteQuestion(id: number): void {
        if (confirm('هل أنت متأكد من حذف هذه اللعبة؟')) {
            this.questionService.delete(id).subscribe(() => {
                this.questions = this.questions.filter(q => q.id !== id);
                this.filterQuestions();
            });
        }
    }

    getGradeName(gradeId: number): string {
        const map: { [key: number]: string } = { 3: 'الصف الثالث', 4: 'الصف الرابع', 5: 'الصف الخامس', 6: 'الصف السادس' };
        return map[gradeId] || 'غير معروف';
    }

    getSubjectName(subjectId: number): string {
        const map: { [key: number]: string } = { 1: 'عربي', 2: 'رياضيات', 3: 'علوم' };
        return map[subjectId] || 'غير معروف';
    }
}
