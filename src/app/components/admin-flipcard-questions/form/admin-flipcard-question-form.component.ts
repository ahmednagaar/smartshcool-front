import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FlipCardQuestionService } from '../../../services/flip-card-question.service';
import {
    FlipCardGameMode,
    FlipCardTimerMode,
    FlipCardContentType,
    CreateFlipCardQuestionDto,
    UpdateFlipCardQuestionDto
} from '../../../models/flip-card.model';
import { GradeLevel, SubjectType } from '../../../models/drag-drop.model';
import { LucideAngularModule, ChevronLeft, ChevronRight, Save, Plus, Trash2, Image, Mic, Type } from 'lucide-angular';

@Component({
    selector: 'app-admin-flipcard-question-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
    templateUrl: './admin-flipcard-question-form.component.html',
    styleUrls: ['./admin-flipcard-question-form.component.css']
})
export class AdminFlipCardQuestionFormComponent implements OnInit {
    questionForm: FormGroup;
    isEditMode = false;
    questionId: number | null = null;
    loading = false;
    currentStep = 1;

    // Enums for template
    GradeLevel = GradeLevel;
    SubjectType = SubjectType;
    FlipCardGameMode = FlipCardGameMode;
    FlipCardTimerMode = FlipCardTimerMode;
    FlipCardContentType = FlipCardContentType;

    // Options
    themes = [
        { id: 'modern', name: 'Modern' },
        { id: 'kids', name: 'Kids' },
        { id: 'dark', name: 'Dark Ops' }
    ];

    cardBacks = [
        { id: 'standard', name: 'Standard' },
        { id: 'pattern', name: 'Pattern' },
        { id: 'logo', name: 'School Logo' }
    ];

    constructor(
        private fb: FormBuilder,
        private questionService: FlipCardQuestionService,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.questionForm = this.fb.group({
            // Step 1: Basic Info
            gameTitle: ['', [Validators.required, Validators.minLength(3)]],
            instructions: ['match the pairs', [Validators.required]],
            gradeId: [null, [Validators.required]],
            subjectId: [null, [Validators.required]],
            gameMode: [FlipCardGameMode.Classic, [Validators.required]],
            difficultyLevel: [1],
            isActive: [true],

            // Step 2: Settings
            timerMode: [FlipCardTimerMode.None, [Validators.required]],
            timeLimitSeconds: [null], // Conditional validation?
            showHints: [true],
            maxHints: [3],
            uiTheme: ['modern'],
            cardBackDesign: ['standard'],
            customCardBackUrl: [''],

            // Step 3: Pairs
            pairs: this.fb.array([])
        });
    }

    get pairs(): FormArray {
        return this.questionForm.get('pairs') as FormArray;
    }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode = true;
            this.questionId = +id;
            this.loadQuestion(this.questionId);
        } else {
            // Add initial empty pairs
            this.addPair();
            this.addPair();
        }
    }

    loadQuestion(id: number): void {
        this.loading = true;
        this.questionService.getById(id).subscribe({
            next: (data) => {
                // Patch simple fields
                this.questionForm.patchValue({
                    gameTitle: data.gameTitle,
                    instructions: data.instructions,
                    gradeId: data.gradeId,
                    subjectId: data.subjectId,
                    gameMode: data.gameMode,
                    difficultyLevel: data.difficultyLevel,
                    isActive: data.isActive,
                    timerMode: data.timerMode,
                    timeLimitSeconds: data.timeLimitSeconds,
                    showHints: data.showHints,
                    maxHints: data.maxHints,
                    uiTheme: data.uiTheme,
                    cardBackDesign: data.cardBackDesign,
                    customCardBackUrl: data.customCardBackUrl
                });

                // Clear and rebuild pairs array
                this.pairs.clear();
                data.pairs.forEach(p => {
                    const group = this.createPairGroup();
                    group.patchValue({
                        id: p.id,
                        card1Type: p.card1Type,
                        card1Text: p.card1Text,
                        card1ImageUrl: p.card1ImageUrl,
                        card1AudioUrl: p.card1AudioUrl,
                        card2Type: p.card2Type,
                        card2Text: p.card2Text,
                        card2ImageUrl: p.card2ImageUrl,
                        card2AudioUrl: p.card2AudioUrl
                    });
                    this.pairs.push(group);
                });

                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to load question', err);
                this.loading = false;
            }
        });
    }

    createPairGroup(): FormGroup {
        return this.fb.group({
            id: [0], // For updates
            // Card 1
            card1Type: [FlipCardContentType.Text, Validators.required],
            card1Text: ['', Validators.required], // Conditional validation logic needed if type != Text
            card1ImageUrl: [''],
            card1AudioUrl: [''],

            // Card 2
            card2Type: [FlipCardContentType.Text, Validators.required],
            card2Text: ['', Validators.required],
            card2ImageUrl: [''],
            card2AudioUrl: ['']
        });
    }

    addPair(): void {
        this.pairs.push(this.createPairGroup());
    }

    removePair(index: number): void {
        this.pairs.removeAt(index);
    }

    nextStep(): void {
        if (this.currentStep < 3) {
            // Validate current step fields?
            // For simplicity, just allow moving but final submit validates all.
            // Or validate specific controls.
            this.currentStep++;
        }
    }

    prevStep(): void {
        if (this.currentStep > 1) {
            this.currentStep--;
        }
    }

    setStep(step: number): void {
        this.currentStep = step;
    }

    onSubmit(): void {
        if (this.questionForm.invalid) {
            this.questionForm.markAllAsTouched();
            // maybe alert user
            alert('Please fill all required fields');
            return;
        }

        this.loading = true;
        const formValue = this.questionForm.value;

        if (this.isEditMode && this.questionId) {
            const updateDto: UpdateFlipCardQuestionDto = {
                ...formValue,
                id: this.questionId
            };

            this.questionService.update(this.questionId, updateDto).subscribe({
                next: () => {
                    this.router.navigate(['../../list'], { relativeTo: this.route });
                },
                error: (err) => {
                    console.error(err);
                    this.loading = false;
                    alert('Failed to update game');
                }
            });
        } else {
            const createDto: CreateFlipCardQuestionDto = {
                ...formValue,
                displayOrder: 0 // Default
            };

            this.questionService.create(createDto).subscribe({
                next: () => {
                    this.router.navigate(['../list'], { relativeTo: this.route });
                },
                error: (err) => {
                    console.error(err);
                    this.loading = false;
                    alert('Failed to create game');
                }
            });
        }
    }
}
