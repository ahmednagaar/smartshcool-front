import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AchievementDto } from '../../models/models';

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-nafes-cream py-12">
      <div class="container mx-auto px-6">
        <!-- Header -->
        <div class="text-center mb-12">
          <h1 class="text-5xl font-bold text-nafes-dark mb-4">🎖️ إنجازاتي</h1>
          <p class="text-xl text-gray-600">تابع تقدمك واجمع الأوسمة</p>
        </div>

        <div *ngIf="loading" class="text-center py-20">
            <div class="text-2xl font-bold text-nafes-gold animate-pulse">جاري تحميل الإنجازات...</div>
        </div>

        <div *ngIf="!loading">
            <!-- Summary Stats -->
            <div class="grid grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
            <div class="bg-white p-6 rounded-xl shadow-lg text-center border-b-4 border-nafes-gold">
                <div class="text-4xl font-bold text-nafes-dark mb-2">{{ totalPoints }}</div>
                <div class="text-gray-600">مجموع نقاط الأوسمة</div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-lg text-center border-b-4 border-green-500">
                <div class="text-4xl font-bold text-nafes-dark mb-2">{{ unlockedCount }}/{{ achievements.length }}</div>
                <div class="text-gray-600">أوسمة مكتسبة</div>
            </div>
            </div>

            <!-- Achievements Grid -->
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div *ngFor="let achievement of achievements" 
                [class.opacity-50]="!achievement.isUnlocked"
                [class.filter-grayscale]="!achievement.isUnlocked"
                class="bg-white p-6 rounded-xl shadow-md transition hover:shadow-lg relative overflow-hidden">
                
                <!-- Unlocked Banner -->
                <div *ngIf="achievement.isUnlocked" class="absolute top-4 left-4 text-green-500 text-2xl">✓</div>

                <div class="flex items-center gap-4 mb-4">
                <div class="text-5xl">{{ achievement.icon }}</div>
                <div>
                    <h3 class="text-xl font-bold text-nafes-dark">{{ achievement.title }}</h3>
                    <p class="text-sm text-gray-500" *ngIf="!achievement.isUnlocked">مغلق</p>
                    <p class="text-sm text-green-600 font-bold" *ngIf="achievement.isUnlocked">
                        مكتمل! 
                        <span class="text-xs text-gray-400 block">{{ achievement.dateUnlocked | date:'shortDate' }}</span>
                    </p>
                </div>
                </div>
                
                <p class="text-gray-600 mb-4 h-12">{{ achievement.description }}</p>
                
                <div class="text-right text-sm font-bold text-nafes-gold">
                Points: {{ achievement.points }}
                </div>
            </div>
            </div>
        </div>

        <!-- Back Button -->
        <div class="text-center">
          <a routerLink="/" class="text-nafes-gold hover:underline text-lg">
            العودة للصفحة الرئيسية
          </a>
        </div>
      </div>
    </div>
  `
})
export class AchievementsComponent implements OnInit {
  achievements: AchievementDto[] = [];
  totalPoints = 0;
  unlockedCount = 0;
  loading = true;

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    // For demo purposes, fetch for a specific student ID (e.g., 1 or find first)
    // Ideally, we'd have a logged-in user service.
    const studentId = 1;

    this.apiService.getStudentAchievements(studentId).subscribe({
      next: (data) => {
        this.achievements = data;
        this.unlockedCount = data.filter(a => a.isUnlocked).length;
        this.totalPoints = data.filter(a => a.isUnlocked).reduce((sum, a) => sum + a.points, 0);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading achievements', err);
        this.loading = false;
      }
    });
  }
}
