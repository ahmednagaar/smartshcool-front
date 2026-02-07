import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

export type Grade = '3' | '4' | '5' | '6';

interface GradeOption {
  value: Grade;
  label: string;
  image: string;
}

@Component({
  selector: 'app-grade-selection',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-v0-gradient min-h-screen pb-20">
      
      <!-- User Requested Black Header -->
      <div class="bg-gradient-to-r from-indigo-800 to-purple-700 w-full relative mb-0 shadow-lg" style="height: 58px; z-index: 20;">
        <div class="container mx-auto px-4 h-full flex items-center justify-center">
            <h1 class="font-handicrafts text-2xl md:text-3xl font-semibold text-white">اختر المرحلة الدراسية</h1>
        </div>
      </div>

      <!-- Container with negative margin to pull dashed lines up to the header -->
      <div class="container max-w-6xl mx-auto px-4 mt-32" style="margin-top: 87px;">
        
        <!-- Grades Grid -->
        <!-- Grades List (Flexbox for row layout with proper spacing) -->
        <div class="flex flex-col md:flex-row justify-center items-start gap-8 max-w-6xl mx-auto flex-wrap">
          <div *ngFor="let grade of availableGrades; let i = index" class="timeline-card-container w-full md:w-[300px] shrink-0">
            
            <!-- Timeline Visuals (Dashed Line & Number) -->
            <div class="hidden md:block timeline-dashed-line"></div>
            <div class="hidden md:flex timeline-number-circle">
              <span class="timeline-number">{{ i + 1 }}</span>
            </div>

            <!-- Grade Card -->
            <div 
              class="grade-card-v2"
              (click)="selectGrade(grade.value)"
            >
              <!-- Background Image -->
              <div 
                class="grade-card-bg"
                [style.backgroundImage]="'url(' + grade.image + ')'"
              ></div>
              
              <!-- Spacer -->
              <div class="flex-1 relative z-10 w-full" style="min-height: 200px;"></div>
              
              <!-- Button -->
              <button class="w-full py-4 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl font-bold text-xl shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300 transform group-hover:translate-y-[-2px]">
                {{ grade.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Back Button -->
        <div class="mt-16 text-center">
          <button (click)="goBack()" class="btn-ghost">
            <span>→</span>
            رجوع
          </button>
        </div>
      </div>
    </div>
  `
})
export class GradeSelectionComponent implements OnInit {
  testType: string = '';
  testTypeLabel: string = '';
  availableGrades: GradeOption[] = [];

  // Nafes grades (3 and 6 only) with new boy+girl images
  private nafesGrades: GradeOption[] = [
    { value: '3', label: 'الصف الثالث', image: 'assets/images/grade3.png' },
    { value: '6', label: 'الصف السادس', image: 'assets/images/grade6.png' },
  ];

  // Central grades (all 4 grades) with old student images
  private centralGrades: GradeOption[] = [
    { value: '3', label: 'الصف الثالث', image: 'assets/images/grade-3-student.png' },
    { value: '4', label: 'الصف الرابع', image: 'assets/images/grade-4-student.png' },
    { value: '5', label: 'الصف الخامس', image: 'assets/images/grade-5-student.png' },
    { value: '6', label: 'الصف السادس', image: 'assets/images/grade-6-student.png' },
  ];

  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
    // Check query param first, then session, then default
    this.route.queryParams.subscribe(params => {
      if (params['type']) {
        this.testType = params['type'];
        sessionStorage.setItem('testType', this.testType);
      } else {
        this.testType = sessionStorage.getItem('testType') || 'central';
      }

      this.updateUI();
    });
  }

  updateUI() {
    if (this.testType === 'nafes') {
      this.testTypeLabel = 'اختبار نافس - اختر الصف';
      // Nafes uses new images (boy+girl)
      this.availableGrades = this.nafesGrades;
    } else {
      this.testTypeLabel = 'المسابقة المركزية - اختر الصف';
      // Central uses old images
      this.availableGrades = this.centralGrades;
    }
  }

  selectGrade(grade: Grade) {
    sessionStorage.setItem('selectedGrade', grade);
    this.router.navigate(['/subject']);
  }

  goBack() {
    this.router.navigate(['/test-type']);
  }
}
