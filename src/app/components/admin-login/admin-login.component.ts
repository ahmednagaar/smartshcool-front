import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-dark flex items-center">
      <div class="container">
        <div class="max-w-md mx-auto">
          <!-- Logo -->
          <div class="text-center mb-8">
            <h1 class="text-5xl font-bold text-nafes-gold mb-2">نافس</h1>
            <p class="text-gray-400">لوحة تحكم المشرف</p>
          </div>

          <!-- Login Card -->
          <div class="card-nafes">
            <h2 class="text-3xl font-bold text-nafes-dark mb-6 text-center">تسجيل الدخول</h2>

            <form (ngSubmit)="login()" #loginForm="ngForm">
              <!-- Username -->
              <div class="mb-6">
                <label class="block text-nafes-dark font-semibold mb-2">اسم المستخدم</label>
                <input
                  type="text"
                  [(ngModel)]="credentials.username"
                  name="username"
                  required
                  class="input-nafes"
                  placeholder="admin"
                />
              </div>

              <!-- Password -->
              <div class="mb-6">
                <label class="block text-nafes-dark font-semibold mb-2">كلمة المرور</label>
                <input
                  type="password"
                  [(ngModel)]="credentials.password"
                  name="password"
                  required
                  class="input-nafes"
                  placeholder="••••••••"
                />
              </div>

              <!-- Error Message -->
              <div *ngIf="errorMessage" class="mb-6 p-4 bg-red-100 border-2 border-red-500 rounded-lg">
                <p class="text-red-700 text-center">{{ errorMessage }}</p>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                [disabled]="!loginForm.form.valid || loading"
                class="btn-gold w-full"
              >
                <span *ngIf="!loading">تسجيل الدخول</span>
                <span *ngIf="loading">جاري تسجيل الدخول...</span>
              </button>
            </form>

            <div class="text-center mt-6">
              <p class="text-gray-600 mb-2">ليس لديك حساب؟</p>
              <a routerLink="/admin/register" class="text-nafes-gold hover-underline font-bold">إنشاء حساب مشرف جديد</a>
            </div>

            <!-- Back to Home -->
            <div class="text-center mt-6">
              <a href="/" class="text-nafes-gold hover-underline">العودة للصفحة الرئيسية</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminLoginComponent {
  credentials = {
    username: '',
    password: ''
  };

  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private http: HttpClient
  ) { }

  login() {
    this.loading = true;
    this.errorMessage = '';

    this.http.post<any>(`${environment.apiUrl}/admin/login`, this.credentials).subscribe({
      next: (response) => {
        console.log('✅ Login Response:', response);
        // Store tokens (Handle both camelCase and PascalCase from API)
        const accessToken = response.accessToken || response.AccessToken;
        const refreshToken = response.refreshToken || response.RefreshToken;
        const username = response.username || response.Username;

        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('adminUsername', username);

          console.log('✅ Login successful, token saved.');
          // Navigate to dashboard
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.loading = false;
          this.errorMessage = 'فشل في حفظ بيانات الدخول. (Token missing)';
          console.error('Login response missing token:', response);
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'خطأ في تسجيل الدخول. تحقق من البيانات.';
      }
    });
  }
}
