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
    searchTerm = '';

    loading = false;

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
                    this.questions = response.data; // Fixed: uses data instead of items
                    this.totalCount = response.totalCount;
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Error loading questions', err);
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

    deleteQuestion(id: number): void {
        if (confirm('Are you sure you want to delete this question?')) {
            this.wheelService.delete(id).subscribe(() => {
                this.loadQuestions();
            });
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
}
