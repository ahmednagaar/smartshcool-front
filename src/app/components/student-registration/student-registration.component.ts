import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Student } from '../../models/models';

@Component({
  selector: 'app-student-registration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-nafes-cream py-12">
      <div class="container mx-auto px-6">
        <div class="max-w-2xl mx-auto">
          <!-- Header -->
          <div class="text-center mb-12">
            <h1 class="text-5xl font-bold text-nafes-dark mb-4">تسجيل طالب جديد</h1>
            <p class="text-xl text-gray-600">أدخل بياناتك للبدء في الاختبار</p>
          </div>

          <!-- Registration Form -->
          <div class="card-nafes">
            <form (ngSubmit)="onSubmit()" #studentForm="ngForm">
              <!-- Name -->
              <div class="mb-6">
                <label class="block text-nafes-dark text-lg font-semibold mb-2">
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  [(ngModel)]="student.name"
                  name="name"
                  required
                  class="input-nafes"
                  placeholder="أدخل اسمك الكامل"
                />
              </div>

              <!-- Age -->
              <div class="mb-6">
                <label class="block text-nafes-dark text-lg font-semibold mb-2">
                  العمر *
                </label>
                <input
                  type="number"
                  [(ngModel)]="student.age"
                  name="age"
                  required
                  min="6"
                  max="18"
                  class="input-nafes"
                  placeholder="أدخل عمرك"
                />
              </div>

              <!-- Grade -->
              <div class="mb-6">
                <label class="block text-nafes-dark text-lg font-semibold mb-2">
                  الصف الدراسي *
                </label>
                <select
                  [(ngModel)]="student.grade"
                  name="grade"
                  required
                  class="input-nafes"
                >
                  <option value="">اختر الصف</option>
                  <option value="الصف الأول">الصف الأول</option>
                  <option value="الصف الثاني">الصف الثاني</option>
                  <option value="الصف الثالث">الصف الثالث</option>
                  <option value="الصف الرابع">الصف الرابع</option>
                  <option value="الصف الخامس">الصف الخامس</option>
                  <option value="الصف السادس">الصف السادس</option>
                </select>
              </div>



              <!-- Error Message -->
              <div *ngIf="errorMessage" class="mb-6 p-4 bg-red-100 border-2 border-red-500 rounded-lg">
                <p class="text-red-700 text-center">{{ errorMessage }}</p>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                [disabled]="!studentForm.form.valid || loading"
                class="btn-gold w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span *ngIf="!loading">التالي - اختر الاختبار</span>
                <span *ngIf="loading">جاري التسجيل...</span>
              </button>
            </form>
          </div>

          <!-- Back to Home -->
          <div class="text-center mt-8">
            <a routerLink="/" class="text-nafes-gold hover:underline text-lg">
              العودة للصفحة الرئيسية
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StudentRegistrationComponent {
  student: Student = {
    name: '',
    age: 0,
    grade: '',
  };

  loading = false;
  errorMessage = '';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) { }

  onSubmit() {
    this.loading = true;
    this.errorMessage = '';

    this.apiService.createStudent(this.student).subscribe({
      next: (createdStudent) => {
        // Store student ID in session storage
        sessionStorage.setItem('currentStudentId', createdStudent.id!.toString());
        sessionStorage.setItem('currentStudentName', createdStudent.name);

        // Navigate to game selection
        this.router.navigate(['/games']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.';
        console.error('Registration error:', error);
      }
    });
  }
}
