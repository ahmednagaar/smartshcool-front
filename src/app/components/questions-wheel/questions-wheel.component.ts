import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AudioService } from '../../services/audio.service';

interface ScoreLevel {
    id: number;
    points: number;
    label: string; // Text to display on segment
    color: string;
    bgColor: string;
    // SVG geometry for the segment
    path: string;
    textX: number;
    textY: number;
    textRotate: number;
}

interface WheelQuestion {
    id: number;
    text: string;
    options: string[];
    correctAnswer: string;
}

interface WheelGameResultDto {
    studentId: number;
    finalScore: number;
    questionsAnswered: number;
    correctAnswers: number;
    timeSpentSeconds: number;
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

    // Score Levels with geometry data for dynamic rendering
    scoreLevels: ScoreLevel[] = [
        { id: 1, points: 1, label: '+1', color: '#FF4B4B', bgColor: 'rgba(255, 75, 75, 0.15)', path: 'M50,50 L50,2 A48,48 0 0,1 91.57,26.5 Z', textX: 65, textY: 24, textRotate: 30 },
        { id: 2, points: 2, label: '+2', color: '#FFC04C', bgColor: 'rgba(255, 192, 76, 0.15)', path: 'M50,50 L91.57,26.5 A48,48 0 0,1 91.57,73.5 Z', textX: 80, textY: 52, textRotate: 90 },
        { id: 3, points: 3, label: '+3', color: '#10A076', bgColor: 'rgba(16, 160, 118, 0.15)', path: 'M50,50 L91.57,73.5 A48,48 0 0,1 50,98 Z', textX: 65, textY: 78, textRotate: 150 },
        { id: 4, points: 4, label: '+4', color: '#62D0E6', bgColor: 'rgba(98, 208, 230, 0.15)', path: 'M50,50 L50,98 A48,48 0 0,1 8.43,73.5 Z', textX: 35, textY: 78, textRotate: 210 },
        { id: 5, points: 5, label: '+5', color: '#FF7F64', bgColor: 'rgba(255, 127, 100, 0.15)', path: 'M50,50 L8.43,73.5 A48,48 0 0,1 8.43,26.5 Z', textX: 20, textY: 52, textRotate: 270 },
        { id: 6, points: 6, label: '+6', color: '#F8A8D7', bgColor: 'rgba(248, 168, 215, 0.15)', path: 'M50,50 L8.43,26.5 A48,48 0 0,1 50,2 Z', textX: 35, textY: 24, textRotate: 330 }
    ];

    // Timer
    timeLeft: number = 90; // 1:30 in seconds
    timerInterval: any;
    startTime: Date = new Date();

    // Score
    score: number = 0;
    questionsAnswered: number = 0;
    correctAnswers: number = 0;

    // Wheel
    isSpinning: boolean = false;
    wheelRotation: number = 0;
    selectedScoreLevel: ScoreLevel | null = null;

    // Question
    currentQuestion: WheelQuestion | null = null;
    selectedAnswer: string | null = null;
    answerResult: 'correct' | 'wrong' | null = null;
    pointsChange: number = 0;

    // Student
    studentId: number | null = null;
    studentName: string = '';

    // New Achievement
    newAchievements: string[] = [];

    // Idle Rotation
    idleRotationInterval: any;

    // Sample Questions (Removed, using API)
    sampleQuestions: WheelQuestion[] = [];

    constructor(
        private api: ApiService,
        private router: Router,
        private audioService: AudioService
    ) { }

    ngOnInit() {
        // Get student info from session
        const id = sessionStorage.getItem('currentStudentId');
        if (id) {
            this.studentId = parseInt(id);
            this.studentName = sessionStorage.getItem('currentStudentName') || '';
        }

        // Load questions pool
        this.loadQuestionsPool();
    }

    loadQuestionsPool() {
        // Load questions from API using Search for flexibility
        const gradeStr = sessionStorage.getItem('selectedGrade') || '3';
        const grade = parseInt(gradeStr);

        // Get selected subject
        const subjectStr = sessionStorage.getItem('selectedSubject');
        let subjectId: number | undefined;

        if (subjectStr) {
            const subjectMap: { [key: string]: number } = {
                'arabic': 1,
                'math': 2,
                'science': 3
            };
            subjectId = subjectMap[subjectStr];
        }

        // Filter by subject if selected, otherwise fetch all (default behavior)
        this.api.searchQuestions(grade, subjectId).subscribe({
            next: (response: any) => {
                const data = response.items || [];
                if (data && data.length > 0) {
                    this.sampleQuestions = data.map((q: any) => ({
                        id: q.id,
                        text: q.text,
                        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
                        correctAnswer: q.correctAnswer
                    }));

                    // Shuffle logic if desired, though Search might return by CreatedDate.
                    // Let's randomize the order so players get different questions each time.
                    this.sampleQuestions.sort(() => Math.random() - 0.5);
                }
            },
            error: (err: any) => {
                console.error('Failed to load wheel questions', err);
            }
        });
    }


    ngOnDestroy() {
        this.stopTimer();
        this.stopIdleRotation();
    }

    // Sound Toggle
    toggleMute() {
        this.isMuted = this.audioService.toggleMute();
    }

    // Navigation
    startGame() {
        this.audioService.playClick();
        this.gameState = 'instructions';
    }

    beginPlaying() {
        this.audioService.playClick();
        this.gameState = 'playing';
        this.score = 0;
        this.questionsAnswered = 0;
        this.correctAnswers = 0;
        this.timeLeft = 90;
        this.startTime = new Date();
        this.startTimer();
        this.startIdleRotation();
    }

    goHome() {
        this.router.navigate(['/']);
    }

    // Timer
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeLeft--;

            // Play tick sound for last 10 seconds
            if (this.timeLeft <= 10 && this.timeLeft > 0) {
                this.audioService.playTick();
            }

            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Idle Rotation
    startIdleRotation() {
        this.stopIdleRotation();
        this.idleRotationInterval = setInterval(() => {
            if (!this.isSpinning) {
                this.wheelRotation += 0.2; // Slow rotation
            }
        }, 50);
    }

    stopIdleRotation() {
        if (this.idleRotationInterval) {
            clearInterval(this.idleRotationInterval);
            this.idleRotationInterval = null;
        }
    }

    // Wheel
    spinWheel() {
        if (this.isSpinning) return;

        this.stopIdleRotation(); // Stop idle rotation before spinning

        this.audioService.playSpin();
        this.isSpinning = true;
        const spins = 5 + Math.random() * 5; // 5-10 full rotations
        const extraDegrees = Math.random() * 360;
        this.wheelRotation += spins * 360 + extraDegrees;

        // Determine which score level was selected based on final rotation
        setTimeout(() => {
            const normalizedRotation = this.wheelRotation % 360;
            // The wheel has 6 segments. 360/6 = 60 degrees per segment.
            // Adjust index logic as needed to match visual slice to ID
            const segmentIndex = Math.floor(normalizedRotation / 60) % 6;

            // Map segment to score level. 
            // Note: SVG paths usually arranged clockwise. Pointers usually at top/right.
            // Assuming standard distribution for now.
            this.selectedScoreLevel = this.scoreLevels[segmentIndex];

            this.isSpinning = false;
            this.audioService.playClick();

            // Resume idle rotation after a delay or keep stopped? 
            // Usually stop while answering.

            // Auto open question
            this.loadQuestion();
        }, 3000);
    }

    loadQuestion() {
        // Just pick a random question from the pool since we only have one subject
        if (this.sampleQuestions.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.sampleQuestions.length);
            this.currentQuestion = this.sampleQuestions[randomIndex];
            this.selectedAnswer = null;
            this.answerResult = null;
            this.gameState = 'question';
        }
    }

    // Answer Handling
    selectAnswer(answer: string) {
        if (this.answerResult !== null) return; // Already answered

        this.selectedAnswer = answer;
        const isCorrect = answer === this.currentQuestion?.correctAnswer;
        this.answerResult = isCorrect ? 'correct' : 'wrong';
        const points = this.selectedScoreLevel ? this.selectedScoreLevel.points : 1;
        this.pointsChange = isCorrect ? points : -points;
        this.score += this.pointsChange;
        this.questionsAnswered++;

        if (isCorrect) {
            this.correctAnswers++;
            this.audioService.playCorrect();
        } else {
            this.audioService.playWrong();
        }

        // Auto close after 1.5 seconds
        setTimeout(() => {
            this.closeQuestion();
        }, 1500);
    }

    closeQuestion() {
        this.currentQuestion = null;
        this.selectedAnswer = null;
        this.answerResult = null;
        this.gameState = 'playing';
        this.startIdleRotation();
    }

    // End Game
    endGame() {
        this.stopTimer();
        this.audioService.playComplete();
        this.gameState = 'results';

        // Save result to backend
        this.saveGameResult();
    }

    saveGameResult() {
        if (!this.studentId) return;

        const timeSpent = 90 - this.timeLeft;
        const result: WheelGameResultDto = {
            studentId: this.studentId,
            finalScore: this.score,
            questionsAnswered: this.questionsAnswered,
            correctAnswers: this.correctAnswers,
            timeSpentSeconds: timeSpent
        };

        this.api.post('/wheel/result', result).subscribe({
            next: (response: any) => {
                console.log('Game result saved:', response);
                // Check for new achievements
                if (response.newAchievements && response.newAchievements.length > 0) {
                    this.newAchievements = response.newAchievements;
                    this.audioService.playAchievement();
                }
            },
            error: (err: Error) => {
                console.log('Could not save game result:', err);
            }
        });
    }

    playAgain() {
        this.audioService.playClick();
        this.gameState = 'start';
        this.score = 0;
        this.questionsAnswered = 0;
        this.correctAnswers = 0;
        this.newAchievements = [];
    }

    getScoreLevelById(id: number): ScoreLevel | undefined {
        return this.scoreLevels.find(s => s.id === id);
    }
}
