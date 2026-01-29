import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-student-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="min-h-screen bg-nafes-cream py-12 flex items-center justify-center">
      <div class="card-nafes w-full max-w-md">
        <div class="text-center mb-8">
          <div class="text-6xl mb-4">🔐</div>
          <h2 class="text-3xl font-bold text-nafes-dark">تسجيل دخول الطالب</h2>
          <p class="text-gray-600 mt-2">أدخل الكود والرمز السري الخاص بك</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Student Code -->
          <div>
            <label class="block text-gray-700 font-bold mb-2">كود الطالب (NAF-XXXX)</label>
            <input type="text" [(ngModel)]="studentCode" name="studentCode" 
                   class="input-nafes text-center text-xl uppercase" 
                   placeholder="NAF-1234" required>
          </div>

          <!-- PIN -->
          <div>
            <label class="block text-gray-700 font-bold mb-2">الرمز السري (4 أرقام)</label>
            <div class="flex justify-center gap-4 ltr">
              <input type="password" [(ngModel)]="pin" name="pin" 
                     class="input-nafes text-center text-3xl tracking-widest" 
                     maxlength="4" placeholder="••••" required>
            </div>
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
          <a routerLink="/register" class="text-nafes-gold font-bold hover:underline">
            سجل حساب جديد الآن
          </a>
        </div>
      </div>
    </div>
  `
})
export class StudentLoginComponent {
    studentCode: string = '';
    pin: string = '';
    isLoading: boolean = false;
    errorMessage: string = '';

    constructor(private api: ApiService, private router: Router) { }

    onSubmit() {
        if (!this.studentCode || !this.pin) {
            this.errorMessage = 'الرجاء إدخال جميع البيانات';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        this.api.studentLogin(this.studentCode, this.pin).subscribe({
            next: (response) => {
                // Save session
                sessionStorage.setItem('token', response.accessToken);
                sessionStorage.setItem('currentStudentId', response.id);
                sessionStorage.setItem('studentName', response.name);

                this.isLoading = false;
                this.router.navigate(['/games']);
            },
            error: (error) => {
                this.isLoading = false;
                this.errorMessage = error.error?.message || 'بيانات الدخول غير صحيحة';
            }
        });
    }
}
