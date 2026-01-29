import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-100">
      <!-- Navbar -->
      <nav class="bg-white shadow-md">
        <div class="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-nafes-dark">👨‍👩‍👧‍👦 بوابة ولي الأمر</h1>
          <div class="flex items-center gap-4">
            <span class="text-gray-600">مرحباً، {{ parentName }}</span>
            <button (click)="logout()" class="text-red-500 hover:text-red-700 font-bold">تسجيل خروج</button>
          </div>
        </div>
      </nav>

      <div class="container mx-auto px-6 py-8" *ngIf="childData; else loading">
        <!-- Child Profile -->
        <div class="bg-white rounded-2xl shadow-lg p-8 mb-8 border-r-4 border-nafes-gold">
          <div class="flex flex-col md:flex-row justify-between items-center gap-6">
            <div class="flex items-center gap-4">
              <div class="w-20 h-20 bg-nafes-gold rounded-full flex items-center justify-center text-3xl text-white font-bold">
                {{ childData.name.charAt(0) }}
              </div>
              <div>
                <h2 class="text-3xl font-bold text-nafes-dark">{{ childData.name }}</h2>
                <div class="flex gap-2 mt-1">
                  <span class="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600">{{ childData.grade }}</span>
                  <span class="bg-blue-50 px-3 py-1 rounded-full text-sm text-blue-600 font-mono">{{ childData.studentCode }}</span>
                </div>
              </div>
            </div>
            
            <!-- Overall Stats -->
            <div class="flex gap-8 text-center">
              <div>
                <div class="text-3xl font-bold text-nafes-gold">{{ childData.totalTests }}</div>
                <div class="text-gray-500 text-sm">اختبارات مكتملة</div>
              </div>
              <div>
                <div class="text-3xl font-bold text-nafes-gold">%{{ childData.averageScore }}</div>
                <div class="text-gray-500 text-sm">متوسط الدرجات</div>
              </div>
              <div>
                <div class="text-3xl font-bold text-nafes-gold">#{{ childData.leaderboardRank }}</div>
                <div class="text-gray-500 text-sm">الترتيب العام</div>
              </div>
            </div>
          </div>
        </div>

        <!-- NEW: Unified Scores -->
        <div class="grid md:grid-cols-4 gap-6 mb-8">
          <div class="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
            <h3 class="font-bold text-lg mb-2">💎 مجموع النقاط</h3>
            <div class="text-4xl font-bold">{{ childData.totalPoints || 0 }}</div>
            <div class="text-sm opacity-80 mt-1">من جميع الألعاب</div>
          </div>
          
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h3 class="font-bold text-gray-700 mb-2">🎡 عجلة الأسئلة</h3>
            <div class="flex justify-between items-end">
              <div class="text-3xl font-bold text-nafes-gold">{{ childData.wheelGames?.TotalGames || 0 }}</div>
              <div class="text-sm text-gray-500">جولة</div>
            </div>
            <div class="text-xs text-green-600 mt-2 font-bold">
              أفضل نتيجة: {{ childData.wheelGames?.HighScore || 0 }}
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h3 class="font-bold text-gray-700 mb-2">📝 الاختبارات</h3>
            <div class="flex justify-between items-end">
              <div class="text-3xl font-bold text-blue-500">{{ childData.totalTests }}</div>
              <div class="text-sm text-gray-500">اختبار</div>
            </div>
            <div class="text-xs text-blue-600 mt-2 font-bold">
              نسبة النجاح: %{{ childData.averageScore }}
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h3 class="font-bold text-gray-700 mb-2">🏆 الترتيب</h3>
            <div class="flex justify-between items-end">
              <div class="text-3xl font-bold text-yellow-500">#{{ childData.leaderboardRank }}</div>
              <div class="text-sm text-gray-500">على المدرسة</div>
            </div>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-8">
          <!-- Recent Activity -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h3 class="text-xl font-bold text-nafes-dark mb-6 flex items-center gap-2">
              <span>📝</span> آخر الأنشطة
            </h3>
            
            <div class="space-y-4">
              <div *ngFor="let test of childData.recentTests" 
                   class="flex justify-between items-center p-4 rounded-xl border result-row"
                   [ngClass]="test.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                <div>
                  <h4 class="font-bold text-gray-800">{{ test.gameTitle }}</h4>
                  <p class="text-sm text-gray-500">{{ test.dateTaken | date:'shortDate' }}</p>
                </div>
                <div class="text-center">
                  <span class="text-xl font-bold" [ngClass]="test.passed ? 'text-green-600' : 'text-red-600'">
                    {{ test.score }}%
                  </span>
                  <div class="text-xs font-bold" [ngClass]="test.passed ? 'text-green-600' : 'text-red-600'">
                    {{ test.passed ? 'ناجح' : 'حاول مرة أخرى' }}
                  </div>
                </div>
              </div>
              
              <div *ngIf="childData.recentTests.length === 0" class="text-center py-8 text-gray-500">
                لم يكمل الطالب أي اختبارات بعد
              </div>
            </div>
          </div>

          <!-- Achievements -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h3 class="text-xl font-bold text-nafes-dark mb-6 flex items-center gap-2">
              <span>🏆</span> الإنجازات المكتسبة
            </h3>
            
            <div class="grid grid-cols-2 gap-4">
              <div *ngFor="let badge of childData.achievements" 
                   class="bg-gradient-to-br from-yellow-50 to-white border border-yellow-200 p-4 rounded-xl flex items-center gap-3">
                <span class="text-4xl">{{ badge.icon }}</span>
                <div>
                  <h4 class="font-bold text-sm text-nafes-dark">{{ badge.title }}</h4>
                  <p class="text-xs text-gray-500">{{ badge.dateUnlocked | date:'mediumDate' }}</p>
                </div>
              </div>
            </div>

            <div *ngIf="childData.achievements.length === 0" class="text-center py-8 text-gray-500">
              لم يتم الحصول على أي إنجازات بعد (شجع طفلك!)
            </div>
          </div>
        </div>
      </div>

      <ng-template #loading>
        <div class="min-h-screen flex flex-col items-center justify-center">
          <div class="text-6xl mb-4 animate-bounce">📱</div>
          <p class="text-xl text-gray-600">جاري تحميل بيانات طفلك...</p>
        </div>
      </ng-template>
    </div>
  `
})
export class ParentDashboardComponent implements OnInit {
  childData: any = null;
  parentName = '';
  children: any[] = [];
  selectedChildId: number = 0;

  constructor(private api: ApiService, private router: Router) { }

  ngOnInit() {
    this.parentName = sessionStorage.getItem('parentName') || 'ولي الأمر';

    // Get children from session storage (set during login)
    const childrenJson = sessionStorage.getItem('children');
    if (childrenJson) {
      try {
        this.children = JSON.parse(childrenJson);
        if (this.children.length > 0) {
          this.selectedChildId = this.children[0].id;
          this.loadChildData(this.selectedChildId);
        }
      } catch (e) {
        console.error('Failed to parse children from session', e);
      }
    }
  }

  onChildChange(childId: number) {
    this.selectedChildId = childId;
    this.loadChildData(childId);
  }

  loadChildData(studentId: number) {
    this.api.getParentChildProgress(studentId).subscribe({
      next: (data) => {
        this.childData = data;
        // Fetch wheel stats
        this.api.getWheelStats(studentId).subscribe(wheelStats => {
          this.childData.totalPoints = wheelStats.TotalPoints;
          this.childData.wheelGames = wheelStats;
        });
      },
      error: (err) => {
        console.error('Error loading child data', err);
      }
    });
  }

  logout() {
    sessionStorage.clear();
    this.router.navigate(['/']);
  }
}
