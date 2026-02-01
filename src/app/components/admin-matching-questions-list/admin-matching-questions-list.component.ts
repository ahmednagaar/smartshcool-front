import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatchingQuestionService } from '../../services/matching-question.service';
import { MatchingQuestion, DifficultyLevel } from '../../models/models';
import { LucideAngularModule, Plus, Trash2, Edit, FileInput, Search, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';

@Component({
  selector: 'app-admin-matching-questions-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './admin-matching-questions-list.component.html',
  styleUrl: './admin-matching-questions-list.component.css',
  providers: [{ provide: LUCIDE_ICONS, useValue: new LucideIconProvider({ Plus, Trash2, Edit, FileInput, Search }) }]
})
export class AdminMatchingQuestionsListComponent implements OnInit {
  questions: MatchingQuestion[] = [];
  totalCount: number = 0;

  // Filters
  page: number = 1;
  pageSize: number = 10;
  grade?: number;
  subject?: number;
  searchStr: string = '';

  isLoading: boolean = false;

  readonly DifficultyLevel = DifficultyLevel;
  protected readonly Math = Math;

  constructor(
    private matchingService: MatchingQuestionService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadQuestions();
  }

  loadQuestions(): void {
    this.isLoading = true;
    this.matchingService.search(
      this.page,
      this.pageSize,
      this.grade,
      this.subject,
      this.searchStr
    ).subscribe({
      next: (res) => {
        this.questions = res.data || [];
        this.totalCount = res.totalCount;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load questions', err);
        this.isLoading = false;
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
      this.matchingService.delete(id).subscribe({
        next: () => {
          // alert('Deleted successfully');
          this.loadQuestions();
        },
        error: (err) => console.error(err)
      });
    }
  }

  getDifficultyName(level: DifficultyLevel): string {
    switch (level) {
      case DifficultyLevel.Easy: return 'Easy';
      case DifficultyLevel.Medium: return 'Medium';
      case DifficultyLevel.Hard: return 'Hard';
      default: return 'Unknown';
    }
  }
}
