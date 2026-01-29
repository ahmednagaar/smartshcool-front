import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Game } from '../../models/models';

@Component({
  selector: 'app-game-selection',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-nafes-cream py-12">
      <div class="container mx-auto px-6">
        <!-- Header -->
        <div class="text-center mb-12">
          <h1 class="text-5xl font-bold text-nafes-dark mb-4">اختر الاختبار</h1>
          <p class="text-xl text-gray-600" *ngIf="studentName">
            مرحباً <span class="text-nafes-gold font-bold">{{ studentName }}</span>
          </p>
        </div>

        <!-- Loading -->
        <div *ngIf="loading" class="text-center py-20">
          <div class="text-6xl mb-4">⏳</div>
          <p class="text-2xl text-gray-600">جاري تحميل الاختبارات...</p>
        </div>

        <!-- Games Grid -->
        <div *ngIf="!loading && games.length > 0" class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div *ngFor="let game of games" 
               (click)="selectGame(game)"
               class="card-nafes cursor-pointer">
            <div class="text-5xl mb-4 text-center">📝</div>
            <h3 class="text-2xl font-bold text-nafes-dark mb-3 text-center">{{ game.title }}</h3>
            <p class="text-gray-600 mb-4 text-center">{{ game.description }}</p>
            
            <div class="space-y-2 text-sm text-gray-700">
              <div class="flex justify-between">
                <span>⏱️ الوقت:</span>
                <span class="font-semibold">{{ game.timeLimit }} دقيقة</span>
              </div>
              <div class="flex justify-between">
                <span>📊 النجاح:</span>
                <span class="font-semibold">{{ game.passingScore }}%</span>
              </div>
              <div class="flex justify-between">
                <span>❓ الأسئلة:</span>
                <span class="font-semibold">{{ game.questionCount }} سؤال</span>
              </div>
            </div>

            <button class="btn-gold w-full mt-6">
              ابدأ الاختبار
            </button>
          </div>
        </div>

        <!-- No Games -->
        <div *ngIf="!loading && games.length === 0" class="text-center py-20">
          <div class="text-6xl mb-4">📭</div>
          <p class="text-2xl text-gray-600">لا توجد اختبارات متاحة حالياً</p>
        </div>

        <!-- Back Button -->
        <div class="text-center mt-12">
          <button (click)="goBack()" class="text-nafes-gold hover:underline text-lg">
            العودة للتسجيل
          </button>
        </div>
      </div>
    </div>
  `
})
export class GameSelectionComponent implements OnInit {
  games: Game[] = [];
  loading = true;
  studentName = '';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) { }

  ngOnInit() {
    this.studentName = sessionStorage.getItem('currentStudentName') || '';

    // Check if student is registered
    const studentId = sessionStorage.getItem('currentStudentId');
    if (!studentId) {
      this.router.navigate(['/register']);
      return;
    }

    this.loading = true;
    this.apiService.getGames().subscribe({
      next: (data) => {
        this.games = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching games:', error);
        this.loading = false;
      }
    });
  }

  selectGame(game: Game) {
    this.router.navigate(['/test', game.id]);
  }

  goBack() {
    sessionStorage.clear();
    this.router.navigate(['/register']);
  }
}
