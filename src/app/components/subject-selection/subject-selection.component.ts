import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export type Subject = 'arabic' | 'math' | 'science';

interface SubjectOption {
  value: Subject;
  label: string;
  description: string;
  image: string;
}

@Component({
  selector: 'app-subject-selection',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-v0-gradient min-h-screen p-4">
      <div class="container max-w-5xl py-8">
        <button (click)="goBack()" class="btn-ghost mb-6">
          <span>→</span>
          رجوع
        </button>

        <div class="text-center mb-10">
          <span class="step-badge mb-6">الخطوة الثانية</span>
          <img src="assets/images/books-stack.png" alt="كتب" class="w-24 h-24 mx-auto mb-5 object-contain" onerror="this.style.display='none'" />
          <h2 class="text-3xl md:text-4xl font-bold text-foreground mb-4">اختر المادة الدراسية</h2>
          <p class="text-muted text-lg">{{ gradeName }} - اختر المادة التي تريد التدرب عليها</p>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          <div
            *ngFor="let subject of availableSubjects"
            class="subject-card"
            (click)="selectSubject(subject.value)"
          >
            <div class="subject-card-content">
              <img
                [src]="subject.image"
                [alt]="subject.label"
                class="subject-card-image"
                onerror="this.src='assets/images/subject-placeholder.png'"
              />
              <h3 class="subject-card-title">{{ subject.label }}</h3>
              <p class="subject-card-description">{{ subject.description }}</p>
              <button class="btn-secondary w-full">ابدأ الآن</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SubjectSelectionComponent implements OnInit {
  gradeName: string = '';
  availableSubjects: SubjectOption[] = [];

  private allSubjects: SubjectOption[] = [
    {
      value: 'arabic',
      label: 'لغتي',
      description: 'تدريبات على جميع فروع المنهج، مع التركيز على المهارات الأساسية المطلوبة في نافس',
      image: 'assets/images/arabic-subject.png'
    },
    {
      value: 'math',
      label: 'الرياضيات',
      description: 'تدريبات على جميع فروع المنهج، مع التركيز على المهارات الأساسية المطلوبة في نافس',
      image: 'assets/images/math-subject.png'
    },
    {
      value: 'science',
      label: 'العلوم',
      description: 'تدريبات على جميع فروع المنهج، مع التركيز على المهارات الأساسية المطلوبة في نافس',
      image: 'assets/images/science-subject.png'
    }
  ];

  constructor(private router: Router) { }

  ngOnInit() {
    const grade = sessionStorage.getItem('selectedGrade') || '3';
    const gradeNames: { [key: string]: string } = {
      '3': 'الصف الثالث الابتدائي',
      '4': 'الصف الرابع الابتدائي',
      '5': 'الصف الخامس الابتدائي',
      '6': 'الصف السادس الابتدائي'
    };
    this.gradeName = gradeNames[grade] || 'الصف الثالث الابتدائي';

    // Grade 3 doesn't have Science
    if (grade === '3') {
      this.availableSubjects = this.allSubjects.filter(s => s.value !== 'science');
    } else {
      this.availableSubjects = this.allSubjects;
    }
  }

  selectSubject(subject: Subject) {
    sessionStorage.setItem('selectedSubject', subject);
    this.router.navigate(['/training-type']);
  }

  goBack() {
    this.router.navigate(['/grade']);
  }
}
