import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
  image?: string;
}

@Component({
  selector: 'app-traditional-quiz',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-v0-gradient min-h-screen p-4 overflow-hidden relative">
      <!-- Success/Celebration Overlay -->
      <div *ngIf="showCelebration" class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
        <div class="success-overlay pop-in p-12 text-center bg-white rounded-3xl shadow-2xl border-4 border-green-400 max-w-sm w-full mx-4">
          <div class="success-emoji text-8xl mb-6 animate-bounce">{{ feedbackEmoji }}</div>
          <h2 class="text-4xl font-black text-green-600 mb-4 font-handicrafts animate-pulse">{{ feedbackMessage }}</h2>
          <button (click)="nextQuestion()" class="btn-primary w-full text-xl py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
            {{ currentQuestionIndex < questions.length - 1 ? 'السؤال التالي ←' : 'عرض النتيجة 🏁' }}
          </button>
        </div>
        <!-- Confetti pieces (CSS driven) -->
        <div class="confetti-piece" style="left: 10%; animation-delay: 0s; background: #FFD700;"></div>
        <div class="confetti-piece" style="left: 20%; animation-delay: 0.2s; background: #FF6347;"></div>
        <div class="confetti-piece" style="left: 30%; animation-delay: 0.4s; background: #32CD32;"></div>
        <div class="confetti-piece" style="left: 50%; animation-delay: 0.1s; background: #1E90FF;"></div>
        <div class="confetti-piece" style="left: 70%; animation-delay: 0.3s; background: #FF69B4;"></div>
        <div class="confetti-piece" style="left: 85%; animation-delay: 0.5s; background: #FFA500;"></div>
      </div>

      <div class="container max-w-4xl py-8">
        <!-- Header with progress -->
        <div class="mb-8">
          <div class="flex justify-between items-center mb-4">
            <button (click)="exitQuiz()" class="btn-ghost">
              <span>✕</span>
              خروج
            </button>
            <div class="text-center">
              <span class="text-muted">السؤال</span>
              <span class="text-2xl font-bold text-foreground mx-2">{{ currentQuestionIndex + 1 }}</span>
              <span class="text-muted">من {{ questions.length }}</span>
            </div>
            <div class="text-left">
              <span class="text-muted">النتيجة:</span>
              <span class="text-2xl font-bold text-primary mx-2">{{ score }}</span>
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div class="bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              class="bg-primary h-full rounded-full transition-all duration-300"
              [style.width.%]="((currentQuestionIndex + 1) / questions.length) * 100"
            ></div>
          </div>
        </div>

        <!-- Question Card -->
        <div class="card-v0 p-8 transform transition-all duration-500" *ngIf="currentQuestion">
          <!-- Question Image (if any) -->
          <div *ngIf="currentQuestion.image" class="mb-6 text-center">
            <img 
              [src]="currentQuestion.image" 
              alt="صورة السؤال"
              class="max-w-full h-auto mx-auto rounded-lg shadow-md max-h-64 object-contain"
            />
          </div>

          <!-- Question Text -->
          <h2 class="text-2xl md:text-3xl font-bold text-foreground text-center mb-8 leading-relaxed">
            {{ currentQuestion.text }}
          </h2>

          <!-- Answer Options -->
          <div class="grid gap-4">
            <button
              *ngFor="let option of currentQuestion.options; let i = index"
              (click)="selectAnswer(option)"
              [disabled]="answered"
              class="p-6 text-xl font-bold rounded-xl border-2 transition-all text-right group relative overflow-hidden"
              [ngClass]="{
                'border-gray-200 hover:border-primary hover:bg-primary/5 hover:scale-[1.02] hover:shadow-md': !answered,
                'border-green-500 bg-green-50 text-green-700': answered && option === currentQuestion.correctAnswer,
                'border-red-500 bg-red-50 text-red-700 shake': answered && selectedAnswer === option && option !== currentQuestion.correctAnswer,
                'border-gray-200 opacity-50': answered && selectedAnswer !== option && option !== currentQuestion.correctAnswer
              }"
            >
              <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 ml-4 group-hover:bg-primary group-hover:text-white transition-colors">
                {{ getOptionLabel(i) }}
              </span>
              {{ option }}
              
              <!-- Correct/Wrong Icons -->
              <span *ngIf="answered && option === currentQuestion.correctAnswer" class="absolute left-6 top-1/2 -translate-y-1/2 text-2xl animate-pulse">✅</span>
              <span *ngIf="answered && selectedAnswer === option && option !== currentQuestion.correctAnswer" class="absolute left-6 top-1/2 -translate-y-1/2 text-2xl">❌</span>
            </button>
          </div>

          <!-- Feedback Message (Only for Wrong Answer now, Correct shows Overlay) -->
          <div *ngIf="answered && !isCorrect" class="mt-8 text-center animate-in fade-in slide-in-from-bottom-4">
            <div class="p-6 rounded-2xl bg-red-50 border-2 border-red-200 shadow-sm">
              <div class="text-4xl mb-2">💪</div>
              <h3 class="text-xl font-bold text-red-800 mb-2">لا بأس! حاول مرة أخرى</h3>
              <p class="text-red-600">الإجابة الصحيحة هي: <span class="font-bold">{{ currentQuestion.correctAnswer }}</span></p>
            </div>

            <button
              (click)="nextQuestion()"
              class="btn-primary mt-6 px-12 py-4 text-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-transform"
            >
              {{ currentQuestionIndex < questions.length - 1 ? 'السؤال التالي ←' : 'عرض النتيجة' }}
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="card-v0 p-16 text-center">
          <div class="text-6xl mb-4 animate-spin-slow">⏳</div>
          <p class="text-xl text-muted">جاري تحميل الأسئلة...</p>
        </div>
      </div>
    </div>
  `
})
export class TraditionalQuizComponent implements OnInit {
  questions: Question[] = [];
  currentQuestionIndex = 0;
  score = 0;
  answered = false;
  selectedAnswer = '';
  isCorrect = false;
  loading = true;
  showCelebration = false; // New property
  feedbackMessage = '';
  feedbackEmoji = '';

  constructor(
    private router: Router,
    private api: ApiService
  ) { }

  get currentQuestion(): Question | null {
    return this.questions[this.currentQuestionIndex] || null;
  }

  ngOnInit() {
    this.loadQuestions();
  }

  loadQuestions() {
    const gradeStr = sessionStorage.getItem('selectedGrade') || '3';
    const subjectStr = sessionStorage.getItem('selectedSubject') || '1';
    const testTypeStr = sessionStorage.getItem('testType') || '1';

    const grade = parseInt(gradeStr);
    let subject = 1;
    if (subjectStr === 'math') subject = 2;
    else if (subjectStr === 'science') subject = 3;
    else if (!isNaN(parseInt(subjectStr))) subject = parseInt(subjectStr);

    let testType = 1;
    if (testTypeStr === 'central' || testTypeStr === '2') {
      testType = 2;
    }

    console.log('Loading questions with:', { grade, subject, testType });

    this.loading = true;
    this.api.getFilteredQuestions(grade, subject, testType).subscribe({
      next: (response: any) => {
        // Handle both array and paginated response
        const questionsList = Array.isArray(response) ? response : (response.data || response.items || []);

        this.questions = questionsList.map((q: any) => ({
          id: q.id,
          text: q.text,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
          correctAnswer: q.correctAnswer,
          image: q.mediaUrl
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load questions', err);
        this.loading = false;
      }
    });
  }

  getOptionLabel(index: number): string {
    return ['أ', 'ب', 'ج', 'د'][index] || '';
  }

  selectAnswer(answer: string) {
    if (this.answered) return;

    this.selectedAnswer = answer;
    this.answered = true;
    this.isCorrect = answer === this.currentQuestion?.correctAnswer;

    if (this.isCorrect) {
      this.score++;
      this.triggerCelebration();
    } else {
      // Just show the inline feedback for wrong answer
    }
  }

  triggerCelebration() {
    // Pick random encouraging message
    const messages = ['ممتاز!', 'أنت بطل! 🏆', 'إجابة رائعة!', 'ذكاء خارق! 🧠', 'استمر يا بطل!'];
    const emojis = ['🌟', '👏', '🎉', '🚀', '💎'];

    this.feedbackMessage = messages[Math.floor(Math.random() * messages.length)];
    this.feedbackEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    this.showCelebration = true;
  }

  nextQuestion() {
    this.showCelebration = false; // Hide overlay
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.answered = false;
      this.selectedAnswer = '';
      this.isCorrect = false;
    } else {
      sessionStorage.setItem('quizScore', this.score.toString());
      sessionStorage.setItem('quizTotal', this.questions.length.toString());
      this.router.navigate(['/result']);
    }
  }

  exitQuiz() {
    if (confirm('هل أنت متأكد من الخروج؟ سيتم فقدان تقدمك.')) {
      this.router.navigate(['/training-type']);
    }
  }
}
