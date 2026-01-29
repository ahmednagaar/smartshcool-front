import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Student } from '../../models/models';

@Component({
  selector: 'app-admin-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-students.component.html',
  styleUrls: ['./admin-students.component.css']
})
export class AdminStudentsComponent implements OnInit {
  students: Student[] = [];
  filteredStudents: Student[] = [];
  searchTerm: string = '';
  loading: boolean = false;

  // Modal State
  isModalOpen: boolean = false;
  isEditMode: boolean = false;
  currentStudent: Student = { name: '', age: 0, grade: '' };

  // Validation/Error
  error: string = '';

  grades: string[] = ['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس'];

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadStudents();
  }

  loadStudents() {
    this.loading = true;
    this.api.getAllStudents().subscribe({
      next: (data) => {
        this.students = data;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load students', err);
        this.loading = false;
      }
    });
  }

  applyFilter() {
    if (!this.searchTerm) {
      this.filteredStudents = this.students;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredStudents = this.students.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.studentCode?.toLowerCase().includes(term) ||
        s.grade.toLowerCase().includes(term)
      );
    }
  }

  openAddModal() {
    this.isEditMode = false;
    this.currentStudent = { name: '', age: 10, grade: 'الصف الرابع', pin: '' };
    this.isModalOpen = true;
    this.error = '';
  }

  openEditModal(student: Student) {
    this.isEditMode = true;
    this.currentStudent = { ...student }; // Copy
    this.isModalOpen = true;
    this.error = '';
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveStudent() {
    if (!this.currentStudent.name || !this.currentStudent.grade) {
      this.error = 'الرجاء تعبئة جميع الحقول المطلوبة';
      return;
    }

    if (!this.isEditMode && (!this.currentStudent.pin || this.currentStudent.pin.length !== 4)) {
      this.error = 'الرجاء إدخال رمز PIN مكون من 4 أرقام';
      return;
    }

    this.loading = true;

    if (this.isEditMode && this.currentStudent.id) {
      // Update
      const updateData = {
        name: this.currentStudent.name,
        age: this.currentStudent.age,
        grade: this.currentStudent.grade
      };

      this.api.updateStudent(this.currentStudent.id, updateData).subscribe({
        next: (updated) => {
          const index = this.students.findIndex(s => s.id === updated.id);
          if (index !== -1) this.students[index] = updated;
          this.applyFilter();
          this.closeModal();
          this.loading = false;
        },
        error: (err) => {
          this.error = 'فشل تحديث بيانات الطالب';
          this.loading = false;
        }
      });
    } else {
      // Create
      this.api.createStudent(this.currentStudent).subscribe({
        next: (created) => {
          this.students.push(created);
          this.applyFilter();
          this.closeModal();
          this.loading = false;
        },
        error: (err) => {
          this.error = 'فشل إنشاء الطالب';
          this.loading = false;
        }
      });
    }
  }

  deleteStudent(id: number | undefined) {
    if (!id || !confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;

    this.loading = true;
    this.api.deleteStudent(id).subscribe({
      next: () => {
        this.students = this.students.filter(s => s.id !== id);
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        alert('فشل حذف الطالب');
        this.loading = false;
      }
    });
  }

  exportData() {
    this.api.exportStudents();
  }

  getGradeBadgeClass(grade: string): string {
    if (grade && grade.includes('السادس')) return 'bg-purple-100 text-purple-800';
    if (grade && grade.includes('الخامس')) return 'bg-blue-100 text-blue-800';
    if (grade && grade.includes('الرابع')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  }

  trackByStudent(index: number, s: Student): number {
    return s.id!;
  }
}
