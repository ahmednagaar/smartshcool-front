import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LeaderboardEntry } from '../../models/models';

@Component({
    selector: 'app-leaderboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="min-h-screen bg-nafes-cream py-12">
      <div class="container mx-auto px-6">
        <!-- Header -->
        <div class="text-center mb-12">
          <h1 class="text-5xl font-bold text-nafes-dark mb-4">🏆 المتصدرون</h1>
          <p class="text-xl text-gray-600">أفضل الطلاب في منصة نافس لهذا الأسبوع</p>
        </div>

        <!-- Top 3 Podium -->
        <div class="flex justify-center items-end gap-4 mb-16 max-w-3xl mx-auto">
          <!-- 2nd Place -->
          <div *ngIf="entries[1]" class="text-center w-1/3">
            <div class="text-6xl mb-2">🥈</div>
            <div class="bg-white rounded-t-xl p-6 shadow-lg border-t-4 border-gray-400 h-48 flex flex-col justify-end">
              <h3 class="text-xl font-bold text-nafes-dark">{{ entries[1].studentName }}</h3>
              <p class="text-gray-500">{{ entries[1].grade }}</p>
              <div class="mt-2 font-bold text-nafes-gold">{{ entries[1].points }} نقطة</div>
            </div>
          </div>

          <!-- 1st Place -->
          <div *ngIf="entries[0]" class="text-center w-1/3">
            <div class="text-7xl mb-2 relative">
              🥇
              <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 text-2xl">👑</div>
            </div>
            <div class="bg-white rounded-t-xl p-6 shadow-xl border-t-4 border-nafes-gold h-64 flex flex-col justify-end relative overflow-hidden">
              <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 animate-pulse"></div>
              <h3 class="text-2xl font-bold text-nafes-dark">{{ entries[0].studentName }}</h3>
              <p class="text-gray-500">{{ entries[0].grade }}</p>
              <div class="mt-2 font-bold text-nafes-gold text-xl">{{ entries[0].points }} نقطة</div>
            </div>
          </div>

          <!-- 3rd Place -->
          <div *ngIf="entries[2]" class="text-center w-1/3">
            <div class="text-6xl mb-2">🥉</div>
            <div class="bg-white rounded-t-xl p-6 shadow-lg border-t-4 border-orange-400 h-40 flex flex-col justify-end">
              <h3 class="text-xl font-bold text-nafes-dark">{{ entries[2].studentName }}</h3>
              <p class="text-gray-500">{{ entries[2].grade }}</p>
              <div class="mt-2 font-bold text-nafes-gold">{{ entries[2].points }} نقطة</div>
            </div>
          </div>
        </div>

        <!-- List -->
        <div class="card-nafes max-w-4xl mx-auto">
          <div class="overflow-x-auto">
            <table class="w-full text-right">
              <thead>
                <tr class="border-b-2 border-gray-200">
                  <th class="p-4 text-gray-600">الترتيب</th>
                  <th class="p-4 text-gray-600">الطالب</th>
                  <th class="p-4 text-gray-600">الصف</th>
                  <th class="p-4 text-gray-600">الإنجازات</th>
                  <th class="p-4 text-gray-600">النقاط</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let entry of entries.slice(3); let i = index" class="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td class="p-4 font-bold text-nafes-dark">#{{ entry.rank }}</td>
                  <td class="p-4 font-semibold">{{ entry.studentName }}</td>
                  <td class="p-4 text-gray-500">{{ entry.grade }}</td>
                  <td class="p-4">
                    <span *ngFor="let badge of entry.badges" class="mr-1" [title]="badge">{{ badge }}</span>
                  </td>
                  <td class="p-4 text-nafes-gold font-bold">{{ entry.points }}</td>
                </tr>
              </tbody>
            </table>
          </div>
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
export class LeaderboardComponent implements OnInit {
    entries: LeaderboardEntry[] = [];

    ngOnInit() {
        // Mock Data for Phase 1
        this.entries = [
            { rank: 1, studentName: 'أحمد محمد', grade: 'الصف الخامس', points: 1540, badges: ['🚀', '⭐', '🧠'] },
            { rank: 2, studentName: 'سارة خالد', grade: 'الصف الرابع', points: 1420, badges: ['⭐', '📚'] },
            { rank: 3, studentName: 'عمر يوسف', grade: 'الصف السادس', points: 1350, badges: ['⚡'] },
            { rank: 4, studentName: 'فاطمة علي', grade: 'الصف الخامس', points: 1200, badges: ['🎨'] },
            { rank: 5, studentName: 'خالد عبدالله', grade: 'الصف الرابع', points: 1150, badges: [] },
            { rank: 6, studentName: 'نورة سعد', grade: 'الصف السادس', points: 980, badges: ['⭐'] },
            { rank: 7, studentName: 'محمد حسن', grade: 'الصف الخامس', points: 850, badges: [] },
            { rank: 8, studentName: 'ليلى أحمد', grade: 'الصف الرابع', points: 720, badges: [] },
            { rank: 9, studentName: 'عبدالرحمن فهد', grade: 'الصف السادس', points: 690, badges: [] },
            { rank: 10, studentName: 'ريم سلطان', grade: 'الصف الخامس', points: 500, badges: [] },
        ];
    }
}
