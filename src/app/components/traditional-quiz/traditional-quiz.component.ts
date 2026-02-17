import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface SubQuestion {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
}

interface Question {
  id: number;
  text: string;
  type: number;
  options: string[];
  correctAnswer: string;
  image?: string;
  passageText?: string;
  estimatedTimeMinutes?: number;
  subQuestions?: SubQuestion[];
}

@Component({
  selector: 'app-traditional-quiz',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './traditional-quiz.component.html',
  styleUrls: ['./traditional-quiz.component.css']
})
export class TraditionalQuizComponent implements OnInit {
  questions: Question[] = [];
  currentQuestionIndex = 0;
  score = 0;
  answered = false;
  selectedAnswer = '';
  isCorrect = false;
  loading = true;
  showCelebration = false;
  feedbackMessage = '';
  feedbackEmoji = '';

  // Passage state
  currentSubQuestionIndex = 0;
  subQuestionAnswers: Map<number, { answer: string; correct: boolean }> = new Map();

  constructor(
    private router: Router,
    private api: ApiService
  ) { }

  get currentQuestion(): Question | null {
    return this.questions[this.currentQuestionIndex] || null;
  }

  get isPassageQuestion(): boolean {
    return this.currentQuestion?.type === 6;
  }

  get currentSubQuestion(): SubQuestion | null {
    if (!this.isPassageQuestion || !this.currentQuestion?.subQuestions) return null;
    return this.currentQuestion.subQuestions[this.currentSubQuestionIndex] || null;
  }

  get totalSubQuestions(): number {
    return this.currentQuestion?.subQuestions?.length || 0;
  }

  get totalQuestionCount(): number {
    let count = 0;
    for (const q of this.questions) {
      if (q.type === 6 && q.subQuestions) {
        count += q.subQuestions.length;
      } else {
        count++;
      }
    }
    return count;
  }

  get answeredCount(): number {
    let count = 0;
    for (let i = 0; i < this.currentQuestionIndex; i++) {
      const q = this.questions[i];
      if (q.type === 6 && q.subQuestions) {
        count += q.subQuestions.length;
      } else {
        count++;
      }
    }
    // Add current passage answered subs
    if (this.isPassageQuestion) {
      count += this.currentSubQuestionIndex;
      if (this.answered) count++;
    } else {
      if (this.answered) count++;
    }
    return count;
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
        const questionsList = Array.isArray(response) ? response : (response.data || response.items || []);

        this.questions = questionsList.map((q: any) => {
          const mapped: Question = {
            id: q.id,
            text: q.text,
            type: q.type || 1,
            options: q.type === 6 ? [] : (typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || [])),
            correctAnswer: q.correctAnswer || '',
            image: q.mediaUrl,
            passageText: q.passageText,
            estimatedTimeMinutes: q.estimatedTimeMinutes
          };

          // Map sub-questions for passage type
          if (q.type === 6 && q.subQuestions && Array.isArray(q.subQuestions)) {
            mapped.subQuestions = q.subQuestions.map((sq: any) => ({
              id: sq.id,
              text: sq.text,
              options: typeof sq.options === 'string' ? JSON.parse(sq.options) : (sq.options || []),
              correctAnswer: sq.correctAnswer
            }));
          }

          return mapped;
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load questions', err);
        this.loading = false;
      }
    });
  }

  getOptionLabel(index: number): string {
    return ['أ', 'ب', 'ج', 'د', 'هـ', 'و'][index] || '';
  }

  selectAnswer(answer: string) {
    if (this.answered) return;

    this.selectedAnswer = answer;
    this.answered = true;

    if (this.isPassageQuestion && this.currentSubQuestion) {
      this.isCorrect = answer === this.currentSubQuestion.correctAnswer;
      // Store sub-question answer
      this.subQuestionAnswers.set(this.currentSubQuestionIndex, {
        answer,
        correct: this.isCorrect
      });
    } else {
      this.isCorrect = answer === this.currentQuestion?.correctAnswer;
    }

    if (this.isCorrect) {
      this.score++;
      this.triggerCelebration();
    }
  }

  triggerCelebration() {
    const messages = ['ممتاز!', 'أنت بطل! 🏆', 'إجابة رائعة!', 'ذكاء خارق! 🧠', 'استمر يا بطل!'];
    const emojis = ['🌟', '👏', '🎉', '🚀', '💎'];

    this.feedbackMessage = messages[Math.floor(Math.random() * messages.length)];
    this.feedbackEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    this.showCelebration = true;
  }

  get currentCorrectAnswer(): string {
    if (this.isPassageQuestion && this.currentSubQuestion) {
      return this.currentSubQuestion.correctAnswer;
    }
    return this.currentQuestion?.correctAnswer || '';
  }

  get isLastQuestion(): boolean {
    if (this.isPassageQuestion) {
      // Last sub-question of last question
      return this.currentQuestionIndex >= this.questions.length - 1
        && this.currentSubQuestionIndex >= this.totalSubQuestions - 1;
    }
    return this.currentQuestionIndex >= this.questions.length - 1;
  }

  nextQuestion() {
    this.showCelebration = false;

    if (this.isPassageQuestion && this.currentSubQuestionIndex < this.totalSubQuestions - 1) {
      // Next sub-question
      this.currentSubQuestionIndex++;
      this.answered = false;
      this.selectedAnswer = '';
      this.isCorrect = false;
    } else if (this.currentQuestionIndex < this.questions.length - 1) {
      // Next main question
      this.currentQuestionIndex++;
      this.currentSubQuestionIndex = 0;
      this.subQuestionAnswers.clear();
      this.answered = false;
      this.selectedAnswer = '';
      this.isCorrect = false;
    } else {
      // Quiz finished
      sessionStorage.setItem('quizScore', this.score.toString());
      sessionStorage.setItem('quizTotal', this.totalQuestionCount.toString());
      this.router.navigate(['/result']);
    }
  }

  exitQuiz() {
    if (confirm('هل أنت متأكد من الخروج؟ سيتم فقدان تقدمك.')) {
      this.router.navigate(['/training-type']);
    }
  }
}
