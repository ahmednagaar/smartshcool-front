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

      <!-- Visitor Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="card-nafes text-center card-hover-effect" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
          <div class="text-5xl mb-4">👤</div>
          <h3 class="text-4xl font-bold mb-2" style="color: white;">{{ visitorStats.withName }}</h3>
          <p style="color: rgba(255,255,255,0.85);">دخلوا بأسمائهم</p>
        </div>

        <div class="card-nafes text-center card-hover-effect" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white;">
          <div class="text-5xl mb-4">👻</div>
          <h3 class="text-4xl font-bold mb-2" style="color: white;">{{ visitorStats.withoutName }}</h3>
          <p style="color: rgba(255,255,255,0.85);">دخلوا بدون اسم</p>
        </div>

        <div class="card-nafes text-center card-hover-effect" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;">
          <div class="text-5xl mb-4">📊</div>
          <h3 class="text-4xl font-bold mb-2" style="color: white;">{{ visitorStats.total }}</h3>
          <p style="color: rgba(255,255,255,0.85);">إجمالي الزوار</p>
        </div>
      </div>

      <!-- Recent Visitors Section -->
      <div class="card-nafes mb-8 card-hover-effect">
        <div class="flex justify-between items-center mb-4 border-b pb-3">
          <h3 class="text-xl font-bold text-nafes-dark">🧑‍🎓 الطلاب الذين دخلوا الموقع</h3>
          <a routerLink="/admin/visitors" class="text-sm font-medium px-4 py-2 rounded-lg transition-all"
             style="background: #f0fdf4; color: #16a34a; cursor: pointer;"
             onmouseover="this.style.background='#dcfce7'"
             onmouseout="this.style.background='#f0fdf4'">
            عرض الكل ←
          </a>
        </div>

        <div *ngIf="recentVisitors.length === 0" class="text-center py-8">
          <div class="text-6xl mb-4">📭</div>
          <p class="text-gray-500 text-lg">لا يوجد زوار بعد</p>
          <p class="text-gray-400 text-sm mt-1">سيظهر هنا أسماء الطلاب عند دخولهم الموقع</p>
        </div>

        <div *ngIf="recentVisitors.length > 0" class="overflow-x-auto">
          <table class="w-full text-right">
            <thead class="bg-gray-50 border-b-2" style="border-color: #e5e7eb;">
              <tr>
                <th class="p-3 font-bold text-gray-700">#</th>
                <th class="p-3 font-bold text-gray-700">اسم الطالب</th>
                <th class="p-3 font-bold text-gray-700">الجهاز</th>
                <th class="p-3 font-bold text-gray-700">وقت الزيارة</th>
                <th class="p-3 font-bold text-gray-700">عدد الزيارات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let visitor of recentVisitors; let i = index"
                  class="border-b hover:bg-gray-50 transition-colors duration-200"
                  [style.animation]="'fadeInUp 0.3s ease forwards ' + (i * 0.05) + 's'">
                <td class="p-3 font-bold" style="color: #d97706;">{{ i + 1 }}</td>
                <td class="p-3">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
                          style="background: linear-gradient(135deg, #dbeafe, #bfdbfe); color: #1d4ed8;">
                      {{ visitor.name.charAt(0) }}
                    </span>
                    <span class="font-semibold text-gray-800">{{ visitor.name }}</span>
                  </div>
                </td>
                <td class="p-3">
                  <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                        [style.background]="visitor.deviceType === 'Mobile' ? '#fef3c7' : visitor.deviceType === 'Tablet' ? '#e0e7ff' : '#d1fae5'"
                        [style.color]="visitor.deviceType === 'Mobile' ? '#92400e' : visitor.deviceType === 'Tablet' ? '#3730a3' : '#065f46'">
                    {{ visitor.deviceType === 'Mobile' ? '📱' : visitor.deviceType === 'Tablet' ? '📋' : '💻' }}
                    {{ visitor.deviceType === 'Mobile' ? 'جوال' : visitor.deviceType === 'Tablet' ? 'تابلت' : 'حاسوب' }}
                  </span>
                </td>
                <td class="p-3 text-gray-600 text-sm">{{ getTimeAgo(visitor.visitedAt) }}</td>
                <td class="p-3">
                  <span class="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full text-xs font-bold"
                        style="background: #fef3c7; color: #92400e;">
                    {{ visitor.totalVisits }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

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

            <button routerLink="/admin/visitors" class="p-6 rounded-xl card-hover-effect btn-hover-effect transition flex flex-col items-center justify-center"
                    style="background: linear-gradient(135deg, #10b981, #059669); color: white;">
              <div class="text-4xl mb-2">🧑‍🎓</div>
              <div class="font-bold text-xl">إدارة الزوار</div>
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

  // Visitor Data
  recentVisitors: any[] = [];
  visitorStats = { withName: 0, withoutName: 0, total: 0 };

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
    this.loadVisitorData();
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

  loadVisitorData() {
    // Load recent named visitors
    this.api.getRecentVisitors(10).subscribe({
      next: (data) => {
        this.recentVisitors = data;
      },
      error: (err) => console.error('Error loading visitors:', err)
    });

    // Load visitor stats (with name / without name / total)
    this.api.getVisitorStats().subscribe({
      next: (data) => {
        this.visitorStats = data;
      },
      error: (err) => console.error('Error loading visitor stats:', err)
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

  getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return 'الآن';
    if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-SA');
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('adminUsername');
    this.router.navigate(['/admin/login']);
  }
}
