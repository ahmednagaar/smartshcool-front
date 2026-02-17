import { DifficultyLevel, QuestionType, TestType } from './models';

export enum SegmentType {
    Points = 0,
    Bonus = 1,
    LoseTurn = 2,
    ExtraLife = 3,
    DoublePoints = 4,
    Mystery = 5
}

export interface WheelSpinSegment {
    id: number;
    segmentType: SegmentType;
    segmentValue: number;
    displayText: string;
    colorCode: string;
    probability: number;
    isActive: boolean;
}

export interface WheelQuestion {
    id: number;
    gradeId: number;
    subjectId: number;
    questionText: string;
    questionType: QuestionType;
    correctAnswer: string;
    options: string[]; // Front-end receives array
    wrongAnswers?: string[]; // For create/update
    difficultyLevel: DifficultyLevel;
    pointsValue: number;
    timeLimit: number;
    hintText?: string;
    explanation?: string;
    categoryTag?: string;
    displayOrder?: number;
    isActive: boolean;
}

export interface CreateWheelQuestionDto {
    gradeId: number;
    subjectId: number;
    questionText: string;
    questionType: QuestionType;
    correctAnswer: string;
    wrongAnswers: string[];
    difficultyLevel: DifficultyLevel;
    pointsValue?: number;
    timeLimit?: number;
    hintText?: string;
    explanation?: string;
    categoryTag?: string;
    displayOrder?: number;
}

export interface StartWheelGameDto {
    studentId?: number;
    gradeId: number;
    subjectId: number;
    numberOfQuestions?: number;
    difficultyLevel?: DifficultyLevel;
    testType?: TestType;
}

export interface StartGameResponse {
    sessionId: number;
    totalQuestions: number;
    timeLimit: number; // m15: Server-configured time limit in seconds
    questions: WheelQuestion[];
    session: any; // Raw session object if needed
}

export interface SpinWheelDto {
    sessionId: number;
}

export interface SpinResult {
    segmentType: SegmentType;
    value: number;
    displayText: string;
    colorCode: string;
    rotationDegrees: number;
    specialEffect?: string;
}

export interface SubmitAnswerDto {
    sessionId: number;
    questionId: number;
    studentAnswer: string;
    timeSpent: number;
    hintUsed: boolean;
}

export interface AnswerResult {
    isCorrect: boolean;
    pointsEarned: number;
    correctAnswer: string;
    explanation?: string;
    totalScore: number;
    questionsRemaining: number;
    sessionComplete: boolean;
    nextQuestionId?: number;
}

export interface GetHintDto {
    sessionId: number;
    questionId: number;
}

export interface HintResponse {
    hintText: string;
    pointsPenalty: number;
}

export interface SessionCompleteResult {
    sessionId: number;
    finalScore: number;
    correctAnswers: number;
    totalQuestions: number;
    accuracy: number;
    timeSpent: number;
    rank: number;
    achievements: string[];
    improvementTips: string[];
}

export interface WheelLeaderboardEntry {
    rank: number;
    studentId?: number;
    studentName: string;
    score: number;
    accuracy: number;
    timeSpent: number;
    datePlayed: Date;
    isCurrentUser: boolean;
}

export interface StudentStatistics {
    totalGamesPlayed: number;
    averageScore: number;
    bestScore: number;
    totalCorrectAnswers: number;
    totalQuestionsAnswered: number;
    favoriteSubject: string;
    averageTimePerGame: number;
    hintsUsedTotal: number;
}
