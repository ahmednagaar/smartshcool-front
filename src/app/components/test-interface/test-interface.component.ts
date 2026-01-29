import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { GameWithQuestions, GameQuestionDto, SubmitTestDto, TestAnswer } from '../../models/models';

@Component({
  selector: 'app-test-interface',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-nafes-cream py-8">
      <div class="container mx-auto px-6">
        <!-- Header -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-nafes-dark">{{ game?.title }}</h1>
              <p class="text-gray-600">{{ game?.description }}</p>
            </div>
            <div class="text-left">
              <div class="text-4xl font-bold text-nafes-gold">{{ timeRemaining }}</div>
              <div class="text-sm text-gray-600">دقيقة متبقية</div>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="bg-white rounded-xl shadow-lg p-4 mb-8">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm text-gray-600">السؤال {{ currentQuestionIndex + 1 }} من {{ game?.questions?.length || 0 }}</span>
            <span class="text-sm text-nafes-gold font-semibold">{{ progress }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div class="bg-nafes-gold h-3 rounded-full transition-all duration-300" [style.width.%]="progress"></div>
          </div>
        </div>

        <!-- Question Card -->
        <div *ngIf="currentQuestion" class="card-nafes max-w-4xl mx-auto">
          <div class="mb-6">
            <span class="inline-block bg-nafes-gold bg-opacity-20 text-nafes-gold px-4 py-2 rounded-lg text-sm font-semibold mb-4">
              {{ currentQuestion.difficulty }}
            </span>
            <h2 class="text-3xl font-bold text-nafes-dark mb-4">{{ currentQuestion.text }}</h2>
          </div>

          <!-- Multiple Choice Options -->
        <div class="grid grid-cols-2 gap-6">
          <button *ngFor="let option of getOptions(currentQuestion.options)" 
                  (click)="selectAnswer(option)"
                  [class.border-nafes-gold]="answers[currentQuestion.questionId] === option"
                  [class.bg-nafes-gold]="answers[currentQuestion.questionId] === option"
                  [class.bg-opacity-10]="answers[currentQuestion.questionId] === option"
                  class="bg-white hover:bg-gray-50 border-2 border-gray-300 rounded-xl p-6 cursor-pointer hover:border-nafes-gold transition-all text-nafes-dark text-2xl font-bold">
            {{ option }}
          </button>
        </div>

          <!-- Fill in the Blank -->
          <div *ngIf="currentQuestion.type === 'FillInTheBlank'" class="mb-6">
            <input
              type="text"
              [(ngModel)]="answers[currentQuestion.questionId]"
              class="input-nafes text-2xl text-center"
              placeholder="اكتب إجابتك هنا"
            />
          </div>

          <!-- Navigation Buttons -->
          <div class="flex justify-between mt-12">
            <button
              *ngIf="currentQuestionIndex > 0"
              (click)="previousQuestion()"
              class="px-8 py-4 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400 transition">
              السؤال السابق
            </button>
            <div *ngIf="currentQuestionIndex === 0"></div>

            <button
              *ngIf="currentQuestionIndex < game!.questions.length - 1"
              (click)="nextQuestion()"
              class="btn-gold">
              السؤال التالي
            </button>

            <button
              *ngIf="currentQuestionIndex === game!.questions.length - 1"
              (click)="submitTest()"
              class="bg-green-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-green-700 transition">
              إنهاء الاختبار
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div *ngIf="!game" class="text-center py-20">
          <div class="text-6xl mb-4">⏳</div>
          <p class="text-2xl text-gray-600">جاري تحميل الاختبار...</p>
        </div>
      </div>
    </div>
  `
})
export class TestInterfaceComponent implements OnInit {
  game: GameWithQuestions | null = null;
  currentQuestionIndex = 0;
  currentQuestion: GameQuestionDto | null = null;
  answers: { [key: number]: string } = {};
  startTime: number = 0;
  timeRemaining: number = 0;
  timerInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) { }

  ngOnInit() {
    const gameId = Number(this.route.snapshot.paramMap.get('id'));
    const studentId = sessionStorage.getItem('currentStudentId');

    if (!studentId) {
      this.router.navigate(['/register']);
      return;
    }

    this.loadGame(gameId);
  }

  loadGame(gameId: number) {
    this.apiService.getGameWithQuestions(gameId).subscribe({
      next: (game) => {
        this.game = game;
        this.currentQuestion = game.questions[0];
        this.timeRemaining = game.timeLimit;
        this.startTime = Date.now();
        this.startTimer();
      },
      error: (error) => {
        console.error('Error loading game:', error);
        alert('حدث خطأ في تحميل الاختبار');
        this.router.navigate(['/games']);
      }
    });
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        clearInterval(this.timerInterval);
        this.submitTest();
      }
    }, 60000); // Every minute
  }

  getOptions(optionsJson?: string): string[] {
    if (!optionsJson) return [];
    try {
      return JSON.parse(optionsJson);
    } catch {
      return [];
    }
  }

  selectAnswer(answer: string) {
    this.answers[this.currentQuestion!.questionId] = answer;
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.game!.questions.length - 1) {
      this.currentQuestionIndex++;
      this.currentQuestion = this.game!.questions[this.currentQuestionIndex];
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.currentQuestion = this.game!.questions[this.currentQuestionIndex];
    }
  }

  get progress(): number {
    return Math.round(((this.currentQuestionIndex + 1) / this.game!.questions.length) * 100);
  }

  submitTest() {
    clearInterval(this.timerInterval);

    const timeSpent = Math.round((Date.now() - this.startTime) / 60000); // Minutes
    const studentId = Number(sessionStorage.getItem('currentStudentId'));

    const testAnswers: TestAnswer[] = Object.keys(this.answers).map(questionId => ({
      questionId: Number(questionId),
      answer: this.answers[Number(questionId)]
    }));

    const submitData: SubmitTestDto = {
      studentId,
      gameId: this.game!.id,
      timeSpent,
      answers: testAnswers
    };

    this.apiService.submitTest(submitData).subscribe({
      next: (result) => {
        sessionStorage.setItem('lastTestResult', JSON.stringify(result));
        this.router.navigate(['/result', result.id]);
      },
      error: (error) => {
        console.error('Error submitting test:', error);
        alert('حدث خطأ في إرسال الاختبار');
      }
    });
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}
