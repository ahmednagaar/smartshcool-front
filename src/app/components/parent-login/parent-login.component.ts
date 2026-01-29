import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-parent-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-nafes-cream py-12 flex items-center justify-center">
      <div class="card-nafes w-full max-w-md">
        <div class="text-center mb-8">
          <div class="text-6xl mb-4">🏠</div>
          <h2 class="text-3xl font-bold text-nafes-dark">دخول ولي أمر</h2>
          <p class="text-gray-600 mt-2">مرحباً بك في بوابة أولياء الأمور</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Email -->
          <div>
            <label class="block text-gray-700 font-bold mb-2">البريد الإلكتروني</label>
            <input type="email" [(ngModel)]="email" name="email" 
                   class="input-nafes text-left" dir="ltr" required>
          </div>

          <!-- Password -->
          <div>
            <label class="block text-gray-700 font-bold mb-2">كلمة المرور</label>
            <input type="password" [(ngModel)]="password" name="password" 
                   class="input-nafes" required>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="bg-red-100 text-red-700 p-3 rounded-lg text-center">
            {{ errorMessage }}
          </div>

          <button type="submit" [disabled]="isLoading" class="btn-gold w-full flex justify-center items-center gap-2">
            <span *ngIf="isLoading" class="animate-spin">⌛</span>
            تسجيل الدخول
          </button>
        </form>

        <div class="mt-8 text-center border-t pt-6">
          <p class="text-gray-600 mb-4">ليس لديك حساب؟</p>
          <a routerLink="/parent/register" class="text-nafes-gold font-bold hover:underline">
            سجل حساب جديد الآن
          </a>
        </div>
      </div>
    </div>
  `
})
export class ParentLoginComponent {
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor(private api: ApiService, private router: Router) { }

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';

    this.api.parentLogin({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        sessionStorage.setItem('parentToken', response.accessToken);
        sessionStorage.setItem('parentName', response.name);
        // Store children for dashboard to use
        if (response.children && response.children.length > 0) {
          sessionStorage.setItem('children', JSON.stringify(response.children));
        }
        this.router.navigate(['/parent/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'بيانات الدخول غير صحيحة';
      }
    });
  }
}
