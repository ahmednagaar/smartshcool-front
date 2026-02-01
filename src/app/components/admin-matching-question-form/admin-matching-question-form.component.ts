import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatchingQuestionService } from '../../services/matching-question.service';
import { MatchingQuestion, DifficultyLevel, CreateMatchingQuestionDto } from '../../models/models';
import { LucideAngularModule, Save, ArrowLeft, ArrowRight, Plus, Trash2, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';

@Component({
  selector: 'app-admin-matching-question-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
  templateUrl: './admin-matching-question-form.component.html',
  styleUrl: './admin-matching-question-form.component.css',
  providers: [{ provide: LUCIDE_ICONS, useValue: new LucideIconProvider({ Save, ArrowLeft, ArrowRight, Plus, Trash2 }) }]
})
export class AdminMatchingQuestionFormComponent implements OnInit {
  questionForm: FormGroup;
  isEditMode: boolean = false;
  questionId: number | null = null;
  isLoading: boolean = false;
  submitted: boolean = false;

  readonly DifficultyLevel = DifficultyLevel;

  constructor(
    private fb: FormBuilder,
    private matchingService: MatchingQuestionService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.questionForm = this.fb.group({
      gradeId: [null, Validators.required],
      subjectId: [null, Validators.required],
      leftItemText: ['', [Validators.required, Validators.maxLength(200)]],
      rightItemText: ['', [Validators.required, Validators.maxLength(200)]],
      difficultyLevel: [DifficultyLevel.Medium, Validators.required],
      displayOrder: [1, Validators.required],
      // Dynamic distractors
      distractorItems: this.fb.array([])
    });
  }

  get distractorItems(): FormArray {
    return this.questionForm.get('distractorItems') as FormArray;
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.questionId = +params['id'];
        this.loadQuestion(this.questionId);
      } else {
        // Add 1 default distractor field for new questions
        this.addDistractor();
      }
    });
  }

  loadQuestion(id: number): void {
    this.isLoading = true;
    this.matchingService.getById(id).subscribe({
      next: (q) => {
        this.patchForm(q);
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        // this.router.navigate(['/admin/matching-questions']);
      }
    });
  }

  patchForm(q: MatchingQuestion): void {
    this.questionForm.patchValue({
      gradeId: q.gradeId,
      subjectId: q.subjectId,
      leftItemText: q.leftItemText,
      rightItemText: q.rightItemText,
      difficultyLevel: q.difficultyLevel,
      displayOrder: q.displayOrder
    });

    // Clear existing distractors
    this.distractorItems.clear();

    // Add distractors from data
    if (q.distractorItems && q.distractorItems.length > 0) {
      q.distractorItems.forEach(d => {
        this.distractorItems.push(this.fb.control(d, Validators.required));
      });
    } else {
      // Add at least one empty
      this.addDistractor();
    }
  }

  addDistractor(): void {
    this.distractorItems.push(this.fb.control('', Validators.required));
  }

  removeDistractor(index: number): void {
    this.distractorItems.removeAt(index);
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.questionForm.invalid) return;

    this.isLoading = true;
    const formValue = this.questionForm.value;

    const dto: CreateMatchingQuestionDto = {
      gradeId: +formValue.gradeId,
      subjectId: +formValue.subjectId,
      leftItemText: formValue.leftItemText,
      rightItemText: formValue.rightItemText,
      difficultyLevel: +formValue.difficultyLevel,
      displayOrder: formValue.displayOrder,
      distractorItems: formValue.distractorItems
    };

    if (this.isEditMode && this.questionId) {
      this.matchingService.update(this.questionId, dto).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/admin/matching-questions']);
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
        }
      });
    } else {
      this.matchingService.create(dto).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/admin/matching-questions']);
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
        }
      });
    }
  }
}
