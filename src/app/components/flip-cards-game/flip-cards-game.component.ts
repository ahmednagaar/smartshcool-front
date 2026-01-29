import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ApiService } from '../../services/api.service';
import { AudioService } from '../../services/audio.service';

interface GameQuestion {
  id: string;
  questionText: string;
  answerText: string;
  pairId: number;
}

interface CardState {
  id: string;
  pairId: number;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
  shake?: boolean;
  celebrate?: boolean;
}

@Component({
  selector: 'app-flip-cards-game',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  template: `
    <!-- Main Game Container -->
    <div class="game-container" dir="rtl" cdkDropListGroup>
      
      <!-- Decorative Sparkles Background -->
      <div class="sparkles-bg"></div>
      
      <!-- Header Section -->
      <header class="game-header">
        <h1 class="game-title">لعبة مطابقة البطاقات</h1>
        
        <!-- Progress Bar -->
        <div class="progress-container">
          <div class="progress-bar" [style.width.%]="(matchedPairs / totalPairs) * 100"></div>
        </div>
        
        <!-- Star Ratings -->
        <div class="star-ratings">
          <span *ngFor="let star of [0,1,2,3]" 
                class="star"
                [class.active]="star < matchedPairs"
                role="img"
                [attr.aria-label]="star < matchedPairs ? 'نجمة مضيئة' : 'نجمة فارغة'">
            ★
          </span>
        </div>
      </header>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-state">
        <div class="loading-spinner">🎮</div>
        <p>جاري تحميل اللعبة...</p>
      </div>

      <!-- Start Screen -->
      <div *ngIf="!isLoading && gameState === 'start'" class="start-screen">
        <div class="start-card">
          <div class="start-icon">🧠</div>
          <h2>هل أنت مستعد؟</h2>
          <p>طابق الإجابات بالأسئلة الصحيحة</p>
          <button class="start-button" (click)="startGame()" role="button" aria-label="ابدأ اللعبة">
            ابدأ اللعب! 🚀
          </button>
        </div>
      </div>

      <!-- Game Grid -->
      <div *ngIf="gameState === 'playing' || gameState === 'complete'" class="game-grid">
        
        <!-- LEFT SECTION: Answer Cards -->
        <section class="game-section answers-section" aria-label="قسم الإجابات">
          <h2 class="section-title">الإجابات</h2>
          
          <div class="cards-container"
               cdkDropList
               id="answers-list"
               #answersList="cdkDropList"
               [cdkDropListData]="answerCards"
               [cdkDropListConnectedTo]="questionDropIds"
               [cdkDropListSortingDisabled]="true">
            
            <ng-container *ngFor="let card of answerCards; let i = index">
              <div *ngIf="!card.isMatched" class="card-wrapper">
                <div cdkDrag
                     [cdkDragData]="card"
                     [cdkDragDisabled]="!card.isFlipped"
                     (cdkDragStarted)="onDragStarted(card)"
                     (click)="flipAnswerCard(card)"
                     class="flip-card answer-card"
                     [class.flipped]="card.isFlipped"
                     [class.draggable]="card.isFlipped"
                     role="button"
                     tabindex="0"
                     [attr.aria-label]="'بطاقة إجابة رقم ' + (i + 1)"
                     [attr.aria-pressed]="card.isFlipped"
                     (keydown.enter)="flipAnswerCard(card)">
                  
                  <!-- Drag Preview -->
                  <div *cdkDragPreview class="drag-preview">
                    <span class="drag-icon">💡</span>
                    <span>{{ card.content }}</span>
                  </div>
                  
                  <!-- Placeholder -->
                  <div *cdkDragPlaceholder class="card-placeholder"></div>
                  
                  <div class="flip-card-inner">
                    <!-- Front (Hidden) -->
                    <div class="flip-card-front">
                      <span class="card-symbol">?</span>
                    </div>
                    
                    <!-- Back (Content) -->
                    <div class="flip-card-back">
                      <div class="card-icon">💡</div>
                      <p class="card-content">{{ card.content }}</p>
                      <span class="drag-hint">اسحبني!</span>
                    </div>
                  </div>
                </div>
              </div>
            </ng-container>
          </div>
        </section>

        <!-- CENTER DIVIDER -->
        <div class="center-divider">
          <div class="divider-line"></div>
        </div>

        <!-- RIGHT SECTION: Question Cards -->
        <section class="game-section questions-section" aria-label="قسم الأسئلة">
          <h2 class="section-title">الأسئلة</h2>
          
          <div class="cards-container questions-grid">
            <ng-container *ngFor="let card of questionCards; let i = index">
              <div class="card-wrapper"
                   cdkDropList
                   [id]="'question-' + card.id"
                   [cdkDropListData]="card"
                   [cdkDropListConnectedTo]="['answers-list']"
                   (cdkDropListDropped)="onDrop($event, card)"
                   [cdkDropListDisabled]="card.isMatched">
                
                <div (click)="flipQuestionCard(card)"
                     class="flip-card question-card"
                     [class.flipped]="card.isFlipped"
                     [class.matched]="card.isMatched"
                     [class.drop-zone]="card.isFlipped && !card.isMatched"
                     [class.shake]="card.shake"
                     [class.celebrate]="card.celebrate"
                     role="button"
                     tabindex="0"
                     [attr.aria-label]="'بطاقة سؤال رقم ' + (i + 1)"
                     [attr.aria-pressed]="card.isFlipped"
                     (keydown.enter)="flipQuestionCard(card)">
                  
                  <div class="flip-card-inner">
                    <!-- Front (Hidden) -->
                    <div class="flip-card-front question-front">
                      <span class="card-symbol">?</span>
                    </div>
                    
                    <!-- Back (Content) -->
                    <div class="flip-card-back question-back">
                      <p class="card-content">{{ card.content }}</p>
                      <span *ngIf="!card.isMatched" class="drop-hint">أسقط الإجابة هنا</span>
                      <span *ngIf="card.isMatched" class="match-badge">✓</span>
                    </div>
                  </div>
                </div>
              </div>
            </ng-container>
          </div>
        </section>
      </div>

      <!-- Victory Modal -->
      <div *ngIf="gameState === 'complete'" class="victory-overlay" role="dialog" aria-labelledby="victory-title">
        <div class="victory-modal">
          <div class="victory-icon">🏆</div>
          <h2 id="victory-title">أحسنت!</h2>
          <p>أكملت جميع المطابقات بنجاح!</p>
          
          <div class="stats">
            <div class="stat">
              <span class="stat-value">{{ moves }}</span>
              <span class="stat-label">حركة</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ timer }}s</span>
              <span class="stat-label">ثانية</span>
            </div>
          </div>
          
          <button class="replay-button" (click)="playAgain()" aria-label="إعادة اللعب">
            العب مرة أخرى 🔄
          </button>
          <button class="exit-button" (click)="finishGame()" aria-label="خروج">
            خروج
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ========== MAIN CONTAINER ========== */
    .game-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #2D1B3D 0%, #4A2E6B 100%);
      padding: 20px;
      font-family: 'Arial', sans-serif;
      position: relative;
      overflow: hidden;
    }

    /* Decorative Sparkles */
    .sparkles-bg {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: 
        radial-gradient(2px 2px at 20px 30px, #00D9FF, transparent),
        radial-gradient(2px 2px at 60px 70px, #00D9FF, transparent),
        radial-gradient(1px 1px at 50px 50px, #00D9FF, transparent),
        radial-gradient(2px 2px at 150px 100px, #00D9FF, transparent),
        radial-gradient(1px 1px at 200px 200px, #00D9FF, transparent);
      background-repeat: repeat;
      background-size: 250px 250px;
      pointer-events: none;
      z-index: 0;
      opacity: 0.4;
      animation: twinkle 3s ease-in-out infinite alternate;
    }

    @keyframes twinkle {
      0% { opacity: 0.3; }
      100% { opacity: 0.6; }
    }

    /* ========== HEADER ========== */
    .game-header {
      text-align: center;
      margin-bottom: 30px;
      position: relative;
      z-index: 1;
    }

    .game-title {
      color: #FFFFFF;
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 15px;
      text-shadow: 0 2px 10px rgba(0, 217, 255, 0.3);
    }

    .progress-container {
      width: 100%;
      max-width: 400px;
      margin: 0 auto 15px;
      background: rgba(107, 45, 142, 0.5);
      height: 10px;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid rgba(0, 217, 255, 0.3);
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #00D9FF, #00FF88);
      transition: width 0.5s ease;
      box-shadow: 0 0 15px rgba(0, 217, 255, 0.5);
    }

    .star-ratings {
      display: flex;
      justify-content: center;
      gap: 8px;
    }

    .star {
      font-size: 28px;
      color: rgba(255, 255, 255, 0.3);
      transition: all 0.3s ease;
    }

    .star.active {
      color: #FFD700;
      text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
      animation: starPop 0.3s ease;
    }

    @keyframes starPop {
      0% { transform: scale(1); }
      50% { transform: scale(1.3); }
      100% { transform: scale(1); }
    }

    /* ========== LOADING & START ========== */
    .loading-state, .start-screen {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
      position: relative;
      z-index: 1;
    }

    .loading-spinner {
      font-size: 60px;
      animation: bounce 0.6s ease infinite alternate;
    }

    @keyframes bounce {
      0% { transform: translateY(0); }
      100% { transform: translateY(-15px); }
    }

    .loading-state p {
      color: #FFFFFF;
      font-size: 18px;
      margin-top: 15px;
    }

    .start-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      padding: 40px;
      text-align: center;
      border: 1px solid rgba(0, 217, 255, 0.3);
      max-width: 400px;
    }

    .start-icon {
      font-size: 60px;
      margin-bottom: 20px;
    }

    .start-card h2 {
      color: #FFFFFF;
      font-size: 28px;
      margin-bottom: 10px;
    }

    .start-card p {
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 25px;
    }

    .start-button {
      width: 100%;
      background: linear-gradient(135deg, #00D9FF, #00B8D4);
      color: #FFFFFF;
      border: none;
      padding: 16px 32px;
      font-size: 20px;
      font-weight: bold;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(0, 217, 255, 0.4);
    }

    .start-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 25px rgba(0, 217, 255, 0.5);
    }

    /* ========== GAME GRID ========== */
    .game-grid {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 20px;
      max-width: 1200px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }

    .game-section {
      padding: 20px;
    }

    .section-title {
      color: #FFFFFF;
      font-size: 22px;
      text-align: center;
      margin-bottom: 20px;
      font-weight: bold;
    }

    .cards-container {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .card-wrapper {
      position: relative;
    }

    /* ========== CENTER DIVIDER ========== */
    .center-divider {
      display: flex;
      justify-content: center;
      padding: 20px 0;
    }

    .divider-line {
      width: 3px;
      height: 100%;
      min-height: 400px;
      background: linear-gradient(180deg, transparent 0%, #00D9FF 20%, #00D9FF 80%, transparent 100%);
      border-radius: 3px;
      box-shadow: 0 0 20px rgba(0, 217, 255, 0.6), 0 0 40px rgba(0, 217, 255, 0.3);
    }

    /* ========== FLIP CARDS ========== */
    .flip-card {
      width: 100%;
      height: 100px;
      perspective: 1000px;
      cursor: pointer;
      position: relative;
    }

    .flip-card-inner {
      position: relative;
      width: 100%;
      height: 100%;
      transition: transform 0.6s;
      transform-style: preserve-3d;
    }

    .flip-card.flipped .flip-card-inner {
      transform: rotateY(180deg);
    }

    .flip-card-front, .flip-card-back {
      position: absolute;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px;
      text-align: center;
    }

    /* Answer Card Styles */
    .answer-card .flip-card-front {
      background: rgba(139, 91, 166, 0.4);
      border: 2px solid #00D9FF;
      box-shadow: 0 0 15px rgba(0, 217, 255, 0.2);
    }

    .answer-card .flip-card-back {
      background: #FFFFFF;
      border: 2px solid #00D9FF;
      transform: rotateY(180deg);
    }

    .answer-card.draggable {
      cursor: grab;
    }

    .answer-card.draggable:active {
      cursor: grabbing;
    }

    /* Question Card Styles */
    .question-card .flip-card-front {
      background: rgba(139, 91, 166, 0.4);
      border: 2px solid rgba(255, 255, 255, 0.5);
    }

    .question-card .flip-card-back {
      background: #FFFFFF;
      border: 2px solid rgba(255, 255, 255, 0.8);
      transform: rotateY(180deg);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .question-card.drop-zone .flip-card-back {
      border: 3px dashed #00D9FF;
      background: rgba(0, 217, 255, 0.1);
    }

    .question-card.matched .flip-card-back {
      border-color: #00FF00;
      background: rgba(0, 255, 0, 0.1);
      box-shadow: 0 0 25px rgba(0, 255, 0, 0.3);
    }

    /* Card Content */
    .card-symbol {
      font-size: 40px;
      color: rgba(255, 255, 255, 0.5);
      font-weight: bold;
    }

    .card-icon {
      font-size: 20px;
      margin-bottom: 5px;
    }

    .card-content {
      color: #1A0F2E;
      font-size: 16px;
      font-weight: 600;
      line-height: 1.3;
      margin: 0;
    }

    .drag-hint {
      font-size: 11px;
      color: #00D9FF;
      font-weight: bold;
      margin-top: 6px;
      animation: pulse 1.5s ease infinite;
    }

    .drop-hint {
      font-size: 11px;
      color: #00D9FF;
      margin-top: 8px;
      border: 1px dashed #00D9FF;
      padding: 4px 10px;
      border-radius: 8px;
    }

    .match-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      background: #00FF00;
      color: #FFFFFF;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 2px 10px rgba(0, 255, 0, 0.5);
      animation: popIn 0.3s ease;
    }

    @keyframes popIn {
      0% { transform: scale(0); }
      70% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* Drag Preview */
    .drag-preview {
      display: flex;
      align-items: center;
      gap: 10px;
      background: linear-gradient(135deg, #00D9FF, #00B8D4);
      color: #FFFFFF;
      padding: 12px 20px;
      border-radius: 12px;
      font-weight: bold;
      font-size: 14px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      transform: rotate(3deg);
    }

    .drag-icon {
      font-size: 18px;
    }

    .card-placeholder {
      height: 100px;
      background: rgba(0, 217, 255, 0.1);
      border: 2px dashed rgba(0, 217, 255, 0.5);
      border-radius: 16px;
    }

    /* Animations */
    .flip-card.shake .flip-card-inner {
      animation: shake 0.4s ease;
    }

    @keyframes shake {
      0%, 100% { transform: rotateY(180deg) translateX(0); }
      25% { transform: rotateY(180deg) translateX(-8px); }
      75% { transform: rotateY(180deg) translateX(8px); }
    }

    .flip-card.celebrate .flip-card-inner {
      animation: celebrate 0.6s ease;
    }

    @keyframes celebrate {
      0% { transform: rotateY(180deg) scale(1); }
      50% { transform: rotateY(180deg) scale(1.08); box-shadow: 0 0 40px rgba(0, 255, 0, 0.6); }
      100% { transform: rotateY(180deg) scale(1); }
    }

    /* ========== VICTORY MODAL ========== */
    .victory-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(5px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 100;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .victory-modal {
      background: linear-gradient(135deg, #4A2E6B 0%, #6B2D8E 100%);
      border-radius: 24px;
      padding: 40px;
      text-align: center;
      max-width: 400px;
      width: 90%;
      border: 2px solid rgba(0, 217, 255, 0.3);
      animation: bounceIn 0.5s ease;
    }

    @keyframes bounceIn {
      0% { transform: scale(0.5); opacity: 0; }
      60% { transform: scale(1.05); opacity: 1; }
      100% { transform: scale(1); }
    }

    .victory-icon {
      font-size: 70px;
      margin-bottom: 15px;
      animation: bounce 0.6s ease infinite alternate;
    }

    .victory-modal h2 {
      color: #FFFFFF;
      font-size: 32px;
      margin-bottom: 10px;
    }

    .victory-modal p {
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 25px;
    }

    .stats {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-bottom: 25px;
    }

    .stat {
      background: rgba(255, 255, 255, 0.1);
      padding: 15px 25px;
      border-radius: 12px;
    }

    .stat-value {
      display: block;
      font-size: 24px;
      font-weight: bold;
      color: #00D9FF;
    }

    .stat-label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
    }

    .replay-button {
      width: 100%;
      background: linear-gradient(135deg, #00D9FF, #00B8D4);
      color: #FFFFFF;
      border: none;
      padding: 14px;
      font-size: 18px;
      font-weight: bold;
      border-radius: 12px;
      cursor: pointer;
      margin-bottom: 12px;
      transition: all 0.3s ease;
    }

    .replay-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(0, 217, 255, 0.4);
    }

    .exit-button {
      width: 100%;
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
      border: none;
      padding: 12px;
      font-size: 16px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .exit-button:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* ========== CDK DRAG ========== */
    .cdk-drag-animating {
      transition: transform 250ms ease-out;
    }

    /* ========== RESPONSIVE ========== */
    @media (max-width: 768px) {
      .game-grid {
        grid-template-columns: 1fr;
        gap: 15px;
      }

      .center-divider {
        display: none;
      }

      .cards-container {
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
      }

      .card-wrapper {
        width: calc(33.33% - 10px);
      }

      .flip-card {
        height: 80px;
      }

      .card-content {
        font-size: 12px;
      }
    }
  `]
})
export class FlipCardsGameComponent implements OnInit, OnDestroy {
  questionCards: CardState[] = [];
  answerCards: CardState[] = [];

  matchedPairs = 0;
  totalPairs = 4;
  moves = 0;
  timer = 0;
  timerInterval: any;

  gameState: 'start' | 'playing' | 'complete' = 'start';
  isLoading = false;

  questionsPool: GameQuestion[] = [];
  cardTimeouts: Map<string, any> = new Map();

  get questionDropIds(): string[] {
    return this.questionCards.map(c => 'question-' + c.id);
  }

  constructor(
    private router: Router,
    private api: ApiService,
    private audio: AudioService
  ) { }

  ngOnInit(): void {
    this.loadGameQuestions();
  }

  loadGameQuestions(): void {
    this.isLoading = true;
    const grade = parseInt(sessionStorage.getItem('selectedGrade') || '3');
    const subjectStr = sessionStorage.getItem('selectedSubject') || 'arabic';
    const subjectMap: { [key: string]: number } = { 'arabic': 1, 'math': 2, 'science': 3 };
    const subjectId = subjectMap[subjectStr];

    this.api.searchQuestions(grade, subjectId, 1, 30).subscribe({
      next: (response: any) => {
        const items = response.items || [];
        this.questionsPool = items.length > 0
          ? items.map((q: any, i: number) => ({
            id: q.id || String(i),
            questionText: q.text,
            answerText: q.correctAnswer,
            pairId: i
          }))
          : this.getMockQuestions();
        this.isLoading = false;
      },
      error: () => {
        this.questionsPool = this.getMockQuestions();
        this.isLoading = false;
      }
    });
  }

  getMockQuestions(): GameQuestion[] {
    return [
      { id: '1', questionText: 'ما عاصمة السعودية؟', answerText: 'الرياض', pairId: 0 },
      { id: '2', questionText: 'كم يساوي 5 + 7؟', answerText: '12', pairId: 1 },
      { id: '3', questionText: 'ما لون السماء؟', answerText: 'أزرق', pairId: 2 },
      { id: '4', questionText: 'ماذا يسمى صوت الأسد؟', answerText: 'زئير', pairId: 3 },
    ];
  }

  initializeCardStates(): void {
    // Use only unique questions - don't duplicate!
    let availableQuestions = [...this.questionsPool];

    // If we have less than 2 questions from API, use mock data
    if (availableQuestions.length < 2) {
      console.log('Not enough questions from API, using mock data');
      availableQuestions = this.getMockQuestions();
    }

    // Shuffle and take up to 4 unique questions
    const selection = this.shuffleArray(availableQuestions).slice(0, Math.min(4, availableQuestions.length));
    const numPairs = selection.length;

    console.log('Game initialized with', numPairs, 'unique pairs');

    this.questionCards = selection.map((q, i) => ({
      id: String(i),
      pairId: i,
      content: q.questionText,
      isFlipped: false,
      isMatched: false
    }));

    this.answerCards = this.shuffleArray(selection.map((q, i) => ({
      id: String(i + 10),
      pairId: i,
      content: q.answerText,
      isFlipped: false,
      isMatched: false
    })));

    this.totalPairs = numPairs;
  }

  startGame(): void {
    this.audio.playClick();
    this.initializeCardStates();
    this.gameState = 'playing';
    this.matchedPairs = 0;
    this.moves = 0;
    this.timer = 0;
    this.startTimer();
  }

  flipQuestionCard(card: CardState): void {
    if (card.isMatched || card.isFlipped) return;
    this.audio.playClick();
    card.isFlipped = true;
  }

  flipAnswerCard(card: CardState): void {
    if (card.isMatched || card.isFlipped) return;
    this.audio.playClick();
    card.isFlipped = true;
    // Cards now stay flipped until matched or wrong match
  }

  onDragStarted(card: CardState): void {
    // Optional: Add specific logic when drag starts if needed
  }

  onDrop(event: CdkDragDrop<CardState>, targetQuestion: CardState): void {
    if (targetQuestion.isMatched) return;

    // Auto-flip question if not already flipped
    if (!targetQuestion.isFlipped) {
      targetQuestion.isFlipped = true;
    }

    const draggedAnswer = event.item.data as CardState;
    this.moves++;

    if (draggedAnswer.pairId === targetQuestion.pairId) {
      // Correct match!
      this.audio.playCorrect();
      this.celebrateMatch(draggedAnswer, targetQuestion);
    } else {
      // Wrong match
      this.audio.playWrong();
      this.rejectMatch(draggedAnswer, targetQuestion);
    }
  }

  celebrateMatch(answer: CardState, question: CardState): void {
    answer.isMatched = true;
    question.isMatched = true;
    question.celebrate = true;
    this.matchedPairs++;

    setTimeout(() => question.celebrate = false, 600);

    if (this.matchedPairs === this.totalPairs) {
      this.completeGame();
    }
  }

  rejectMatch(answer: CardState, question: CardState): void {
    question.shake = true;
    setTimeout(() => question.shake = false, 400);
  }

  completeGame(): void {
    this.stopTimer();
    setTimeout(() => {
      this.audio.playComplete();
      this.gameState = 'complete';
    }, 700);
  }

  startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => this.timer++, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  playAgain(): void {
    this.audio.playClick();
    this.startGame();
  }

  finishGame(): void {
    sessionStorage.setItem('quizScore', this.matchedPairs.toString());
    sessionStorage.setItem('quizTotal', this.totalPairs.toString());
    this.router.navigate(['/result']);
  }

  goBack(): void {
    this.stopTimer();
    this.router.navigate(['/game-type']);
  }

  shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  ngOnDestroy(): void {
    this.stopTimer();
    // Clear all card timeouts
    this.cardTimeouts.forEach(timeout => clearTimeout(timeout));
    this.cardTimeouts.clear();
  }
}
