import { GradeLevel, SubjectType } from './models';
export { GradeLevel, SubjectType };

export enum MatchingMode {
    ClickToClick = 0,
    DragDrop = 1,
    Both = 2
}

export enum MatchingTimerMode {
    None = 0,
    CountUp = 1,
    Countdown = 2
}

export enum MatchingContentType {
    Text = 0,
    Image = 1,
    TextAndImage = 2,
    Audio = 3,
    Mixed = 4
}

export enum DifficultyLevel {
    Easy = 1,
    Medium = 2,
    Hard = 3
}

export interface MatchingGameDto {
    id: number; // long
    gameTitle: string;
    instructions: string;
    gradeId: GradeLevel;
    subjectId: SubjectType;
    numberOfPairs: number;
    matchingMode: MatchingMode;
    uiTheme: string;
    showConnectingLines: boolean;
    enableAudio: boolean;
    enableHints: boolean;
    maxHints: number;
    timerMode: MatchingTimerMode;
    timeLimitSeconds?: number;
    pointsPerMatch: number;
    wrongMatchPenalty: number;
    difficultyLevel: DifficultyLevel;
    category: string;
    isActive: boolean;
    displayOrder: number;
    createdDate: Date;
    pairs: MatchingGamePairDto[];
}

export interface MatchingGamePairDto {
    id: number; // long
    questionText: string;
    questionImageUrl?: string;
    questionAudioUrl?: string;
    questionType: MatchingContentType;
    answerText: string;
    answerImageUrl?: string;
    answerAudioUrl?: string;
    answerType: MatchingContentType;
    explanation?: string;
    pairOrder: number;
}

export interface CreateMatchingGameDto {
    gameTitle: string;
    instructions: string;
    gradeId: GradeLevel;
    subjectId: SubjectType;
    numberOfPairs: number;
    matchingMode: MatchingMode;
    uiTheme: string;
    showConnectingLines: boolean;
    enableAudio: boolean;
    enableHints: boolean;
    maxHints: number;
    timerMode: MatchingTimerMode;
    timeLimitSeconds?: number;
    pointsPerMatch: number;
    wrongMatchPenalty: number;
    difficultyLevel: DifficultyLevel;
    category: string;
    pairs: CreateMatchingGamePairDto[];
}

export interface CreateMatchingGamePairDto {
    questionText: string;
    questionImageUrl?: string;
    questionAudioUrl?: string;
    questionType: MatchingContentType;
    answerText: string;
    answerImageUrl?: string;
    answerAudioUrl?: string;
    answerType: MatchingContentType;
    explanation?: string;
}

export interface UpdateMatchingGameDto extends CreateMatchingGameDto {
    id: number; // long
    isActive: boolean;
    displayOrder: number;
}

export interface StartMatchingGameDto {
    studentId?: number; // long (optional for frontend as backend gets it from token usually, but here explicit)
    gradeId: GradeLevel;
    subjectId: SubjectType;
    gameId?: number; // long
    difficultyLevel?: DifficultyLevel;
}

export interface MatchingGameStartResponseDto {
    sessionId: number; // long
    gameTitle: string;
    instructions: string;
    numberOfPairs: number;
    matchingMode: MatchingMode;
    uiTheme: string;
    showConnectingLines: boolean;
    enableAudio: boolean;
    enableHints: boolean;
    maxHints: number;
    timerMode: MatchingTimerMode;
    timeLimitSeconds?: number;
    questions: GameCardDto[];
    answers: GameCardDto[];
}

export interface GameCardDto {
    id: number; // long (PairId)
    text: string;
    imageUrl?: string;
    audioUrl?: string;
    type: MatchingContentType;
}

export interface ValidateMatchDto {
    sessionId: number; // long
    questionId: number; // long (PairId)
    answerId: number; // long (PairId)
    timeToMatchMs: number;
}

export interface MatchResultDto {
    isCorrect: boolean;
    pointsEarned: number;
    totalScore: number;
    matchedPairs: number;
    totalPairs: number;
    explanation?: string;
    message: string;
    isGameComplete: boolean;
}

export interface HintResponseDto {
    questionId: number; // long
    answerId: number; // long
    hintsRemaining: number;
    message: string;
}

export interface SessionCompleteDto {
    sessionId: number; // long
    finalScore: number;
    matchedPairs: number;
    totalPairs: number;
    totalMoves: number;
    wrongAttempts: number;
    timeSpent: number;
    starRating: number;
    rank: number;
    achievements: string[];
}

export interface MatchingLeaderboardDto {
    rank: number;
    studentId: number; // long
    studentName: string;
    score: number;
    timeSpent: number;
    datePlayed: Date;
}
