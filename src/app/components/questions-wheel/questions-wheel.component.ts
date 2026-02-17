import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AudioService } from '../../services/audio.service';
import { WheelGameService } from '../../services/wheel-game.service';
import { WheelSpinService } from '../../services/wheel-spin.service';
import {
    WheelQuestion,
    WheelSpinSegment,
    StartWheelGameDto,
    SpinResult
} from '../../models/wheel-game.model';
import { TestType } from '../../models/models';
import { getStudentId, getSelectedGrade, getSelectedSubject } from '../../models/shared-enums';

interface SegmentGeometry {
    id: number;
    path: string;
    textX: number;
    textY: number;
    textRotate: number;
}

// Visual representation merging Backend Data + Frontend SVG Geometry
interface VisualSegment extends WheelSpinSegment {
    path: string;
    textX: number;
    textY: number;
    textRotate: number;
}

@Component({
    selector: 'app-questions-wheel',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './questions-wheel.component.html',
    styleUrls: ['./questions-wheel.component.css']
})
export class QuestionsWheelComponent implements OnInit, OnDestroy {
    // Game States
    gameState: 'start' | 'instructions' | 'playing' | 'question' | 'results' = 'start';

    // Sound
    isMuted: boolean = false;

    // Visual Data
    visualSegments: VisualSegment[] = [];

    // M10: SVG geometry is now computed dynamically based on segment count
    private computeSegmentGeometry(count: number): SegmentGeometry[] {
        const segments: SegmentGeometry[] = [];
        const cx = 50, cy = 50, r = 48;
        const anglePerSegment = (2 * Math.PI) / count;

        for (let i = 0; i < count; i++) {
            const startAngle = i * anglePerSegment - Math.PI / 2;
            const endAngle = startAngle + anglePerSegment;
            const midAngle = startAngle + anglePerSegment / 2;

            const x1 = cx + r * Math.cos(startAngle);
            const y1 = cy + r * Math.sin(startAngle);
            const x2 = cx + r * Math.cos(endAngle);
            const y2 = cy + r * Math.sin(endAngle);
            const largeArc = anglePerSegment > Math.PI ? 1 : 0;

            const textR = r * 0.65;
            const textX = cx + textR * Math.cos(midAngle);
            const textY = cy + textR * Math.sin(midAngle);
            const textRotate = (midAngle * 180 / Math.PI) + 90;

            segments.push({
                id: i + 1,
                path: `M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${largeArc},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`,
                textX: parseFloat(textX.toFixed(2)),
                textY: parseFloat(textY.toFixed(2)),
                textRotate: parseFloat(textRotate.toFixed(2))
            });
        }
        return segments;
    }

    // Game Logic
    sessionId: number = 0;
    questions: WheelQuestion[] = [];
    currentQuestionIndex: number = 0;
    currentQuestion: WheelQuestion | null = null;

    // Turn State
    currentSpinResult: SpinResult | null = null;
    selectedAnswer: string | null = null;
    answerResult: 'correct' | 'wrong' | null = null;
    pointsChange: number = 0;

    // Timer & Stats from Server mostly, but tracked locally for UI
    timeLeft: number = 0; // m14: Will be set from API response
    timerInterval: any;
    score: number = 0;
    questionsAnswered: number = 0;
    correctAnswers: number = 0;
    timerExpired: boolean = false; // M5: Track if game ended by timer

    // Loading/Error states
    isLoading: boolean = false;
    gameLoadError: string = '';

    // Wheel Animation
    isSpinning: boolean = false;
    wheelRotation: number = 0;
    idleRotationInterval: any;

    // Question-level timer for tracking actual time spent per question
    private questionStartTime: number = 0;

    constructor(
        private wheelGameService: WheelGameService,
        private wheelSpinService: WheelSpinService,
        private audioService: AudioService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadSegments();
        this.startIdleRotation();
    }

    ngOnDestroy(): void {
        this.stopTimer();
        this.stopIdleRotation();
    }

    loadSegments(): void {
        this.wheelSpinService.getActiveSegments().subscribe({
            next: (segments) => {
                const count = Math.min(segments.length, 8); // Allow up to 8 segments
                const geometry = this.computeSegmentGeometry(count);

                // M10: Map backend segments to dynamically computed geometry
                this.visualSegments = segments.slice(0, count).map((seg, index) => {
                    const geo = geometry[index];
                    return {
                        ...seg,
                        path: geo.path,
                        textX: geo.textX,
                        textY: geo.textY,
                        textRotate: geo.textRotate
                    };
                });
            },
            error: (err) => console.error('Error loading segments', err)
        });
    }

    startGame(): void {
        this.isLoading = true;
        this.gameLoadError = '';

        // M11: Read subject and grade as integers consistently using shared helpers
        const gradeId = getSelectedGrade();
        const subjectId = getSelectedSubject();

        const testTypeStr = sessionStorage.getItem('testType');
        let testType: TestType | undefined;
        if (testTypeStr === 'nafes') testType = TestType.Nafes;
        else if (testTypeStr === 'central') testType = TestType.Central;

        const dto: StartWheelGameDto = {
            studentId: getStudentId() || undefined, // Anonymous support (0 or undefined)
            gradeId: gradeId,
            subjectId: subjectId,
            // m14: Remove hardcoded numberOfQuestions — let backend decide
            testType: testType
        };

        this.wheelGameService.startGame(dto).subscribe({
            next: (res) => {
                this.sessionId = res.sessionId;
                this.questions = res.questions;
                this.currentQuestionIndex = 0;
                this.score = 0;
                this.questionsAnswered = 0;
                this.correctAnswers = 0;
                this.timerExpired = false;

                // m15: Use timeLeft from API response if available
                this.timeLeft = res.timeLimit || res.questions.length * 15 || 90;

                this.gameState = 'instructions';
                this.isLoading = false;
                this.audioService.playClick();
            },
            error: (err) => {
                console.error('Error starting game', err);
                this.isLoading = false;
                this.gameLoadError = 'حدث خطأ في بدء اللعبة، يرجى المحاولة مرة أخرى';
            }
        });
    }

    beginPlaying(): void {
        this.audioService.playClick();
        this.gameState = 'playing';
        this.startTimer();
    }

    spinWheel(): void {
        if (this.isSpinning) return;
        this.stopIdleRotation();
        this.isSpinning = true;
        this.audioService.playSpin();

        this.wheelGameService.spinWheel({ sessionId: this.sessionId }).subscribe({
            next: (result) => {
                this.currentSpinResult = result;

                const spins = 5;
                const currentMod = this.wheelRotation % 360;
                let diff = result.rotationDegrees - currentMod;
                if (diff <= 0) diff += 360;

                this.wheelRotation += (spins * 360) + diff;

                setTimeout(() => {
                    this.isSpinning = false;
                    this.handleSpinComplete();
                }, 3000);
            },
            error: (err) => {
                console.error('Spin failed', err);
                this.isSpinning = false;
                this.startIdleRotation();
            }
        });
    }

    handleSpinComplete(): void {
        if (this.currentQuestionIndex < this.questions.length) {
            this.currentQuestion = this.questions[this.currentQuestionIndex];
            this.questionStartTime = Date.now(); // M3: Track question start time
            this.gameState = 'question';
            this.audioService.playClick();
        } else {
            this.endGame();
        }
    }

    selectAnswer(answer: string): void {
        if (this.answerResult !== null) return;
        this.selectedAnswer = answer;

        if (!this.currentQuestion) return;

        // M3: Calculate actual time spent on this question
        const timeSpentMs = Date.now() - this.questionStartTime;
        const timeSpentSeconds = Math.max(1, Math.round(timeSpentMs / 1000));

        this.wheelGameService.submitAnswer({
            sessionId: this.sessionId,
            questionId: this.currentQuestion.id,
            studentAnswer: answer,
            timeSpent: timeSpentSeconds, // M3: Actual measured time, not hardcoded 5
            hintUsed: false
        }).subscribe({
            next: (res) => {
                this.answerResult = res.isCorrect ? 'correct' : 'wrong';
                this.pointsChange = res.pointsEarned;
                this.score = res.totalScore;

                if (res.isCorrect) this.audioService.playCorrect();
                else this.audioService.playWrong();

                this.questionsAnswered++;
                if (res.isCorrect) this.correctAnswers++;

                setTimeout(() => {
                    this.closeQuestion();
                    if (res.sessionComplete) {
                        this.endGame();
                    }
                }, 2000);
            },
            error: (err) => console.error(err)
        });
    }

    closeQuestion(): void {
        this.currentQuestion = null;
        this.selectedAnswer = null;
        this.answerResult = null;
        this.currentQuestionIndex++;

        if (this.gameState !== 'results') {
            this.gameState = 'playing';
            this.startIdleRotation();
        }
    }

    // Timer Logic
    startTimer(): void {
        this.stopTimer(); // Clear any existing timer
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft <= 10) this.audioService.playTick();
            if (this.timeLeft <= 0) {
                this.timerExpired = true; // M5: Mark that timer caused the end
                this.endGame();
            }
        }, 1000);
    }

    stopTimer(): void {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Idle Animation
    startIdleRotation() {
        this.stopIdleRotation();
        this.idleRotationInterval = setInterval(() => {
            if (!this.isSpinning) this.wheelRotation += 0.2;
        }, 50);
    }

    stopIdleRotation() {
        if (this.idleRotationInterval) clearInterval(this.idleRotationInterval);
    }

    endGame(): void {
        this.stopTimer();
        this.gameState = 'results';
        this.audioService.playComplete();
    }

    // M5: Returns the correct result message based on HOW the game ended
    get resultMessage(): string {
        if (this.timerExpired) return 'انتهى الوقت!';
        if (this.questionsAnswered >= this.questions.length) return 'أحسنت! أكملت جميع الأسئلة!';
        return 'أحسنت!';
    }

    // M4: Properly reset all state
    playAgain(): void {
        this.stopTimer();
        this.stopIdleRotation();

        // Reset all game state
        this.sessionId = 0;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.currentQuestion = null;
        this.currentSpinResult = null;
        this.selectedAnswer = null;
        this.answerResult = null;
        this.pointsChange = 0;
        this.score = 0;
        this.questionsAnswered = 0;
        this.correctAnswers = 0;
        this.timerExpired = false;
        this.isSpinning = false;
        this.wheelRotation = 0;
        this.timeLeft = 0;
        this.gameLoadError = '';

        // Restart
        this.gameState = 'start';
        this.startIdleRotation();
        this.startGame();
    }

    goHome(): void {
        // m5: Navigate to game-type selection instead of root
        this.router.navigate(['/game-type']);
    }
}
