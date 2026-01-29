import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-content">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          <div class="card-nafes text-center card-hover-effect">
            <div class="text-5xl mb-4 animate-bounce">👥</div>
            <h3 class="text-4xl font-bold text-nafes-gold mb-2">{{ stats.totalStudents }}</h3>
            <p class="text-gray-600">إجمالي الطلاب</p>
          </div>

          <div class="card-nafes text-center card-hover-effect">
            <div class="text-5xl mb-4 animate-bounce">❓</div>
            <h3 class="text-4xl font-bold text-nafes-gold mb-2">{{ stats.totalQuestions }}</h3>
            <p class="text-gray-600">إجمالي الأسئلة</p>
          </div>

          <div class="card-nafes text-center card-hover-effect">
            <div class="text-5xl mb-4 animate-bounce">📝</div>
            <h3 class="text-4xl font-bold text-nafes-gold mb-2">{{ stats.totalGames }}</h3>
            <p class="text-gray-600">إجمالي الاختبارات</p>
          </div>
        </div>

        <!-- Analytics Section -->
        <div class="grid md:grid-cols-2 gap-6 mb-8">
          <!-- Activity Trends Chart -->
          <div class="card-nafes card-hover-effect">
            <h3 class="text-xl font-bold text-nafes-dark mb-4 border-b pb-2">نشاط الأيام الأخيرة</h3>
            <div class="chart-container">
              <div *ngFor="let day of activityTrends" class="chart-bar-wrapper">
                <div class="chart-bar" [style.height.%]="(day.games / maxGamesPerDay) * 100">
                  <span class="chart-value">{{ day.games }}</span>
                </div>
                <span class="chart-label">{{ day.label }}</span>
              </div>
            </div>
          </div>

          <!-- Difficult Questions Chart -->
          <div class="card-nafes card-hover-effect">
            <h3 class="text-xl font-bold text-nafes-dark mb-4 border-b pb-2">الأسئلة الأكثر صعوبة</h3>
            <div class="space-y-4">
              <div *ngFor="let q of difficultQuestions" class="h-chart-row">
                <div class="h-chart-label">
                  <span>{{ q.text }}</span>
                  <span class="text-red-500 font-bold">{{ q.errorRate }}% خطأ</span>
                </div>
                <div class="h-chart-bar-bg">
                  <div class="h-chart-bar-fill" [style.width.%]="q.errorRate"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Question Distribution Grid -->
        <div class="card-nafes mb-8" *ngIf="questionStats">
          <h3 class="text-xl font-bold text-nafes-dark mb-4 border-b pb-2">📊 توزيع الأسئلة حسب الصف والمادة</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-center">
              <thead class="bg-gray-50">
                <tr>
                  <th class="p-3 border">الصف</th>
                  <th class="p-3 border" *ngFor="let subj of ['لغة عربية', 'رياضيات', 'علوم']">{{ subj }}</th>
                  <th class="p-3 border font-bold">المجموع</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let grade of questionStats.byGrade">
                  <td class="p-3 border font-bold bg-gray-50">الصف {{ grade.grade }}</td>
                  <td *ngFor="let subj of grade.bySubject" 
                      class="p-3 border text-center font-semibold"
                      [ngClass]="{
                        'bg-red-100 text-red-700': subj.count < 5,
                        'bg-yellow-100 text-yellow-700': subj.count >= 5 && subj.count < 15,
                        'bg-green-100 text-green-700': subj.count >= 15
                      }">
                    {{ subj.count }}
                  </td>
                  <td class="p-3 border font-bold bg-nafes-gold text-white">{{ grade.count }}</td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-100">
                <tr>
                  <td class="p-3 border font-bold">الإجمالي</td>
                  <td class="p-3 border font-bold" colspan="3">{{ questionStats.totalCount }} سؤال</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div class="mt-3 flex gap-4 text-xs">
            <span class="flex items-center gap-1"><span class="w-4 h-4 bg-red-100 rounded"></span> أقل من 5</span>
            <span class="flex items-center gap-1"><span class="w-4 h-4 bg-yellow-100 rounded"></span> 5-14</span>
            <span class="flex items-center gap-1"><span class="w-4 h-4 bg-green-100 rounded"></span> 15+</span>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card-nafes mb-8">
          <h2 class="text-3xl font-bold text-nafes-dark mb-6">الإجراءات السريعة</h2>
          <div class="grid grid-cols-3 gap-4">
            <button routerLink="/admin/questions" class="p-6 bg-nafes-gold text-white rounded-xl card-hover-effect btn-hover-effect transition flex flex-col items-center justify-center">
              <div class="text-4xl mb-2">➕</div>
              <div class="font-bold text-xl">إدارة الأسئلة</div>
            </button>

            <button routerLink="/admin/games" class="p-6 bg-nafes-gold text-white rounded-xl card-hover-effect btn-hover-effect transition flex flex-col items-center justify-center">
              <div class="text-4xl mb-2">🎮</div>
              <div class="font-bold text-xl">إدارة الاختبارات</div>
            </button>

            <button routerLink="/admin/dashboard" class="p-6 bg-nafes-gold text-white rounded-xl card-hover-effect btn-hover-effect transition flex flex-col items-center justify-center">
              <div class="text-4xl mb-2">📊</div>
              <div class="font-bold text-xl">تحديث البيانات</div>
            </button>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="card-nafes mt-8">
          <h2 class="text-3xl font-bold text-nafes-dark mb-6">النشاط الأخير</h2>
          <div class="grid md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div class="p-4 bg-gray-100 rounded-lg card-hover-effect">
                <p class="font-semibold text-lg">📝 الاختبارات التقليدية</p>
                <div class="flex justify-between mt-2 text-gray-700">
                  <span>مكتملة: {{ stats.totalTests }}</span>
                  <span>المتوسط: {{ stats.averageTestScore || 0 }}%</span>
                </div>
              </div>
              
              <div class="p-4 bg-gray-100 rounded-lg card-hover-effect">
                <p class="font-semibold text-lg">🎡 عجلة الأسئلة</p>
                <div class="flex justify-between mt-2 text-gray-700">
                  <span>الجولات: {{ stats.totalWheelGames || 0 }}</span>
                  <span>أعلى نتيجة: {{ stats.maxWheelScore || 0 }}</span>
                </div>
              </div>
            </div>

            <!-- Leaderboard -->
            <div class="bg-white border rounded-xl overflow-hidden shadow-lg">
              <h3 class="bg-nafes-gold text-white p-4 font-bold">💎 المتصدرون (النقاط الموحدة)</h3>
              <table class="w-full text-right">
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="p-3">#</th>
                    <th class="p-3">الطالب</th>
                    <th class="p-3">النقاط</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let entry of leaderboard; let i = index" class="border-b hover:bg-gray-50 transition">
                    <td class="p-3 font-bold text-nafes-gold">{{ i + 1 }}</td>
                    <td class="p-3 font-semibold">{{ entry.studentName }}</td>
                    <td class="p-3 font-bold">{{ entry.totalPoints }}</td>
                  </tr>
                  <tr *ngIf="leaderboard.length === 0">
                    <td colspan="3" class="p-4 text-center text-gray-500">لا توجد بيانات</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
  `

})
export class AdminDashboardComponent implements OnInit {
  adminUsername = '';
  stats = {
    totalStudents: 0,
    totalQuestions: 0,
    totalGames: 0,
    totalTests: 0,
    averageTestScore: 0,
    totalWheelGames: 0,
    maxWheelScore: 0
  };
  leaderboard: any[] = [];

  // Analytics Data
  activityTrends: any[] = [];
  difficultQuestions: any[] = [];
  maxGamesPerDay = 100; // Scale for chart

  // Question Stats
  questionStats: any = null;

  constructor(
    private router: Router,
    private api: ApiService
  ) { }

  ngOnInit() {
    this.adminUsername = localStorage.getItem('adminUsername') || 'المشرف';
    this.loadStats();
    this.loadLeaderboard();
    this.loadAnalytics();
    this.loadQuestionStats();
  }

  loadStats() {
    this.api.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = { ...this.stats, ...data };
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        if (error.status === 401) {
          this.logout();
        }
      }
    });
  }

  loadLeaderboard() {
    this.api.getWheelLeaderboard().subscribe({
      next: (data) => {
        this.leaderboard = data;
        if (data.length > 0) {
          this.stats.maxWheelScore = Math.max(...data.map(d => d.highScore));
          this.stats.totalWheelGames = data.reduce((acc, curr) => acc + curr.totalGames, 0);
        }
      }
    });
  }

  loadQuestionStats() {
    this.api.getQuestionStats().subscribe({
      next: (data) => {
        this.questionStats = data;
      },
      error: (err) => console.error('Error loading question stats:', err)
    });
  }

  loadAnalytics() {
    // 1. Activity Trends
    // Default to last 7 days
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    this.api.getAnalyticsActivityTrends(startDate, endDate).subscribe(data => {
      // Map API response ({ labels: [], datasets: [] }) to component format ({ label, games })
      // Assuming dataset[0] is 'Games Played'
      if (data.labels && data.datasets && data.datasets.length > 0) {
        const gamesData = data.datasets.find((d: any) => d.label === 'Games Played')?.data || [];

        this.activityTrends = data.labels.map((label: string, index: number) => ({
          label: label,
          games: gamesData[index] || 0
        }));

        this.maxGamesPerDay = Math.max(...this.activityTrends.map(d => d.games)) * 1.2 || 10;
      }
    });

    // 2. Difficult Questions
    // Fetch top 5 hardest questions (grade 0, subject 0 for all)
    this.api.getAnalyticsDifficultQuestions(0, 0, 5).subscribe(data => {
      this.difficultQuestions = data;
    });

    // 3. Engagement Summary (Optional Integration)
    this.api.getAnalyticsEngagementSummary().subscribe(summary => {
      // Can add logic here to display engagement stats if UI elements exist
      console.log('Engagement Summary:', summary);
    });
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('adminUsername');
    this.router.navigate(['/admin/login']);
  }
}
