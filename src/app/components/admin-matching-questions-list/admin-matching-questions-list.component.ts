import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatchingGameService } from '../../services/matching-game.service';
import { MatchingGameDto, DifficultyLevel } from '../../models/matching-game.model';
import { GradeLevel, SubjectType } from '../../models/models';
import { LucideAngularModule, Plus, Trash2, Edit, FileInput, Search, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';

@Component({
  selector: 'app-admin-matching-questions-list', // Keeping selector same to avoid breakage if used elsewhere, though typically routed.
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './admin-matching-questions-list.component.html',
  styleUrl: './admin-matching-questions-list.component.css',
  providers: [{ provide: LUCIDE_ICONS, useValue: new LucideIconProvider({ Plus, Trash2, Edit, FileInput, Search }) }]
})
export class AdminMatchingQuestionsListComponent implements OnInit {
  games: MatchingGameDto[] = [];
  totalCount: number = 0;

  // Filters
  page: number = 1;
  pageSize: number = 10;
  grade?: GradeLevel;
  subject?: SubjectType;
  searchStr: string = ''; // Not supported by backend search yet? Backend GetGames has Grade/Subject but not SearchQuery?
  // Backend `GetAvailableGamesAsync` has Grade/Subject. NO Search string.
  // I will ignore searchStr for backend call or implement backend search later.
  // For now, I'll remove search param from effective call.

  isLoading: boolean = false;

  readonly DifficultyLevel = DifficultyLevel;
  protected readonly Math = Math;

  constructor(
    private matchingService: MatchingGameService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadGames();
  }

  loadGames(): void {
    this.isLoading = true;
    this.matchingService.getGames(
      this.page,
      this.pageSize,
      this.grade,
      this.subject,
      this.searchStr || undefined // M9: Pass search string to backend
    ).subscribe({
      next: (res) => {
        this.games = res.items || [];
        this.totalCount = res.totalCount;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load games', err);
        this.isLoading = false;
      }
    });
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadGames();
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadGames();
  }

  deleteGame(id: number): void {
    if (confirm('هل أنت متأكد من حذف هذه اللعبة؟')) {
      this.matchingService.deleteGame(id).subscribe({
        next: () => {
          this.loadGames();
        },
        error: (err) => console.error(err)
      });
    }
  }

  getDifficultyName(level: DifficultyLevel): string {
    switch (level) {
      case DifficultyLevel.Easy: return 'سهل';
      case DifficultyLevel.Medium: return 'متوسط';
      case DifficultyLevel.Hard: return 'صعب';
      default: return 'غير معروف';
    }
  }

  getSubjectName(id: SubjectType): string {
    const map: any = { 1: 'عربي', 2: 'رياضيات', 3: 'علوم' };
    return map[id] || 'مادة';
  }
}
