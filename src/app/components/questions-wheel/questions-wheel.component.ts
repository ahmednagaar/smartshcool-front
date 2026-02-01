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

    // Fixed Geometry for 6 segments
    private readonly SEGMENT_GEOMETRY: SegmentGeometry[] = [
        { id: 1, path: 'M50,50 L50,2 A48,48 0 0,1 91.57,26.5 Z', textX: 65, textY: 24, textRotate: 30 },
        { id: 2, path: 'M50,50 L91.57,26.5 A48,48 0 0,1 91.57,73.5 Z', textX: 80, textY: 52, textRotate: 90 },
        { id: 3, path: 'M50,50 L91.57,73.5 A48,48 0 0,1 50,98 Z', textX: 65, textY: 78, textRotate: 150 },
        { id: 4, path: 'M50,50 L50,98 A48,48 0 0,1 8.43,73.5 Z', textX: 35, textY: 78, textRotate: 210 },
        { id: 5, path: 'M50,50 L8.43,73.5 A48,48 0 0,1 8.43,26.5 Z', textX: 20, textY: 52, textRotate: 270 },
        { id: 6, path: 'M50,50 L8.43,26.5 A48,48 0 0,1 50,2 Z', textX: 35, textY: 24, textRotate: 330 }
    ];

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
    timeLeft: number = 90;
    timerInterval: any;
    score: number = 0;
    questionsAnswered: number = 0;
    correctAnswers: number = 0;

    // Wheel Animation
    isSpinning: boolean = false;
    wheelRotation: number = 0;
    idleRotationInterval: any;

    // Student Info
    studentId: number | null = null;

    constructor(
        private wheelGameService: WheelGameService,
        private wheelSpinService: WheelSpinService,
        private audioService: AudioService,
        private router: Router
    ) { }

    ngOnInit(): void {
        const id = sessionStorage.getItem('currentStudentId');
        if (id) {
            this.studentId = parseInt(id);
        }
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
                // Map backend segments to geometry. Limit to 6.
                this.visualSegments = segments.slice(0, 6).map((seg, index) => {
                    const geometry = this.SEGMENT_GEOMETRY[index];
                    return {
                        ...seg,
                        path: geometry.path,
                        textX: geometry.textX,
                        textY: geometry.textY,
                        textRotate: geometry.textRotate
                    };
                });
            },
            error: (err) => console.error('Error loading segments', err)
        });
    }

    startGame(): void {
        const gradeStr = sessionStorage.getItem('selectedGrade') || '4';
        const subjectStr = sessionStorage.getItem('selectedSubject');
        const testTypeStr = sessionStorage.getItem('testType');

        // Simple Mapping
        const subjectMap: { [key: string]: number } = { 'arabic': 1, 'math': 2, 'science': 3 };
        const subjectId = subjectStr ? subjectMap[subjectStr] : 1;

        let testType: TestType | undefined;
        if (testTypeStr === 'nafes') testType = TestType.Nafes;
        else if (testTypeStr === 'central') testType = TestType.Central;

        const dto: StartWheelGameDto = {
            studentId: this.studentId || undefined,
            gradeId: parseInt(gradeStr),
            subjectId: subjectId,
            numberOfQuestions: 15,
            testType: testType
        };

        this.wheelGameService.startGame(dto).subscribe({
            next: (res) => {
                this.sessionId = res.sessionId;
                this.questions = res.questions;
                this.currentQuestionIndex = 0;
                this.score = 0;
                this.gameState = 'instructions';
                this.audioService.playClick();
            },
            error: (err) => {
                console.error('Error starting game', err);
                alert('حدث خطأ في بدء اللعبة');
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

                // Calculate rotation
                // The backend returns 'rotationDegrees' which is where the wheel marks the result
                // We add extra full spins (360 * 5) for effect
                const spins = 5;
                // The backend rotationDegrees is absolute position (0-360).
                // Current CSS rotation is accumulated.

                // We want to land on 'result.rotationDegrees'.
                // Current total rotation: this.wheelRotation
                // Current Modulo: this.wheelRotation % 360

                // Target Modulo: result.rotationDegrees
                // Diff needed: result.rotationDegrees - (this.wheelRotation % 360)
                // If Diff < 0, add 360 to make it positive forward motion

                const currentMod = this.wheelRotation % 360;
                let diff = result.rotationDegrees - currentMod;
                if (diff <= 0) diff += 360; // Ensure at least some rotation? or forward

                // Add spins + diff
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

        this.wheelGameService.submitAnswer({
            sessionId: this.sessionId,
            questionId: this.currentQuestion.id,
            studentAnswer: answer,
            timeSpent: 5, // Mock time
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
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft <= 10) this.audioService.playTick();
            if (this.timeLeft <= 0) this.endGame();
        }, 1000);
    }

    stopTimer(): void {
        if (this.timerInterval) clearInterval(this.timerInterval);
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

    playAgain(): void {
        this.gameState = 'start';
        this.startGame();
    }

    goHome(): void {
        this.router.navigate(['/']);
    }
}
