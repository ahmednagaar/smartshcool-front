import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { WheelQuestionService } from '../../services/wheel-question.service';
import { CreateWheelQuestionDto, WheelQuestion } from '../../models/wheel-game.model';
import { DifficultyLevel, QuestionType } from '../../models/models';
import { LucideAngularModule, ArrowRight, Save, Plus, Trash2 } from 'lucide-angular';

@Component({
    selector: 'app-admin-wheel-question-form',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
    templateUrl: './admin-wheel-question-form.component.html',
    styleUrls: ['./admin-wheel-question-form.component.css']
})
export class AdminWheelQuestionFormComponent implements OnInit {
    isEditMode = false;
    questionId?: number;
    loading = false;
    saving = false;

    // Form Model
    model: CreateWheelQuestionDto = {
        gradeId: 4,
        subjectId: 1,
        questionText: '',
        questionType: QuestionType.MultipleChoice,
        correctAnswer: '',
        wrongAnswers: ['', '', ''], // Default 3 wrong answers
        difficultyLevel: DifficultyLevel.Medium,
        pointsValue: 20,
        timeLimit: 30,
        hintText: '',
        explanation: '',
        categoryTag: '',
        displayOrder: 0
    };

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private wheelService: WheelQuestionService
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id && id !== 'new') {
            this.isEditMode = true;
            this.questionId = +id;
            this.loadQuestion(this.questionId);
        }
    }

    loadQuestion(id: number): void {
        this.loading = true;
        this.wheelService.getById(id).subscribe({
            next: (q: WheelQuestion) => {
                // Map response to form model
                this.model = {
                    gradeId: q.gradeId,
                    subjectId: q.subjectId,
                    questionText: q.questionText,
                    questionType: q.questionType,
                    correctAnswer: q.correctAnswer,
                    wrongAnswers: this.extractWrongAnswers(q.options, q.correctAnswer),
                    difficultyLevel: q.difficultyLevel,
                    pointsValue: q.pointsValue,
                    timeLimit: q.timeLimit,
                    hintText: q.hintText,
                    explanation: q.explanation,
                    categoryTag: q.categoryTag,
                    displayOrder: q.displayOrder
                };
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading question', err);
                this.router.navigate(['/admin/wheel-questions']);
            }
        });

    }

    // Helper to separate wrong answers from mixed options list
    private extractWrongAnswers(options: string[], correctAnswer: string): string[] {
        if (!options) return [];
        return options.filter(o => o !== correctAnswer);
    }

    addWrongAnswer(): void {
        this.model.wrongAnswers.push('');
    }

    removeWrongAnswer(index: number): void {
        this.model.wrongAnswers.splice(index, 1);
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    saveQuestion(): void {
        if (!this.model.questionText || !this.model.correctAnswer) {
            alert('الرجاء تعبئة الحقول المطلوبة');
            return;
        }

        this.saving = true;

        if (this.isEditMode && this.questionId) {
            this.wheelService.update(this.questionId, { ...this.model, isActive: true }).subscribe({
                next: () => {
                    alert('تم تعديل السؤال بنجاح');
                    this.router.navigate(['/admin/wheel-questions']);
                },
                error: () => {
                    this.saving = false;
                    alert('حدث خطأ أثناء الحفظ');
                }
            });
        } else {
            this.wheelService.create(this.model).subscribe({
                next: () => {
                    alert('تم إضافة السؤال بنجاح');
                    this.router.navigate(['/admin/wheel-questions']);
                },
                error: () => {
                    this.saving = false;
                    alert('حدث خطأ أثناء الحفظ');
                }
            });
        }
    }
}
