import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { FlipCardGameService } from '../../services/flip-card-game.service';
import {
  StartFlipCardGameDto,
  GameStartResponseDto,
  GameCardDto,
  FlipCardGameMode,
  FlipCardContentType,
  FlipCardTimerMode
} from '../../models/flip-card.model';

interface CardViewModel extends GameCardDto {
  isFlipped: boolean;
  isMatched: boolean;
  shake: boolean;
  celebrate: boolean;
  displayContent: string;
}

@Component({
  selector: 'app-flip-cards-game',
  standalone: true,
  imports: [CommonModule, DragDropModule, RouterModule],
  templateUrl: './flip-cards-game.component.html',
  styleUrls: ['./flip-cards-game.component.css']
})
export class FlipCardsGameComponent implements OnInit, OnDestroy {
  // Game Data
  gameData: GameStartResponseDto | null = null;
  cards: CardViewModel[] = [];
  leftCards: CardViewModel[] = [];
  rightCards: CardViewModel[] = [];

  // State
  isLoading = true;
  gameState: 'start' | 'playing' | 'complete' = 'start';
  currentFlipped: CardViewModel[] = [];
  isProcessing = false;

  // Stats
  matchedPairs = 0;
  totalPairs = 0;
  moves = 0;
  score = 0;
  timerSeconds = 0;
  timerInterval: any;
  stars = 0;

  // Enums
  FlipCardGameMode = FlipCardGameMode;
  FlipCardContentType = FlipCardContentType;

  get questionDropIds(): string[] {
    return this.rightCards.map(c => 'question-' + c.id);
  }

  constructor(
    private gameService: FlipCardGameService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.startGame(+id);
      } else {
        // No ID provided in route - start with grade/subject from sessionStorage
        this.startGameByGradeSubject();
      }
    });
  }

  startGameByGradeSubject(): void {
    this.isLoading = true;

    // Read grade and subject from sessionStorage (like Matching/DragDrop games)
    const gradeId = parseInt(sessionStorage.getItem('selectedGrade') || '3');
    const subjectMap: any = { 'arabic': 1, 'math': 2, 'science': 3, 'islamic': 4, 'english': 5 };
    const subjectStr = sessionStorage.getItem('selectedSubject') || 'science';
    const subjectId = subjectMap[subjectStr] || 3;

    const dto: StartFlipCardGameDto = {
      studentId: 1,
      gradeId: gradeId,
      subjectId: subjectId
      // questionId not set - backend will return random question
    };

    this.gameService.startSession(dto).subscribe({
      next: (data) => {
        this.gameData = data;
        this.totalPairs = data.totalPairs;
        this.initGameModes(data);
        this.startTimer();
        this.gameState = 'playing';
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to start game - no questions available', err);
        this.isLoading = false;
        // Stay on start screen, could show error message
      }
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  startGame(questionId: number): void {
    this.isLoading = true;
    const gradeId = parseInt(sessionStorage.getItem('selectedGrade') || '3');
    const subjectMap: any = { 'arabic': 1, 'math': 2, 'science': 3, 'islamic': 4, 'english': 5 };
    const subjectStr = sessionStorage.getItem('selectedSubject') || 'science';
    const subjectId = subjectMap[subjectStr] || 3;

    const dto: StartFlipCardGameDto = {
      studentId: 1,
      gradeId: gradeId,
      subjectId: subjectId,
      questionId: questionId
    };

    this.gameService.startSession(dto).subscribe({
      next: (data) => {
        this.gameData = data;
        this.totalPairs = data.totalPairs;
        this.initGameModes(data);
        this.startTimer();
        this.gameState = 'playing';
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to start game', err);
        this.isLoading = false;
      }
    });
  }



  private initGameModes(data: GameStartResponseDto): void {
    const allCards = data.question.cards.map(c => ({
      ...c,
      isFlipped: data.gameMode === FlipCardGameMode.Match,
      isMatched: false,
      shake: false,
      celebrate: false,
      displayContent: c.type === FlipCardContentType.Image ? (c.imageUrl || '') : c.text
    }));

    if (data.gameMode === FlipCardGameMode.Classic) {
      this.cards = allCards.map(c => ({ ...c, isFlipped: false }));
    } else {
      this.rightCards = allCards.filter(c => c.cardNumber === 1);
      this.leftCards = allCards.filter(c => c.cardNumber === 2);

      this.rightCards.forEach(c => c.isFlipped = true);
      this.leftCards.forEach(c => c.isFlipped = true);
    }
  }

  // ========== CLASSIC MODE LOGIC ==========
  flipCard(card: CardViewModel): void {
    if (this.isProcessing || card.isFlipped || card.isMatched) return;
    if (this.gameData?.gameMode !== FlipCardGameMode.Classic) return;

    card.isFlipped = true;
    this.currentFlipped.push(card);

    if (this.currentFlipped.length === 2) {
      this.checkMatch();
    }
  }

  private checkMatch(): void {
    this.isProcessing = true;
    this.moves++;

    const card1 = this.currentFlipped[0];
    const card2 = this.currentFlipped[1];

    // Check if cards match by comparing pairId
    const isMatch = card1.pairId === card2.pairId;

    if (isMatch) {
      // Correct match - call recordMatch API
      this.gameService.recordMatch({
        sessionId: this.gameData!.id,
        pairId: card1.pairId,
        card1FlippedAtMs: Date.now(),
        card2FlippedAtMs: Date.now() + 100,
        attemptsBeforeMatch: this.moves,
        hintUsed: false
      }).subscribe({
        next: (result) => {
          card1.isMatched = true;
          card2.isMatched = true;
          card1.celebrate = true;
          card2.celebrate = true;
          this.matchedPairs++;
          this.score = result.totalScore;

          this.currentFlipped = [];
          this.isProcessing = false;

          if (this.matchedPairs >= this.totalPairs) {
            this.finishGame();
          }
        },
        error: (err) => {
          console.error('Error recording match', err);
          this.currentFlipped = [];
          this.isProcessing = false;
        }
      });
    } else {
      // Wrong match - call recordWrongMatch API and reset cards
      this.gameService.recordWrongMatch({
        sessionId: this.gameData!.id,
        card1Id: card1.id,
        card2Id: card2.id
      }).subscribe({
        next: () => {
          card1.shake = true;
          card2.shake = true;
          setTimeout(() => {
            card1.isFlipped = false;
            card2.isFlipped = false;
            card1.shake = false;
            card2.shake = false;
            this.currentFlipped = [];
            this.isProcessing = false;
          }, 1000);
        },
        error: (err) => {
          console.error('Error recording wrong match', err);
          // Still reset cards even on error
          card1.shake = true;
          card2.shake = true;
          setTimeout(() => {
            card1.isFlipped = false;
            card2.isFlipped = false;
            card1.shake = false;
            card2.shake = false;
            this.currentFlipped = [];
            this.isProcessing = false;
          }, 1000);
        }
      });
    }
  }

  // ========== MATCH MODE LOGIC ==========
  onDrop(event: CdkDragDrop<CardViewModel[]> | any, targetCard: CardViewModel): void {
    const sourceCard: CardViewModel = event.item.data;
    this.moves++;

    if (sourceCard.pairId === targetCard.pairId) {
      // Correct match - call recordMatch API
      this.gameService.recordMatch({
        sessionId: this.gameData!.id,
        pairId: sourceCard.pairId,
        card1FlippedAtMs: Date.now(),
        card2FlippedAtMs: Date.now() + 100,
        attemptsBeforeMatch: this.moves,
        hintUsed: false
      }).subscribe({
        next: (result) => {
          sourceCard.isMatched = true;
          targetCard.isMatched = true;
          targetCard.celebrate = true;
          this.matchedPairs++;
          this.score = result.totalScore;

          if (this.matchedPairs >= this.totalPairs) {
            this.finishGame();
          }
        },
        error: (err) => {
          console.error('Error recording match', err);
        }
      });
    } else {
      // Wrong match - call recordWrongMatch API
      this.gameService.recordWrongMatch({
        sessionId: this.gameData!.id,
        card1Id: sourceCard.id,
        card2Id: targetCard.id
      }).subscribe({
        next: () => {
          targetCard.shake = true;
          setTimeout(() => targetCard.shake = false, 500);
        },
        error: (err) => {
          console.error('Error recording wrong match', err);
          targetCard.shake = true;
          setTimeout(() => targetCard.shake = false, 500);
        }
      });
    }
  }

  // ========== TIMER & UTILS ==========
  startTimer(): void {
    this.timerSeconds = 0;
    // Always start timer for time tracking
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  finishGame(): void {
    this.gameState = 'complete';
    this.stopTimer();
    this.stars = 3;

    this.gameService.completeSession(this.gameData!.id).subscribe(res => {
      this.score = res.finalScore;
      this.stars = res.starRating;
    });
  }

  playAgain(): void {
    window.location.reload();
  }

  exit(): void {
    this.router.navigate(['/']);
  }
}
