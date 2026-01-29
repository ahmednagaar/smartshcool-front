import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-admin-register',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="min-h-screen bg-gradient-dark flex items-center">
      <div class="container">
        <div class="max-w-md mx-auto">
          <!-- Logo -->
          <div class="text-center mb-8">
            <h1 class="text-5xl font-bold text-nafes-gold mb-2">نافس</h1>
            <p class="text-gray-400">تسجيل حساب مشرف جديد</p>
          </div>

          <!-- Register Card -->
          <div class="card-nafes">
            <h2 class="text-3xl font-bold text-nafes-dark mb-6 text-center">إنشاء حساب</h2>

            <form (ngSubmit)="register()" #registerForm="ngForm">
              <!-- Username -->
              <div class="mb-4">
                <label class="block text-nafes-dark font-semibold mb-2">اسم المستخدم</label>
                <input
                  type="text"
                  [(ngModel)]="data.username"
                  name="username"
                  required
                  minlength="3"
                  class="input-nafes"
                  placeholder="اختر اسم مستخدم"
                />
              </div>

              <!-- Email -->
              <div class="mb-4">
                <label class="block text-nafes-dark font-semibold mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  [(ngModel)]="data.email"
                  name="email"
                  required
                  email
                  class="input-nafes"
                  placeholder="example@school.com"
                />
              </div>

              <!-- Password -->
              <div class="mb-4">
                <label class="block text-nafes-dark font-semibold mb-2">كلمة المرور</label>
                <input
                  type="password"
                  [(ngModel)]="data.password"
                  name="password"
                  required
                  minlength="6"
                  class="input-nafes"
                  placeholder="••••••••"
                />
              </div>

              <!-- Confirm Password -->
              <div class="mb-6">
                <label class="block text-nafes-dark font-semibold mb-2">تأكيد كلمة المرور</label>
                <input
                  type="password"
                  [(ngModel)]="confirmPassword"
                  name="confirmPassword"
                  required
                  class="input-nafes"
                  placeholder="••••••••"
                />
                <p *ngIf="confirmPassword && data.password !== confirmPassword" class="text-red-500 text-sm mt-1">
                  كلمة المرور غير متطابقة
                </p>
              </div>

              <!-- Message -->
              <div *ngIf="message" class="mb-6 p-4 rounded-lg" [ngClass]="isSuccess ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700'">
                <p class="text-center font-bold">{{ message }}</p>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                [disabled]="!registerForm.form.valid || loading || data.password !== confirmPassword"
                class="btn-gold w-full"
              >
                <span *ngIf="!loading">تسجيل الحساب</span>
                <span *ngIf="loading">جاري التسجيل...</span>
              </button>
            </form>

            <!-- Back to Login -->
            <div class="text-center mt-6">
              <a routerLink="/admin/login" class="text-nafes-gold hover-underline">لديك حساب بالفعل؟ تسجيل الدخول</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminRegisterComponent {
    data = {
        username: '',
        email: '',
        password: ''
    };
    confirmPassword = '';

    loading = false;
    message = '';
    isSuccess = false;

    constructor(
        private router: Router,
        private api: ApiService
    ) { }

    register() {
        if (this.data.password !== this.confirmPassword) {
            this.message = 'كلمة المرور غير متطابقة';
            this.isSuccess = false;
            return;
        }

        this.loading = true;
        this.message = '';

        this.api.adminRegister(this.data).subscribe({
            next: (response: any) => {
                this.loading = false;
                this.isSuccess = true;
                this.message = 'تم إنشاء الحساب بنجاح! يرجى انتظار موافقة المسؤول لتفعيل حسابك.';

                // Clear form
                this.data = { username: '', email: '', password: '' };
                this.confirmPassword = '';

                // Redirect after delay
                setTimeout(() => {
                    this.router.navigate(['/admin/login']);
                }, 3000);
            },
            error: (error: any) => {
                this.loading = false;
                this.isSuccess = false;
                this.message = error.error?.message || 'حدث خطأ أثناء التسجيل';
            }
        });
    }
}
