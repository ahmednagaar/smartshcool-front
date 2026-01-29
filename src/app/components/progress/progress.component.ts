import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { StudentStatsDto } from '../../models/models';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-nafes-cream py-12">
      <div class="container mx-auto px-6">
        <!-- Header -->
        <div class="text-center mb-12">
            <h1 class="text-5xl font-bold text-nafes-dark mb-4">📈 سجلي التعليمي</h1>
            <p class="text-xl text-gray-600">تابع تطورك ومستواك في المواد الدراسية</p>
        </div>

        <div *ngIf="loading" class="text-center py-20">
            <div class="text-2xl font-bold text-nafes-gold animate-pulse">جاري تحميل بياناتك...</div>
        </div>

        <div *ngIf="!loading && stats">
            <!-- Overview Cards -->
            <div class="grid grid-cols-4 gap-6 mb-12">
            <div class="bg-white p-6 rounded-xl shadow-lg border-b-4 border-blue-500">
                <div class="text-gray-600 mb-2">إجمالي الاختبارات</div>
                <div class="text-3xl font-bold text-nafes-dark">{{ stats.totalTests }}</div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-lg border-b-4 border-green-500">
                <div class="text-gray-600 mb-2">معدل الدقة</div>
                <div class="text-3xl font-bold text-nafes-dark">{{ stats.averageScore }}%</div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-lg border-b-4 border-yellow-500">
                <div class="text-gray-600 mb-2">وقت المذاكرة</div>
                <div class="text-3xl font-bold text-nafes-dark">{{ stats.totalTimeSpentMinutes }} دقيقة</div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-lg border-b-4 border-purple-500">
                <div class="text-gray-600 mb-2">المستوى الحالي</div>
                <div class="text-3xl font-bold text-nafes-dark">{{ stats.currentLevel }}</div>
            </div>
            </div>

            <div class="grid md:grid-cols-2 gap-8 mb-12">
            <!-- Subject Performance -->
            <div class="card-nafes">
                <h3 class="text-2xl font-bold text-nafes-dark mb-6">الأداء حسب المادة</h3>
                <div class="space-y-6">
                <div *ngFor="let subject of stats.subjectPerformance">
                    <div class="flex justify-between mb-2">
                    <span class="font-bold text-gray-700">{{ subject.subject }}</span>
                    <span class="text-gray-600">{{ subject.score }}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-4">
                    <div class="h-4 rounded-full transition-all duration-1000"
                        [style.width.%]="subject.score"
                        [class.bg-green-500]="subject.score >= 80"
                        [class.bg-yellow-500]="subject.score >= 60 && subject.score < 80"
                        [class.bg-red-500]="subject.score < 60">
                    </div>
                    </div>
                </div>
                <!-- Fallback if no subjects -->
                <div *ngIf="stats.subjectPerformance.length === 0" class="text-center text-gray-500 py-4">
                    لا توجد بيانات كافية بعد
                </div>
                </div>
            </div>

            <!-- Weekly Activity Chart (Simplified) -->
            <div class="card-nafes flex flex-col justify-between">
                <h3 class="text-2xl font-bold text-nafes-dark mb-6">النشاط الأسبوعي</h3>
                <div class="flex items-end justify-between h-64 px-4 pb-4 border-b-2 border-gray-200">
                <div *ngFor="let day of stats.weeklyActivity" class="flex flex-col items-center gap-2 w-1/7">
                    <div class="w-12 bg-nafes-gold rounded-t-lg transition-all duration-500 hover:opacity-80" 
                        [style.height.px]="(day.testsCount * 20) + 5"></div> <!-- Simple scaling -->
                    <span class="text-sm text-gray-600 font-bold rotate-45 md:rotate-0 mt-2">{{ day.day }}</span>
                </div>
                </div>
            </div>
            </div>
        </div>

        <div *ngIf="!loading && !stats" class="text-center py-12">
             <p class="text-xl text-gray-500">لا توجد بيانات للطالب</p>
        </div>

        <!-- Back Button -->
        <div class="text-center mt-12">
          <a routerLink="/" class="text-nafes-gold hover:underline text-lg">
            العودة للصفحة الرئيسية
          </a>
        </div>
      </div>
    </div>
  `
})
export class ProgressComponent implements OnInit {
  stats: StudentStatsDto | null = null;
  loading = true;

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    const studentId = 1; // Testing with student ID 1

    this.apiService.getStudentStats(studentId).subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching stats:', err);
        this.loading = false;
      }
    });
  }
}
