import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-visitors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="visitors-page">
      
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-nafes-dark">🧑‍🎓 إدارة الزوار</h1>
          <p class="text-gray-500 mt-1">جميع الطلاب الذين دخلوا الموقع بأسمائهم</p>
        </div>
        <div class="flex gap-3">
          <button (click)="loadVisitors()" 
                  class="px-4 py-2 rounded-lg font-medium transition-all"
                  style="background: #f0fdf4; color: #16a34a;"
                  onmouseover="this.style.background='#dcfce7'"
                  onmouseout="this.style.background='#f0fdf4'">
            🔄 تحديث
          </button>
        </div>
      </div>

      <!-- Stats Summary -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="card-nafes text-center p-4" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border-radius: 1rem;">
          <div class="text-3xl font-bold" style="color: white;">{{ visitorStats.withName }}</div>
          <div class="text-sm mt-1" style="color: rgba(255,255,255,0.85);">👤 بأسمائهم</div>
        </div>
        <div class="card-nafes text-center p-4" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; border-radius: 1rem;">
          <div class="text-3xl font-bold" style="color: white;">{{ visitorStats.withoutName }}</div>
          <div class="text-sm mt-1" style="color: rgba(255,255,255,0.85);">👻 بدون اسم</div>
        </div>
        <div class="card-nafes text-center p-4" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; border-radius: 1rem;">
          <div class="text-3xl font-bold" style="color: white;">{{ visitorStats.total }}</div>
          <div class="text-sm mt-1" style="color: rgba(255,255,255,0.85);">📊 الإجمالي</div>
        </div>
      </div>

      <!-- Search -->
      <div class="card-nafes mb-6" style="border-radius: 1rem;">
        <div class="relative">
          <input type="text" [(ngModel)]="searchTerm" (input)="filterVisitors()"
                 placeholder="🔍 ابحث باسم الطالب..."
                 class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-right transition-colors"
                 style="font-size: 1rem;" />
        </div>
      </div>

      <!-- Visitors Table -->
      <div class="card-nafes" style="border-radius: 1rem; overflow: hidden;">
        
        <div *ngIf="filteredVisitors.length === 0" class="text-center py-12">
          <div class="text-6xl mb-4">📭</div>
          <p class="text-gray-500 text-lg">{{ searchTerm ? 'لا توجد نتائج للبحث' : 'لا يوجد زوار بعد' }}</p>
          <p class="text-gray-400 text-sm mt-1">سيظهر هنا أسماء الطلاب عند دخولهم الموقع</p>
        </div>

        <div *ngIf="filteredVisitors.length > 0" class="overflow-x-auto">
          <table class="w-full text-right">
            <thead style="background: linear-gradient(135deg, #f8fafc, #f1f5f9);">
              <tr>
                <th class="p-4 font-bold text-gray-700 border-b-2" style="border-color: #e2e8f0;">#</th>
                <th class="p-4 font-bold text-gray-700 border-b-2" style="border-color: #e2e8f0;">اسم الطالب</th>
                <th class="p-4 font-bold text-gray-700 border-b-2" style="border-color: #e2e8f0;">الجهاز</th>
                <th class="p-4 font-bold text-gray-700 border-b-2" style="border-color: #e2e8f0;">آخر زيارة</th>
                <th class="p-4 font-bold text-gray-700 border-b-2" style="border-color: #e2e8f0;">عدد الزيارات</th>
                <th class="p-4 font-bold text-gray-700 border-b-2" style="border-color: #e2e8f0;">معرّف الزائر</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let visitor of filteredVisitors; let i = index"
                  class="border-b transition-all duration-200 hover:bg-emerald-50"
                  style="border-color: #f1f5f9;">
                <td class="p-4 font-bold" style="color: #d97706;">{{ i + 1 }}</td>
                <td class="p-4">
                  <div class="flex items-center gap-3">
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full text-base font-bold shadow-sm"
                          style="background: linear-gradient(135deg, #dbeafe, #bfdbfe); color: #1d4ed8;">
                      {{ visitor.name.charAt(0) }}
                    </span>
                    <div>
                      <span class="font-bold text-gray-800 text-base">{{ visitor.name }}</span>
                    </div>
                  </div>
                </td>
                <td class="p-4">
                  <span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium"
                        [style.background]="visitor.deviceType === 'Mobile' ? '#fef3c7' : visitor.deviceType === 'Tablet' ? '#e0e7ff' : '#d1fae5'"
                        [style.color]="visitor.deviceType === 'Mobile' ? '#92400e' : visitor.deviceType === 'Tablet' ? '#3730a3' : '#065f46'">
                    {{ visitor.deviceType === 'Mobile' ? '📱 جوال' : visitor.deviceType === 'Tablet' ? '📋 تابلت' : '💻 حاسوب' }}
                  </span>
                </td>
                <td class="p-4 text-gray-600">
                  <div class="text-sm">{{ getTimeAgo(visitor.visitedAt) }}</div>
                  <div class="text-xs text-gray-400 mt-0.5">{{ formatDate(visitor.visitedAt) }}</div>
                </td>
                <td class="p-4">
                  <span class="inline-flex items-center justify-center min-w-[2.5rem] px-3 py-1.5 rounded-full text-sm font-bold"
                        style="background: linear-gradient(135deg, #fef3c7, #fde68a); color: #92400e;">
                    {{ visitor.totalVisits }}
                  </span>
                </td>
                <td class="p-4">
                  <span class="text-xs font-mono text-gray-400 px-2 py-1 rounded" style="background: #f8fafc;">
                    {{ visitor.visitorId | slice:0:8 }}...
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div *ngIf="filteredVisitors.length > 0" class="p-4 text-center text-sm text-gray-400 border-t" style="background: #fafafa;">
          عرض {{ filteredVisitors.length }} من {{ allVisitors.length }} زائر
        </div>
      </div>
    </div>
  `,
  styles: [`
    .visitors-page {
      padding: 1rem;
    }
  `]
})
export class AdminVisitorsComponent implements OnInit {
  allVisitors: any[] = [];
  filteredVisitors: any[] = [];
  searchTerm = '';
  visitorStats = { withName: 0, withoutName: 0, total: 0 };

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadVisitors();
    this.loadStats();
  }

  loadVisitors() {
    this.api.getRecentVisitors(100).subscribe({
      next: (data) => {
        this.allVisitors = data;
        this.filterVisitors();
      },
      error: (err) => console.error('Error loading visitors:', err)
    });
  }

  loadStats() {
    this.api.getVisitorStats().subscribe({
      next: (data) => {
        this.visitorStats = data;
      },
      error: (err) => console.error('Error loading visitor stats:', err)
    });
  }

  filterVisitors() {
    if (!this.searchTerm.trim()) {
      this.filteredVisitors = [...this.allVisitors];
    } else {
      const term = this.searchTerm.trim().toLowerCase();
      this.filteredVisitors = this.allVisitors.filter(v =>
        v.name.toLowerCase().includes(term)
      );
    }
  }

  getTimeAgo(dateStr: string): string {
    const utcStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
    const date = new Date(utcStr);
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
    if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسبوع`;
    return date.toLocaleDateString('ar-SA');
  }

  formatDate(dateStr: string): string {
    const utcStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
    const date = new Date(utcStr);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
