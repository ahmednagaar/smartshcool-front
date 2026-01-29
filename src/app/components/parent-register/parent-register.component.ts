import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-parent-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="min-h-screen bg-nafes-cream py-12 flex items-center justify-center">
      <div class="card-nafes w-full max-w-lg">
        <div class="text-center mb-8">
          <div class="text-6xl mb-4">👨‍👩‍👧‍👦</div>
          <h2 class="text-3xl font-bold text-nafes-dark">تسجيل ولي أمر جديد</h2>
          <p class="text-gray-600 mt-2">تابع تقدم طفلك التعليمي</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <!-- Name -->
          <div>
            <label class="block text-gray-700 font-bold mb-2">الاسم الكامل</label>
            <input type="text" [(ngModel)]="formData.name" name="name" 
                   class="input-nafes" required>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-gray-700 font-bold mb-2">البريد الإلكتروني</label>
            <input type="email" [(ngModel)]="formData.email" name="email" 
                   class="input-nafes text-left" dir="ltr" required>
          </div>

          <!-- Phone -->
          <div>
            <label class="block text-gray-700 font-bold mb-2">رقم الجوال</label>
            <input type="tel" [(ngModel)]="formData.phone" name="phone" 
                   class="input-nafes text-left" dir="ltr" required>
          </div>

          <!-- Password -->
          <div>
            <label class="block text-gray-700 font-bold mb-2">كلمة المرور</label>
            <input type="password" [(ngModel)]="formData.password" name="password" 
                   class="input-nafes" required minlength="6">
          </div>

          <!-- Child Link -->
          <div class="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-300">
            <h3 class="font-bold text-nafes-dark mb-2">بيانات الطالب (ابنك)</h3>
            <label class="block text-gray-700 font-bold mb-2">كود الطالب (مثل: NAF-1234)</label>
            <input type="text" [(ngModel)]="formData.childStudentCode" name="childStudentCode" 
                   class="input-nafes text-center text-xl uppercase" 
                   required placeholder="NAF-XXXX">
            <p class="text-sm text-gray-500 mt-1">يمكنك العثور على هذا الكود في حساب الطالب</p>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="bg-red-100 text-red-700 p-3 rounded-lg text-center">
            {{ errorMessage }}
          </div>

          <button type="submit" [disabled]="isLoading" class="btn-gold w-full mt-4">
            <span *ngIf="isLoading">جاري التسجيل...</span>
            <span *ngIf="!isLoading">إنشاء الحساب</span>
          </button>
        </form>

        <div class="mt-6 text-center">
          <a routerLink="/parent/login" class="text-gray-600 hover:text-nafes-gold transition">
            لديك حساب بالفعل؟ تسجيل الدخول
          </a>
        </div>
      </div>
    </div>
  `
})
export class ParentRegisterComponent {
    formData = {
        name: '',
        email: '',
        phone: '',
        password: '',
        childStudentCode: ''
    };
    isLoading = false;
    errorMessage = '';

    constructor(private api: ApiService, private router: Router) { }

    onSubmit() {
        this.isLoading = true;
        this.errorMessage = '';

        this.api.parentRegister(this.formData).subscribe({
            next: (response) => {
                sessionStorage.setItem('parentToken', response.accessToken);
                sessionStorage.setItem('parentName', response.name);
                this.router.navigate(['/parent/dashboard']);
            },
            error: (error) => {
                this.isLoading = false;
                this.errorMessage = error.error?.message || 'حدث خطأ في التسجيل';
            }
        });
    }
}
