import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatchingGameService } from '../../services/matching-game.service';
import {
  MatchingGameDto,
  CreateMatchingGameDto,
  UpdateMatchingGameDto,
  DifficultyLevel,
  GradeLevel,
  SubjectType,
  MatchingMode,
  MatchingTimerMode,
  MatchingContentType
} from '../../models/matching-game.model';
import { LucideAngularModule, Save, ArrowLeft, ArrowRight, Plus, Trash2, Settings, List, CheckCircle, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';

@Component({
  selector: 'app-admin-matching-question-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
  templateUrl: './admin-matching-question-form.component.html',
  styleUrl: './admin-matching-question-form.component.css',
  providers: [{ provide: LUCIDE_ICONS, useValue: new LucideIconProvider({ Save, ArrowLeft, ArrowRight, Plus, Trash2, Settings, List, CheckCircle }) }]
})
export class AdminMatchingQuestionFormComponent implements OnInit {
  gameForm: FormGroup;
  isEditMode: boolean = false;
  gameId: number | null = null;
  isLoading: boolean = false;
  submitted: boolean = false;

  currentStep: number = 1; // 1: Settings, 2: Pairs, 3: Review

  readonly DifficultyLevel = DifficultyLevel;
  readonly GradeLevel = GradeLevel;
  readonly SubjectType = SubjectType;
  readonly MatchingMode = MatchingMode;
  readonly MatchingTimerMode = MatchingTimerMode;
  readonly MatchingContentType = MatchingContentType;

  constructor(
    private fb: FormBuilder,
    private matchingService: MatchingGameService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.gameForm = this.fb.group({
      // Step 1: Game Settings
      gameTitle: ['', [Validators.required, Validators.maxLength(100)]],
      instructions: ['طابق العناصر التالية:', [Validators.required, Validators.maxLength(500)]],
      gradeId: [null, Validators.required],
      subjectId: [null, Validators.required],
      difficultyLevel: [DifficultyLevel.Medium, Validators.required],

      // Advanced Settings
      matchingMode: [MatchingMode.Both, Validators.required],
      uiTheme: ['default'],
      showConnectingLines: [true],
      enableAudio: [true],
      enableHints: [true],
      maxHints: [3, [Validators.min(0)]],
      timerMode: [MatchingTimerMode.None],
      timeLimitSeconds: [60],
      pointsPerMatch: [10],
      wrongMatchPenalty: [2],
      isActive: [true],
      displayOrder: [1],
      category: ['General'],

      // Step 2: Pairs
      pairs: this.fb.array([])
    });
  }

  get pairs(): FormArray {
    return this.gameForm.get('pairs') as FormArray;
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.gameId = +params['id'];
        this.loadGame(this.gameId);
      } else {
        // Add 4 default empty pairs for new game
        for (let i = 0; i < 4; i++) this.addPair();
      }
    });
  }

  loadGame(id: number): void {
    this.isLoading = true;
    this.matchingService.getGameById(id).subscribe({
      next: (game) => {
        this.patchForm(game);
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        // this.router.navigate(['/admin/matching-questions']);
      }
    });
  }

  patchForm(game: MatchingGameDto): void {
    this.gameForm.patchValue({
      gameTitle: game.gameTitle,
      instructions: game.instructions,
      gradeId: game.gradeId,
      subjectId: game.subjectId,
      difficultyLevel: game.difficultyLevel,
      matchingMode: game.matchingMode,
      uiTheme: game.uiTheme,
      showConnectingLines: game.showConnectingLines,
      enableAudio: game.enableAudio,
      enableHints: game.enableHints,
      maxHints: game.maxHints,
      timerMode: game.timerMode,
      timeLimitSeconds: game.timeLimitSeconds,
      pointsPerMatch: game.pointsPerMatch,
      wrongMatchPenalty: game.wrongMatchPenalty,
      isActive: game.isActive,
      displayOrder: game.displayOrder,
      category: game.category
    });

    this.pairs.clear();
    if (game.pairs && game.pairs.length > 0) {
      game.pairs.forEach(p => {
        this.addPair(p);
      });
    } else {
      for (let i = 0; i < 4; i++) this.addPair();
    }
  }

  addPair(pairData: any = null): void {
    const pairGroup = this.fb.group({
      questionText: [pairData?.questionText || '', [Validators.required]],
      questionImageUrl: [pairData?.questionImageUrl || ''],
      questionAudioUrl: [pairData?.questionAudioUrl || ''],
      questionType: [pairData?.questionType || MatchingContentType.Text],

      answerText: [pairData?.answerText || '', [Validators.required]],
      answerImageUrl: [pairData?.answerImageUrl || ''],
      answerAudioUrl: [pairData?.answerAudioUrl || ''],
      answerType: [pairData?.answerType || MatchingContentType.Text],

      explanation: [pairData?.explanation || '']
    });
    this.pairs.push(pairGroup);
  }

  removePair(index: number): void {
    if (this.pairs.length <= 4) {
      alert('يجب أن تحتوي اللعبة على 4 أزواج على الأقل');
      return;
    }
    this.pairs.removeAt(index);
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      // Validate Step 1 fields
      const controls = ['gameTitle', 'gradeId', 'subjectId'];
      let valid = true;
      controls.forEach(c => {
        if (this.gameForm.get(c)?.invalid) {
          this.gameForm.get(c)?.markAsTouched();
          valid = false;
        }
      });
      if (!valid) return;
    }
    this.currentStep++;
  }

  prevStep(): void {
    this.currentStep--;
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.gameForm.invalid) {
      // Mark all as touched to show errors
      this.gameForm.markAllAsTouched();
      return;
    }

    if (this.pairs.length < 4) {
      alert('يجب إضافة 4 أزواج على الأقل');
      return;
    }

    this.isLoading = true;
    const formValue = this.gameForm.value;

    // Construct DTO
    const dto: CreateMatchingGameDto = {
      ...formValue,
      pairs: formValue.pairs.map((p: any) => ({
        ...p,
        questionType: +p.questionType,
        answerType: +p.answerType
      }))
    };

    if (this.isEditMode && this.gameId) {
      const updateDto: UpdateMatchingGameDto = { ...dto, id: this.gameId, isActive: formValue.isActive, displayOrder: formValue.displayOrder };
      this.matchingService.updateGame(this.gameId, updateDto).subscribe({
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
      this.matchingService.createGame(dto).subscribe({
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
